import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

import { updateLoanApplicationSchema } from "@/schemas/loan-application/loan-application.schema";

import {
  serializeLoanApplication,
  toLoanApplicationData,
} from "@/lib/loan-application/server";

/* -------------------------------------------------------------------------- */
/*                                  INCLUDE                                   */
/* -------------------------------------------------------------------------- */

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
    orderBy: {
      createdAt: "desc",
    },
  },

  activities: {
    orderBy: {
      createdAt: "desc",
    },
  },

  documents: {
    orderBy: {
      uploadedAt: "desc",
    },
  },
} satisfies Prisma.LoanApplicationInclude;

/* -------------------------------------------------------------------------- */
/*                        SYNC LOAN REQUIRED LEADS                            */
/* -------------------------------------------------------------------------- */

async function syncLoanRequiredLeads() {
  const leads = await db.lead.findMany({
    where: {
      loanRequirement: true,
    },

    select: {
      id: true,
      leadNumber: true,
      studentName: true,
      mobileNumber: true,
      emailId: true,
      passport: true,
      passportExpireDate: true,
      place: true,
      source: true,
      branchId: true,
      graduationStatus: true,
      workExperience: true,
      preferredCountry: true,
      preferredIntake: true,
      preferredCourse: true,
      nextFollowup: true,
      remarks: true,
      createdAt: true,

      counselors: {
        where: {
          isPrimary: true,
        },

        select: {
          counselorId: true,
        },

        take: 1,
      },
    },
  });

  if (leads.length === 0) {
    return;
  }

  await db.$transaction(
    leads.map((lead) => {
      const counselorId = lead.counselors[0]?.counselorId ?? null;

      return db.loanApplication.upsert({
        where: {
          leadId: lead.id,
        },

        update: {
          fullName: lead.studentName?.trim() || "Unknown Applicant",

          mobile: lead.mobileNumber?.trim() || "",

          email: lead.emailId?.trim() || "",

          passport: lead.passport,

          passportExpireDate: lead.passportExpireDate,

          currentAddress: lead.place,

          leadSource: lead.source,

          branchId: lead.branchId,

          counselorId,

          nextFollowUp: lead.nextFollowup,

          graduationStatus: lead.graduationStatus,

          workExperience: lead.workExperience,

          studyDestination: lead.preferredCountry,

          country: lead.preferredCountry,

          courseName: lead.preferredCourse,

          intake: lead.preferredIntake,
        },

        create: {
          applicationId: `LOAN-${lead.leadNumber}`,

          leadId: lead.id,

          fullName: lead.studentName?.trim() || "Unknown Applicant",

          mobile: lead.mobileNumber?.trim() || "",

          email: lead.emailId?.trim() || "",

          passport: lead.passport,

          passportExpireDate: lead.passportExpireDate,

          currentAddress: lead.place,

          enquiryDate: lead.createdAt,

          leadSource: lead.source,

          branchId: lead.branchId,

          counselorId,

          nextFollowUp: lead.nextFollowup,

          remarks: lead.remarks,

          applicantCategory: "Student",

          loanCategory: "Education Loan",

          loanStatus: "New Enquiry",

          graduationStatus: lead.graduationStatus,

          workExperience: lead.workExperience,

          studyDestination: lead.preferredCountry,

          country: lead.preferredCountry,

          courseName: lead.preferredCourse,

          intake: lead.preferredIntake,
        },
      });
    }),
  );
}

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    await syncLoanRequiredLeads();

    const searchParams = request.nextUrl.searchParams;

    const q = searchParams.get("q")?.trim();

    const applicantCategory = searchParams.get("applicantCategory")?.trim();

    const loanCategory = searchParams.get("loanCategory")?.trim();

    const loanStatus = searchParams.get("loanStatus")?.trim();

    const fintechAssigneeId = searchParams.get("fintechAssigneeId")?.trim();

    const where: Prisma.LoanApplicationWhereInput = {};

    if (applicantCategory) {
      where.applicantCategory = applicantCategory;
    }

    if (loanCategory) {
      where.loanCategory = loanCategory;
    }

    if (loanStatus) {
      where.loanStatus = loanStatus;
    }

    if (fintechAssigneeId) {
      where.fintechAssigneeId = fintechAssigneeId;
    }

    if (q) {
      where.OR = [
        {
          fullName: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          applicationId: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          mobile: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: q,
            mode: "insensitive",
          },
        },
      ];
    }

    const rows = await db.loanApplication.findMany({
      where,

      include: loanApplicationInclude,

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: rows.map(serializeLoanApplication),
    });
  } catch (error) {
    console.error("GET LOAN APPLICATIONS ERROR:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load loan applications",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    /*
     * Validate incoming request.
     */
    const values = updateLoanApplicationSchema.parse(body);

    /*
     * Convert validated form values into Prisma data.
     */
    const applicationData = toLoanApplicationData(values);

    /*
     * Required create fields must be explicitly present because
     * toLoanApplicationData() is also used by PATCH and therefore
     * likely returns Prisma.LoanApplicationUpdateInput.
     */
    const createData: Prisma.LoanApplicationUncheckedCreateInput = {
      ...applicationData,

      applicationId: `LOAN-${Date.now()}`,

      fullName: values.fullName ?? "",

      mobile: values.mobile ?? "",

      email: values.email ?? "",

      branchId: values.branchId ?? "",

      applicantCategory: values.applicantCategory ?? "",

      loanCategory: values.loanCategory ?? "",

      loanStatus: values.loanStatus ?? "New Enquiry",
    };

    const created = await db.$transaction(async (tx) => {
      const loanApplication = await tx.loanApplication.create({
        data: createData,

        include: loanApplicationInclude,
      });

      await tx.loanActivity.create({
        data: {
          applicationId: loanApplication.id,

          type: "created",

          title: "Loan application created",

          description: "New loan enquiry was created.",
        },
      });

      return loanApplication;
    });

    return NextResponse.json(
      {
        message: "Loan enquiry created successfully",

        data: serializeLoanApplication(created),
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error("POST LOAN APPLICATION ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            message: "A loan application with this value already exists",
            code: error.code,
            meta: error.meta,
          },
          {
            status: 409,
          },
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            message:
              "Invalid related record. Please verify branch, counselor, or fintech assignee.",
            code: error.code,
            meta: error.meta,
          },
          {
            status: 400,
          },
        );
      }

      return NextResponse.json(
        {
          message: "Database error while creating loan application",
          code: error.code,
          meta: error.meta,
        },
        {
          status: 500,
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
            : "Failed to create loan enquiry",
      },
      {
        status: 500,
      },
    );
  }
}
