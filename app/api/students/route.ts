// app/api/students/route.ts

import { NextRequest } from "next/server";

import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { Prisma } from "@/generated/prisma/client";
import { getAuthorizedUser } from "@/lib/rbac";
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

    // Visa + Loan Profile Filters
    const visaLoanProfileFilter: Prisma.StudentVisaLoanProfileWhereInput = {};

    if (visaStatus) {
      visaLoanProfileFilter.visaStatus = visaStatus;
    }

    if (casStatus) {
      visaLoanProfileFilter.casStatus = casStatus;
    }

    if (loanStatus) {
      visaLoanProfileFilter.loanStatus = loanStatus;
    }

    if (Object.keys(visaLoanProfileFilter).length > 0) {
      where.visaLoanProfile = {
        is: visaLoanProfileFilter,
      };
    }

    if (currentUser.role.name === "Counsellor") {
      where.AND = [
        {
          OR: [{ counselorId: currentUser.id }],
        },
      ];
    }

    const students = await db.student.findMany({
      where,

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

        visaLoanProfile: true,
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
    });

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

    return ok(studentsWithPassword, "Students fetched successfully");
  } catch (err) {
    return handleError(err);
  }
}
