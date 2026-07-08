import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const loanApplicationInclude = {
  Branch: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  User_LoanApplication_counselorIdToUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  User_LoanApplication_fintechAssigneeIdToUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  LoanBankApplication: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },

  LoanCoApplicant: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },

  LoanFollowUp: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },

  LoanActivity: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },

  LoanDocument: {
    orderBy: {
      uploadedAt: "desc" as const,
    },
  },
} satisfies Prisma.LoanApplicationInclude;


/**
 * GET ALL LOAN APPLICATIONS
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const q = searchParams.get("q")?.trim();
    const applicantCategory =
      searchParams.get("applicantCategory")?.trim();
    const loanCategory =
      searchParams.get("loanCategory")?.trim();
    const loanStatus =
      searchParams.get("loanStatus")?.trim();
    const fintechAssigneeId =
      searchParams.get("fintechAssigneeId")?.trim();

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
        message: "Failed to load loan applications",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * CREATE LOAN APPLICATION
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("LOAN APPLICATION BODY:", body);

    const id = crypto.randomUUID();

    const applicationId = `LOAN-${Date.now()}`;

    const createData: Prisma.LoanApplicationUncheckedCreateInput = {
      id,

      applicationId,

      fullName: body.fullName,
      mobile: body.mobile,
      email: body.email,

      branchId: body.branchId,

      applicantCategory: body.applicantCategory,
      loanCategory: body.loanCategory,

      updatedAt: new Date(),
    };

    const created = await db.loanApplication.create({
      data: createData,
    });

    console.log("LOAN APPLICATION CREATED:", created.id);

    return NextResponse.json(
      {
        message: "Loan enquiry created successfully",
        data: created,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST LOAN APPLICATION ERROR:", error);

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          meta: error.meta,
        },
        {
          status: 500,
        }
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
      }
    );
  }
}