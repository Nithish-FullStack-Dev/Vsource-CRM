// app/api/loan-applications/route.ts

import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

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

        /**
         * Existing Loan Application
         *
         * Keep the application synchronized with
         * the Master Walk-In lead.
         */
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

        /**
         * New Loan Application
         */
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

          /**
           * IMPORTANT
           *
           * These values now work with the fixed
           * constants.ts getLoanTabs().
           */
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
      data: rows,
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
    const body = await request.json();

    const created = await db.loanApplication.create({
      data: {
        applicationId: `LOAN-${Date.now()}`,

        fullName: body.fullName,

        mobile: body.mobile,

        email: body.email,

        branchId: body.branchId,

        applicantCategory: body.applicantCategory,

        loanCategory: body.loanCategory,
      },

      include: loanApplicationInclude,
    });

    return NextResponse.json(
      {
        message: "Loan enquiry created successfully",
        data: created,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST LOAN APPLICATION ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          meta: error.meta,
        },
        {
          status: 500,
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
