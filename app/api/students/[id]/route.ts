// app\api\students\[id]\route.ts

import { NextRequest } from "next/server";

import db from "@/lib/prisma";
import { ok, handleError, notFound } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { decrypt } from "@/lib/encryption";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );

    const { id } = await params;

    const student = await db.student.findUnique({
      where: {
        id,
      },

      include: {
        lead: {
          select: {
            loanRequirement: true,
            passport: true,
            preferredCountry: true,
            preferredIntake: true,
            preferredCourse: true,
            preferredTiers: true,
            bachelorsCourse: true,
            twelfthPercentage: true,
            twelfthYearOfPassing: true,
            emailId: true,

            loanApplication: {
              select: {
                loanStatus: true,
                loanCategory: true,
                depositStatus: true,
                depositDate: true,
                disbursedAmount: true,
                disbursementDate: true,
                disbursementStatus: true,
                sanctionDate: true,
                sanctionedAmount: true,
                sanctionBankApplication: {
                  select: {
                    bank: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },

                fintechAssignee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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
    });

    if (!student) {
      return notFound("Student");
    }

    let password = student.password;

    if (password) {
      try {
        password = decrypt(password);
      } catch {
        password = null;
      }
    }

    const studentsWithPassword = {
      ...student,
      password,
    };

    return ok(studentsWithPassword, "Students fetched successfully");
  } catch (err) {
    return handleError(err);
  }
}
