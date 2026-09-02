/**
 * api/leads/[id]/route.ts
 * GET    /api/leads/:id
 * PATCH  /api/leads/:id
 * DELETE /api/leads/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { LeadUpdateSchema } from "@/lib/schemas";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";
import {
  notifyLeadStatusChanged,
  notifyLeadAssigned,
  notifyLeadFollowupScheduled,
  notifyLoanEvent,
} from "@/lib/notification.service";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.READ,
    );

    const { id } = await params;

    const lead = await db.lead.findFirst({
      where: {
        id,

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
      },

      include: {
        branch: true,

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

        timelines: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        student: true,
      },
    });

    if (!lead) {
      return notFound("Lead");
    }

    return ok(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.UPDATE,
    );

    const { id } = await params;
    const body = LeadUpdateSchema.parse(await req.json());

    const {
      counselorIds,
      englishTests,
      assignedCounselorId: _assignedCounselorId,
      fintechAssigneeId,
      followupDate,
      followupNote,
      branchId,

      preferredCountryId,
      preferredUniversityId,
      preferredUniversityName,
      preferredCourseId,
      preferredCourseName,

      ...leadData
    } = body;

    const existingLead = await db.lead.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        studentName: true,
        leadNumber: true,
        branchId: true,
        fintechAssigneeId: true,
        counselors: {
          select: {
            counselorId: true,
          },
        },
      },
    });

    if (!existingLead) {
      return notFound("Lead");
    }

    const previousCounselorIds = existingLead.counselors.map(
      (assignment) => assignment.counselorId,
    );

    const uniqueCounselorIds =
      counselorIds !== undefined
        ? Array.from(new Set(counselorIds))
        : undefined;

    const newlyAssignedCounselorIds =
      uniqueCounselorIds?.filter(
        (counselorId) => !previousCounselorIds.includes(counselorId),
      ) ?? [];
    const fintechAssigned =
      fintechAssigneeId && fintechAssigneeId !== existingLead.fintechAssigneeId;
    const lead = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      let resolvedCountryId = preferredCountryId;
      let resolvedUniversityId = preferredUniversityId;
      let resolvedCourseId = preferredCourseId;

      // ---------------------------------------------------------
      // COUNTRY
      // ---------------------------------------------------------
      if (resolvedUniversityId && resolvedCountryId) {
        const university = await tx.university.findUnique({
          where: {
            id: resolvedUniversityId,
          },
          select: {
            id: true,
            countryId: true,
          },
        });

        if (!university) {
          throw new Error("Preferred university not found");
        }

        if (university.countryId !== resolvedCountryId) {
          throw new Error(
            "Preferred university does not belong to the selected country",
          );
        }
      }

      // ---------------------------------------------------------
      // UNIVERSITY
      // Existing university OR create new university
      // ---------------------------------------------------------
      if (!resolvedUniversityId && preferredUniversityName?.trim()) {
        if (!resolvedCountryId) {
          throw new Error(
            "Preferred country is required when entering a university",
          );
        }

        const universityName = preferredUniversityName.trim();

        const existingUniversity = await tx.university.findFirst({
          where: {
            countryId: resolvedCountryId,
            name: {
              equals: universityName,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            countryId: true,
          },
        });

        if (existingUniversity) {
          resolvedUniversityId = existingUniversity.id;
        } else {
          const newUniversity = await tx.university.create({
            data: {
              name: universityName,
              countryId: resolvedCountryId,
              tier: "T4",
              status: "active",
            },
            select: {
              id: true,
              countryId: true,
            },
          });

          resolvedUniversityId = newUniversity.id;
        }
      }

      // ---------------------------------------------------------
      // COURSE
      // Existing course OR create new course
      // ---------------------------------------------------------
      if (!resolvedCourseId && preferredCourseName?.trim()) {
        if (!resolvedUniversityId) {
          throw new Error(
            "Preferred university is required when entering a course",
          );
        }

        const courseName = preferredCourseName.trim();

        const existingCourse = await tx.universityCourse.findFirst({
          where: {
            universityId: resolvedUniversityId,
            name: {
              equals: courseName,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            universityId: true,
          },
        });

        if (existingCourse) {
          resolvedCourseId = existingCourse.id;
        } else {
          const newCourse = await tx.universityCourse.create({
            data: {
              name: courseName,
              universityId: resolvedUniversityId,
              status: true,
            },
            select: {
              id: true,
              universityId: true,
            },
          });

          resolvedCourseId = newCourse.id;
        }
      }

      // ---------------------------------------------------------
      // Validate course belongs to university
      // ---------------------------------------------------------
      if (resolvedCourseId && resolvedUniversityId) {
        const course = await tx.universityCourse.findUnique({
          where: {
            id: resolvedCourseId,
          },
          select: {
            id: true,
            universityId: true,
          },
        });

        if (!course) {
          throw new Error("Preferred course not found");
        }

        if (course.universityId !== resolvedUniversityId) {
          throw new Error(
            "Preferred course does not belong to the selected university",
          );
        }
      }

      const updateData: Prisma.LeadUpdateInput = {
        ...leadData,

        ...(preferredCountryId !== undefined && {
          preferredCountry: resolvedCountryId
            ? {
                connect: {
                  id: resolvedCountryId,
                },
              }
            : {
                disconnect: true,
              },
        }),

        ...((preferredUniversityId !== undefined ||
          preferredUniversityName !== undefined) && {
          preferredUniversity: resolvedUniversityId
            ? {
                connect: {
                  id: resolvedUniversityId,
                },
              }
            : {
                disconnect: true,
              },
        }),

        ...((preferredCourseId !== undefined ||
          preferredCourseName !== undefined) && {
          preferredCourse: resolvedCourseId
            ? {
                connect: {
                  id: resolvedCourseId,
                },
              }
            : {
                disconnect: true,
              },
        }),

        ...(body.status !== undefined && {
          status: body.status,
        }),

        ...(branchId !== undefined &&
          branchId && {
            branch: {
              connect: {
                id: branchId,
              },
            },
          }),

        fintechAssignee:
          fintechAssigneeId === undefined
            ? undefined
            : fintechAssigneeId
              ? {
                  connect: {
                    id: fintechAssigneeId,
                  },
                }
              : {
                  disconnect: true,
                },

        updatedBy: {
          connect: {
            id: currentUser.id,
          },
        },
      };

      if (followupDate) {
        updateData.nextFollowup = new Date(followupDate);
      }

      await tx.lead.update({
        where: {
          id,
        },
        data: updateData,
      });
      await tx.loanApplication.updateMany({
        where: {
          leadId: id,
        },
        data: {
          fintechAssigneeId: leadData.loanRequirement
            ? (fintechAssigneeId ?? null)
            : null,

          counselorId: uniqueCounselorIds?.[0] ?? undefined,
        },
      });
      if (uniqueCounselorIds !== undefined) {
        await tx.leadCounselor.deleteMany({
          where: {
            leadId: id,
          },
        });

        if (uniqueCounselorIds.length > 0) {
          await tx.leadCounselor.createMany({
            data: uniqueCounselorIds.map((counselorId, index) => ({
              leadId: id,
              counselorId,
              assignedById: currentUser.id,
              isPrimary: index === 0,
            })),
          });
        }
      }

      if (englishTests !== undefined) {
        await tx.leadEnglishTest.deleteMany({
          where: {
            leadId: id,
          },
        });

        if (englishTests.length > 0) {
          await tx.leadEnglishTest.createMany({
            data: englishTests.map((test) => ({
              leadId: id,
              testType: test.testType,
              totalScore: test.totalScore,
              listeningScore: test.listeningScore,
              readingScore: test.readingScore,
              writingScore: test.writingScore,
              speakingScore: test.speakingScore,
            })),
          });
        }
      }

      if (followupDate || followupNote?.trim()) {
        await tx.leadTimeline.create({
          data: {
            leadId: id,
            description: followupNote?.trim() || "Follow-up scheduled",
            nextFollowup: followupDate ? new Date(followupDate) : null,
            createdById: currentUser.id,
            updatedById: currentUser.id,
          },
        });
      }

      const updatedLead = await tx.lead.findUniqueOrThrow({
        where: {
          id,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
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
          counselors: {
            select: {
              isPrimary: true,
              counselorId: true,
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
          timelines: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              updatedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              timelines: true,
            },
          },
        },
      });

      const leadForNotification = {
        id: updatedLead.id,
        leadNumber: updatedLead.leadNumber,
        studentName: updatedLead.studentName,
        branchId: updatedLead.branchId,
        counselors: updatedLead.counselors.map((assignment) => ({
          counselorId: assignment.counselorId,
        })),
      };

      if (body.status !== undefined && body.status !== existingLead.status) {
        await notifyLeadStatusChanged(
          leadForNotification,
          existingLead.status,
          body.status,
          currentUser.id,
          tx,
        );
      }

      if (newlyAssignedCounselorIds.length > 0) {
        await notifyLeadAssigned(
          leadForNotification,
          newlyAssignedCounselorIds,
          currentUser.id,
          tx,
        );
      }
      if (fintechAssigned) {
        await notifyLoanEvent(
          {
            id: updatedLead.id,
            fullName: updatedLead.studentName ?? "Unknown Applicant",
            branchId: updatedLead.branchId,
            counselorId: updatedLead.counselors[0]?.counselorId ?? null,
            fintechAssigneeId,
          },
          "LOAN_CREATED",
          currentUser.id,
          tx,
        );
      }
      if (followupDate) {
        await notifyLeadFollowupScheduled(
          leadForNotification,
          new Date(followupDate),
          followupNote?.trim(),
          currentUser.id,
          tx,
        );
      }

      return updatedLead;
    });

    const accessToken = req.cookies.get("access_token")?.value;

    if (accessToken) {
      await triggerNotificationProcessor(accessToken);
    }

    return ok(lead, "Lead updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(req, MODULES.MASTER_LEADS, PERMISSIONS.DELETE);

    const { id } = await params;

    const existingLead = await db.lead.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existingLead) {
      return notFound("Lead");
    }

    await db.lead.delete({
      where: {
        id,
      },
    });

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
