// app/api/loan-applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import {
  serializeLoanApplication,
  toLoanApplicationData,
} from "@/lib/loan-application/server";

import { updateLoanApplicationSchema } from "@/schemas/loan-application/loan-application.schema";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";
type Ctx = {
  params: Promise<{
    id: string;
  }>;
};
type LoanApplicationWithRelations = Prisma.LoanApplicationGetPayload<{
  include: typeof loanApplicationInclude;
}>;
type StudentApplicationWithRelations = Prisma.StudentApplicationGetPayload<{
  include: {
    country: {
      select: {
        id: true;
        name: true;
      };
    };
    university: {
      select: {
        id: true;
        name: true;
      };
    };
    course: {
      select: {
        id: true;
        name: true;
        degree: true;
        durationMonths: true;
      };
    };
    intake: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;
const loanApplicationInclude = {
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
      email: true,
    },
  },

  fintechAssignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  bankApplications: {
    include: {
      bank: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  },

  coApplicants: {
    orderBy: {
      createdAt: "desc",
    },
  },

  followUps: {
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },

  activities: {
    orderBy: {
      createdAt: "desc",
    },

    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },

  documents: {
    orderBy: {
      uploadedAt: "desc",
    },
  },
} satisfies Prisma.LoanApplicationInclude;
const studentApplicationInclude = {
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
      degree: true,
      durationMonths: true,
    },
  },

  intake: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.StudentApplicationInclude;
function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function parseOptionalFloat(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function formatDurationMonths(durationMonths: number | null): string | null {
  if (!durationMonths) {
    return null;
  }

  if (durationMonths < 12) {
    return `${durationMonths} month${durationMonths === 1 ? "" : "s"}`;
  }

  if (durationMonths % 12 === 0) {
    const years = durationMonths / 12;

    return `${years} year${years === 1 ? "" : "s"}`;
  }

  const years = Math.floor(durationMonths / 12);
  const months = durationMonths % 12;

  return `${years} year${years === 1 ? "" : "s"} ${months} month${
    months === 1 ? "" : "s"
  }`;
}

function formatEnumValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
function getSelectedStudentApplication(
  applications: StudentApplicationWithRelations[],
): StudentApplicationWithRelations | null {
  if (applications.length === 0) {
    return null;
  }

  const appliedWithUcol = applications.find(
    (application) =>
      application.status === "applied" && application.offerStatus === "UCOL",
  );

  if (appliedWithUcol) {
    return appliedWithUcol;
  }

  const appliedApplication = applications.find(
    (application) => application.status === "applied",
  );

  if (appliedApplication) {
    return appliedApplication;
  }

  return applications[0] ?? null;
}
async function getRelatedStudentData(leadId: string | null) {
  if (!leadId) {
    return null;
  }

  return db.student.findUnique({
    where: {
      leadId,
    },

    select: {
      id: true,

      lead: {
        select: {
          id: true,

          bachelorsCourse: true,

          bachelorsUniversityName: true,

          bachelorsPercentage: true,

          bachelorsYearOfPassing: true,

          graduationStatus: true,

          workExperience: true,

          preferredCountry: true,

          preferredCourse: true,

          preferredIntake: true,
        },
      },

      applications: {
        include: studentApplicationInclude,

        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });
}
async function buildLoanApplicationResponse(row: LoanApplicationWithRelations) {
  const serialized = serializeLoanApplication(row);

  const student = await getRelatedStudentData(row.leadId);

  const applications = student?.applications ?? [];

  const selectedApplication = getSelectedStudentApplication(applications);

  return {
    ...serialized,
    qualification: student?.lead.bachelorsCourse ?? row.qualification ?? null,

    graduationStatus:
      student?.lead.graduationStatus ?? row.graduationStatus ?? null,

    percentage:
      student?.lead.bachelorsPercentage != null
        ? String(student.lead.bachelorsPercentage)
        : (row.percentage ?? null),

    yearOfPassing:
      student?.lead.bachelorsYearOfPassing != null
        ? String(student.lead.bachelorsYearOfPassing)
        : (row.yearOfPassing ?? null),

    currentInstitution:
      student?.lead.bachelorsUniversityName ?? row.currentInstitution ?? null,

    workExperience: student?.lead.workExperience ?? row.workExperience ?? null,
    studyDestination:
      selectedApplication || student?.lead.preferredCountry
        ? "Abroad"
        : (row.studyDestination ?? null),

    country:
      selectedApplication?.countryName ??
      selectedApplication?.country?.name ??
      row.country ??
      student?.lead.preferredCountry ??
      null,

    university:
      selectedApplication?.universityName ??
      selectedApplication?.university?.name ??
      row.university ??
      null,

    courseName:
      selectedApplication?.courseName ??
      selectedApplication?.course?.name ??
      row.courseName ??
      student?.lead.preferredCourse ??
      null,

    courseLevel: selectedApplication?.course?.degree
      ? formatEnumValue(selectedApplication.course.degree)
      : (row.courseLevel ?? null),

    courseDuration: selectedApplication?.course?.durationMonths
      ? formatDurationMonths(selectedApplication.course.durationMonths)
      : (row.courseDuration ?? null),

    intake:
      selectedApplication?.intakeName ??
      selectedApplication?.intake?.name ??
      row.intake ??
      student?.lead.preferredIntake ??
      null,

    admissionStatus: selectedApplication?.status ?? row.admissionStatus ?? null,

    offerLetterReceived:
      selectedApplication?.offerStatus ?? row.offerLetterReceived ?? null,
    selectedStudentApplicationId: selectedApplication?.id ?? null,
    studentApplications: applications.map((app) => ({
      id: app.id,

      country: app.countryName ?? app.country?.name ?? null,

      university: app.universityName ?? app.university?.name ?? null,

      course: app.courseName ?? app.course?.name ?? null,

      intake: app.intakeName ?? app.intake?.name ?? null,

      status: app.status,

      offerStatus: app.offerStatus,

      applicationDate: app.applicationDate,
    })),
  };
}
export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const row = await db.loanApplication.findUnique({
      where: {
        id,
      },

      include: loanApplicationInclude,
    });

    if (!row) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    const data = await buildLoanApplicationResponse(row);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error("GET loan application error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load loan application",
      },
      {
        status: 500,
      },
    );
  }
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body: unknown = await req.json();

    const values = updateLoanApplicationSchema.parse(body);

    const existingApplication = await db.loanApplication.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        leadId: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.loanApplication.update({
        where: {
          id,
        },

        data: toLoanApplicationData(values),
      });

      if (existingApplication.leadId) {
        // Look up country and course by name to get their IDs for relations
        const preferredCountryRecord = values.country
          ? await tx.country.findFirst({
              where: {
                name: {
                  equals: values.country,
                  mode: "insensitive",
                },
              },
              select: {
                id: true,
              },
            })
          : null;

        const preferredCourseRecord = values.courseName
          ? await tx.universityCourse.findFirst({
              where: {
                name: {
                  equals: values.courseName,
                  mode: "insensitive",
                },
              },
              select: {
                id: true,
              },
            })
          : null;

        await tx.lead.update({
          where: {
            id: existingApplication.leadId,
          },

          data: {
            bachelorsCourse: normalizeOptionalString(values.qualification),

            graduationStatus: values.graduationStatus
              ? (values.graduationStatus.toLowerCase() as
                  | "completed"
                  | "pursuing")
              : null,

            bachelorsPercentage: parseOptionalFloat(values.percentage),

            bachelorsYearOfPassing: parseOptionalInteger(values.yearOfPassing),

            bachelorsUniversityName: normalizeOptionalString(
              values.currentInstitution,
            ),

            workExperience: normalizeOptionalString(values.workExperience),

            preferredIntake: normalizeOptionalString(values.intake),

            ...(preferredCountryRecord
              ? {
                  preferredCountry: {
                    connect: {
                      id: preferredCountryRecord.id,
                    },
                  },
                }
              : values.country === null
                ? { preferredCountry: { disconnect: true } }
                : {}),

            ...(preferredCourseRecord
              ? {
                  preferredCourse: {
                    connect: {
                      id: preferredCourseRecord.id,
                    },
                  },
                }
              : values.courseName === null
                ? { preferredCourse: { disconnect: true } }
                : {}),
          },
        });
        const student = await tx.student.findUnique({
          where: {
            leadId: existingApplication.leadId,
          },

          select: {
            id: true,

            applications: {
              include: studentApplicationInclude,

              orderBy: {
                updatedAt: "desc",
              },
            },
          },
        });

        if (student) {
          const selectedApplication = getSelectedStudentApplication(
            student.applications,
          );
          if (selectedApplication) {
            const selectedCountry = values.country
              ? await tx.country.findFirst({
                  where: {
                    name: {
                      equals: values.country,
                      mode: "insensitive",
                    },
                  },

                  select: {
                    id: true,
                    name: true,
                  },
                })
              : null;
            const selectedUniversity = values.university
              ? await tx.university.findFirst({
                  where: {
                    name: {
                      equals: values.university,
                      mode: "insensitive",
                    },

                    ...(selectedCountry?.id
                      ? {
                          countryId: selectedCountry.id,
                        }
                      : {}),
                  },

                  select: {
                    id: true,
                    name: true,
                  },
                })
              : null;

            const selectedCourse =
              values.courseName && selectedUniversity?.id
                ? await tx.universityCourse.findFirst({
                    where: {
                      universityId: selectedUniversity.id,

                      name: {
                        equals: values.courseName,
                        mode: "insensitive",
                      },
                    },

                    select: {
                      id: true,
                      name: true,
                    },
                  })
                : null;

            const selectedIntake = values.intake
              ? await tx.intake.findFirst({
                  where: {
                    name: {
                      equals: values.intake,
                      mode: "insensitive",
                    },
                  },

                  select: {
                    id: true,
                    name: true,
                  },
                })
              : null;
            await tx.studentApplication.update({
              where: {
                id: selectedApplication.id,
              },

              data: {
                ...(selectedCountry
                  ? {
                      countryId: selectedCountry.id,
                      countryName: selectedCountry.name,
                    }
                  : {}),

                ...(selectedUniversity
                  ? {
                      universityId: selectedUniversity.id,
                      universityName: selectedUniversity.name,
                    }
                  : {}),

                ...(selectedCourse
                  ? {
                      courseId: selectedCourse.id,
                      courseName: selectedCourse.name,
                    }
                  : {}),

                ...(selectedIntake
                  ? {
                      intakeId: selectedIntake.id,
                      intakeName: selectedIntake.name,
                    }
                  : {}),

                ...(values.admissionStatus
                  ? {
                      status: values.admissionStatus
                        .toLowerCase()
                        .replace(/\s+/g, "_") as "on_hold" | "applied" | "drop",
                    }
                  : {}),

                ...(values.offerLetterReceived
                  ? {
                      offerStatus: values.offerLetterReceived
                        .toUpperCase()
                        .replace(/\s+/g, "_") as
                        | "PENDING"
                        | "PRIORITY_UCOL"
                        | "PRIORITY_COL"
                        | "COL"
                        | "UCOL",
                    }
                  : {}),
              },
            });
          }
        }
      }
      await tx.loanActivity.create({
        data: {
          applicationId: id,
          type: "updated",
          title: "Loan application updated",
          description: "Education and study abroad information were updated.",
        },
      });
    });
    const updated = await db.loanApplication.findUnique({
      where: {
        id,
      },

      include: loanApplicationInclude,
    });

    if (!updated) {
      return NextResponse.json(
        {
          message: "Loan application not found after update",
        },
        {
          status: 404,
        },
      );
    }

    const data = await buildLoanApplicationResponse(updated);
    const accessToken = req.cookies.get("access_token")?.value;

    if (accessToken) {
      await triggerNotificationProcessor(accessToken);
    }
    return NextResponse.json({
      message: "Loan application updated successfully",
      data,
    });
  } catch (error: unknown) {
    console.error("PATCH loan application error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "issues" in error &&
      Array.isArray(error.issues)
    ) {
      const issues = error.issues as Array<{
        message?: string;
      }>;

      return NextResponse.json(
        {
          message: issues[0]?.message ?? "Invalid loan application data",

          errors: issues,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to update loan application",
      },
      {
        status: 500,
      },
    );
  }
}
export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existingApplication = await db.loanApplication.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    await db.loanApplication.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Loan application deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE loan application error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete loan application",
      },
      {
        status: 500,
      },
    );
  }
}
