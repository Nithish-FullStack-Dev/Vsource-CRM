/**
 * api/leads/route.ts
 * GET  /api/leads — list leads with rich filters
 * POST /api/leads — create a lead
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { LeadCreateSchema } from "@/lib/schemas";
import { LeadStatus, LeadType } from "@/generated/prisma/enums";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";
import {
  notifyLeadCreated,
  notifyLoanAssignment,
  notifyLoanEvent,
} from "@/lib/notification.service";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.READ,
    );

    const searchParams = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(searchParams);

    const search = searchParams.get("search") ?? undefined;
    const branchId = searchParams.get("branchId") ?? undefined;
    const status = searchParams.get("status") as LeadStatus | null;
    const leadType = searchParams.get("leadType") as LeadType | null;
    const source = searchParams.get("source") ?? undefined;
    const preferredCountryId =
      searchParams.get("preferredCountryId") ?? undefined;
    const isConverted =
      searchParams.get("isConverted") !== null
        ? searchParams.get("isConverted") === "true"
        : undefined;

    const fromValue = searchParams.get("from");
    const toValue = searchParams.get("to");

    const from = fromValue ? new Date(fromValue) : undefined;
    const to = toValue ? new Date(toValue) : undefined;

    const andFilters: Prisma.LeadWhereInput[] = [];

    if (currentUser.role.name === ROLES.BRANCH_MANAGER) {
      andFilters.push({
        branchId: {
          in: currentUser.branches.map((branch) => branch.id),
        },
      });
    } else if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR
    ) {
      andFilters.push({
        OR: [
          {
            createdById: currentUser.id,
          },
          {
            counselors: {
              some: {
                counselorId: currentUser.id,
              },
            },
          },
        ],
      });
    }

    const where: Prisma.LeadWhereInput = {
      ...(branchId ? { branchId } : {}),
      ...(status ? { status } : {}),
      ...(leadType ? { leadType } : {}),
      ...(isConverted !== undefined ? { isConverted } : {}),
      ...(source ? { source } : {}),
      ...(preferredCountryId
        ? {
            preferredCountryId,
          }
        : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                studentName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                mobileNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                emailId: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                leadNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(andFilters.length > 0
        ? {
            AND: andFilters,
          }
        : {}),
    };

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          counselors: {
            select: {
              isPrimary: true,
              counselor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          preferredCountry: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          preferredUniversity: {
            select: {
              id: true,
              name: true,
              countryId: true,
              tier: true,
            },
          },

          preferredCourse: {
            select: {
              id: true,
              name: true,
              universityId: true,
            },
          },
          fintechAssignee: {
            select: {
              id: true,
              name: true,
            },
          },
          englishTests: {
            orderBy: {
              createdAt: "asc",
            },
          },
          timelines: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              description: true,
              nextFollowup: true,
              createdAt: true,
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              timelines: true,
            },
          },
        },
      }),
      db.lead.count({
        where,
      }),
    ]);

    return ok(leads, undefined, buildMeta(total, page, limit));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.CREATE,
    );
    const accessToken = req.cookies.get("access_token")?.value;

    const json = await req.json();

    console.log("Incoming Lead Data:");
    console.log(JSON.stringify(json, null, 2));

    const body = LeadCreateSchema.parse(json);
    const {
      counselorIds,
      englishTests,
      assignedCounselorId: _assignedCounselorId,
      fintechAssigneeId,
      ...leadData
    } = body;
    const fintechId = Array.isArray(fintechAssigneeId)
      ? (fintechAssigneeId[0] ?? null)
      : (fintechAssigneeId ?? null);
    const latestLead = await db.lead.findFirst({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        leadNumber: true,
      },
    });

    const latestNumber = latestLead?.leadNumber
      ? Number.parseInt(latestLead.leadNumber.replace(/^LD/, ""), 10)
      : 0;

    const nextLeadNumber = Number.isNaN(latestNumber) ? 1 : latestNumber + 1;

    const leadNumber = `LD${String(nextLeadNumber).padStart(4, "0")}`;

    const duplicateFilters: Prisma.LeadWhereInput[] = [];

    if (leadData.mobileNumber) {
      duplicateFilters.push({
        mobileNumber: leadData.mobileNumber,
      });
    }

    if (leadData.emailId) {
      duplicateFilters.push({
        emailId: leadData.emailId,
      });
    }

    if (duplicateFilters.length > 0) {
      const existingLead = await db.lead.findFirst({
        where: {
          OR: duplicateFilters,
        },
        select: {
          mobileNumber: true,
          emailId: true,
        },
      });

      if (
        existingLead &&
        leadData.mobileNumber &&
        existingLead.mobileNumber === leadData.mobileNumber
      ) {
        throw new Error("Mobile number already exists");
      }

      if (
        existingLead &&
        leadData.emailId &&
        existingLead.emailId === leadData.emailId
      ) {
        throw new Error("Email address already exists");
      }
    }

    const selectedCounselorIds = Array.from(
      new Set([currentUser.id, ...(counselorIds ?? [])]),
    );

    const lead = await db.$transaction(async (tx) => {
      let preferredUniversityId = leadData.preferredUniversityId ?? null;
      let preferredCourseId = leadData.preferredCourseId ?? null;


      // ---------------------------------------------------------
      // Resolve / create preferred university
      // ---------------------------------------------------------
      if (!preferredUniversityId && leadData.preferredUniversityName?.trim()) {
        if (!leadData.preferredCountryId) {
          throw new Error(
            "Preferred country is required when entering a university",
          );
        }

        const universityName = leadData.preferredUniversityName.trim();

        const existingUniversity = await tx.university.findFirst({
          where: {
            countryId: leadData.preferredCountryId,
            name: {
              equals: universityName,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

        if (existingUniversity) {
          preferredUniversityId = existingUniversity.id;
        } else {
          const newUniversity = await tx.university.create({
            data: {
              name: universityName,
              countryId: leadData.preferredCountryId,
              tier: "T4",
              status: "active",
            },
            select: {
              id: true,
            },
          });

          preferredUniversityId = newUniversity.id;
        }
      }

      // ---------------------------------------------------------
      // Resolve / create preferred course
      // ---------------------------------------------------------
      if (!preferredCourseId && leadData.preferredCourseName?.trim()) {
        if (!preferredUniversityId) {
          throw new Error(
            "Preferred university is required when entering a course",
          );
        }

        const courseName = leadData.preferredCourseName.trim();

        const existingCourse = await tx.universityCourse.findFirst({
          where: {
            universityId: preferredUniversityId,
            name: {
              equals: courseName,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

        if (existingCourse) {
          preferredCourseId = existingCourse.id;
        } else {
          const newCourse = await tx.universityCourse.create({
            data: {
              name: courseName,
              universityId: preferredUniversityId,
              status: true,
            },
            select: {
              id: true,
            },
          });

          preferredCourseId = newCourse.id;
        }
      }

      const {
        preferredUniversityName: _preferredUniversityName,
        preferredCourseName: _preferredCourseName,
        ...cleanLeadData
      } = leadData;

      const createdLead = await tx.lead.create({
        data: {
          ...cleanLeadData,

          preferredUniversityId,
          preferredCourseId,

          leadNumber,
          createdById: currentUser.id,
          updatedById: currentUser.id,
          fintechAssigneeId: fintechId,

          counselors:
            selectedCounselorIds.length > 0
              ? {
                  create: selectedCounselorIds.map((counselorId, index) => ({
                    counselorId,
                    assignedById: currentUser.id,
                    isPrimary: index === 0,
                  })),
                }
              : undefined,

          englishTests:
            englishTests && englishTests.length > 0
              ? {
                  create: englishTests.map((test) => ({
                    testType: test.testType,
                    totalScore: test.totalScore,
                    listeningScore: test.listeningScore,
                    readingScore: test.readingScore,
                    writingScore: test.writingScore,
                    speakingScore: test.speakingScore,
                  })),
                }
              : undefined,
        },

        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

    

          preferredUniversity: {
            select: {
              id: true,
              name: true,
              countryId: true,
              tier: true,
            },
          },

          preferredCourse: {
            select: {
              id: true,
              name: true,
              universityId: true,
            },
          },

          counselors: {
            select: {
              isPrimary: true,
              counselor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          englishTests: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      await notifyLeadCreated(
        {
          id: createdLead.id,
          leadNumber: createdLead.leadNumber,
          studentName: createdLead.studentName,
          branchId: createdLead.branchId,
          counselors: createdLead.counselors.map((assignment) => ({
            counselorId: assignment.counselor.id,
          })),
        },
        currentUser.id,
        tx,
      );
      if (createdLead.loanRequirement && fintechId) {
        await notifyLoanAssignment(
          {
            leadId: createdLead.id,
            leadNumber: createdLead.leadNumber,
            studentName: createdLead.studentName,
            branchId: createdLead.branchId,
            fintechAssigneeId: fintechId,
          },
          currentUser.id,
          tx,
        );
      }
      return createdLead;
    });

    await triggerNotificationProcessor(accessToken);

    return created(lead, "Walkin created successfully");
  } catch (error) {
    return handleError(error);
  }
}
