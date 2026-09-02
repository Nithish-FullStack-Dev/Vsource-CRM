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
            passport: true,
            passportExpireDate: true,

            // Academic
            tenthPercentage: true,
            tenthYearOfPassing: true,

            twelfthPercentage: true,
            twelfthYearOfPassing: true,

            bachelorsCourse: true,
            bachelorsUniversityName: true,
            bachelorsPercentage: true,
            bachelorsYearOfPassing: true,

            backlogs: true,
            workExperience: true,

            // Preferred study details
            preferredCountry: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },

            preferredIntake: true,

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
                degree: true,
                durationMonths: true,
                annualTuitionFee: true,
                totalTuitionFee: true,
                currency: true,
              },
            },

            // Test / academic scores
            greGmatScore: true,
            quantitativeScore: true,
            verbalScore: true,
            analyticalWritingScore: true,

            // Other profile information
            moi: true,
            gapsIfAny: true,
            graduationStatus: true,
            loanRequirement: true,

            emailId: true,

            // English tests
            englishTests: {
              orderBy: {
                createdAt: "asc",
              },
            },

            // Keep your existing loan application
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
