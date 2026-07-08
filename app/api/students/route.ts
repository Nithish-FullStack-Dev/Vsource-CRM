// app/api/students/route.ts

import { NextRequest } from "next/server";

import db from "@/lib/prisma";
import {
  ok,
  handleError,
  PaginationMeta,
  buildMeta,
  parsePagination,
} from "@/lib/api-helpers";
import { Prisma } from "@/generated/prisma/client";
import { VisaStatus, CasStatus } from "@/generated/prisma/enums";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );

    const { searchParams } = new URL(req.url);
    const { skip, take, page, limit } = parsePagination(searchParams);

    const search = searchParams.get("search");
    const branchId = searchParams.get("branchId");
    const counselorId = searchParams.get("counselorId");
    const visaStatus = searchParams.get("visaStatus");
    const loanStatus = searchParams.get("loanStatus");
    const casStatus = searchParams.get("casStatus");

    const where: Prisma.StudentWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (counselorId) {
      where.counselorId = counselorId;
    }

    if (search) {
      where.OR = [
        {
          studentName: {
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
          mobileNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Visa Profile Filter
    const visaProfileFilter: Prisma.StudentVisaProfileWhereInput = {};

    if (
      visaStatus &&
      Object.values(VisaStatus).includes(visaStatus as VisaStatus)
    ) {
      visaProfileFilter.visaStatus = visaStatus as VisaStatus;
    }

    if (
      casStatus &&
      Object.values(CasStatus).includes(casStatus as CasStatus)
    ) {
      visaProfileFilter.casStatus = casStatus as CasStatus;
    }

    if (Object.keys(visaProfileFilter).length > 0) {
      where.visaProfile = {
        is: visaProfileFilter,
      };
    }

    // Loan Profile Filter
    const loanProfileFilter: Prisma.StudentLoanProfileWhereInput = {};

    if (loanStatus) {
      loanProfileFilter.loanStatus = loanStatus;
    }

    if (Object.keys(loanProfileFilter).length > 0) {
      where.loanProfile = {
        is: loanProfileFilter,
      };
    }
    const andFilters: Prisma.StudentWhereInput[] = [];

    // Branch Manager -> Only students from assigned branches
    if (currentUser.role.name === ROLES.BRANCH_MANAGER) {
      andFilters.push({
        branchId: {
          in: currentUser.branches.map((branch) => branch.id),
        },
      });
    }

    // Everyone except Super Admin & Director
    else if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR
    ) {
      andFilters.push({
        counselorId: currentUser.id,
      });
    }

    if (andFilters.length > 0) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        ...andFilters,
      ];
    }

    const [students, total] = await db.$transaction([
      db.student.findMany({
        where,
        skip,
        take,

        include: {
          lead: {
            select: {
              passport: true,
              preferredCountry: true,
              preferredIntake: true,
              preferredCourse: true,
              preferredTiers: true,
              bachelorsCourse: true,
              twelfthPercentage: true,
              twelfthYearOfPassing: true,
            },
          },

          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          counselor: {
            select: {
              id: true,
              name: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          applications: {
            select: {
              id: true,

              countryId: true,
              countryName: true,

              universityId: true,
              universityName: true,

              courseId: true,
              courseName: true,

              intakeId: true,
              intakeName: true,

              portal: true,
              applicationDate: true,
              followUpDate: true,
              status: true,
              offerStatus: true,

              country: {
                select: {
                  id: true,
                  name: true,
                },
              },

              university: {
                select: {
                  id: true,
                  name: true,
                },
              },

              course: {
                select: {
                  id: true,
                  name: true,
                },
              },

              intake: {
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

          timeline: true,

          visaProfile: true,

          loanProfile: {
            include: {
              fintechAssignee: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          moduleProgress: true,

          documents: {
            select: {
              id: true,

              studentId: true,

              documentCode: true,
              documentType: true,

              originalFileName: true,
              storedFileName: true,

              fileUrl: true,

              mimeType: true,
              fileSize: true,

              remarks: true,

              uploadedAt: true,
              createdAt: true,
              updatedAt: true,
            },

            orderBy: {
              uploadedAt: "desc",
            },
          },

          remarks: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      db.student.count({
        where,
      }),
    ]);

    const studentsWithPassword = students.map((student) => {
      let password = student.password;

      if (password) {
        try {
          password = decrypt(password);
        } catch {
          password = null;
        }
      }

      return {
        ...student,
        password,
      };
    });

    return ok(
      studentsWithPassword,
      "Students fetched successfully",
      buildMeta(total, page, limit),
    );
  } catch (err) {
    return handleError(err);
  }
}
