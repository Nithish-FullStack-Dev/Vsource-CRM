// app\api\loan-applications\[id]\route.ts
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";

import { updateLoanApplicationSchema } from "@/schemas/loan-application/loan-application.schema";

import {
  serializeLoanApplication,
  toLoanApplicationData,
} from "@/lib/loan-application/server";

import { Prisma } from "@/generated/prisma/client";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

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
  disbursement: true,
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
    orderBy: {
      createdAt: "desc",
    },
  },

  sanction: {
    include: {
      bank: {
        select: {
          name: true,
        },
      },
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

/**
 * GET
 * Get single loan application
 */
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

    return NextResponse.json({
      data: serializeLoanApplication(row),
    });
  } catch (error) {
    console.error("GET loan application error:", error);

    return NextResponse.json(
      {
        message: "Failed to load loan application",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PATCH
 * Update loan application
 */
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

    const updated = await db.$transaction(async (tx) => {
      const updatedLoanApplication = await tx.loanApplication.update({
        where: {
          id,
        },
        data: toLoanApplicationData(values),
        select: {
          id: true,
          leadId: true,
        },
      });

      if (updatedLoanApplication.leadId) {
        await tx.lead.update({
          where: {
            id: updatedLoanApplication.leadId,
          },
          data: {
            bachelorsCourse: values.qualification ?? null,

            graduationStatus: values.graduationStatus
              ? (values.graduationStatus as any)
              : null,

            bachelorsPercentage:
              values.percentage !== undefined &&
              values.percentage !== null &&
              values.percentage !== ""
                ? Number(values.percentage)
                : null,

            bachelorsYearOfPassing:
              values.yearOfPassing !== undefined &&
              values.yearOfPassing !== null &&
              values.yearOfPassing !== ""
                ? Number(values.yearOfPassing)
                : null,

            bachelorsUniversityName: values.currentInstitution ?? null,

            workExperience: values.workExperience ?? null,
          },
        });
      }

      await tx.loanActivity.create({
        data: {
          applicationId: id,
          type: "updated",
          title: "Loan application updated",
          description: "Loan application details were updated.",
        },
      });
    });
    return NextResponse.json({
      message: "Loan application updated successfully",
      data: serializeLoanApplication(updated),
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

/**
 * DELETE
 * Delete loan application
 */
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
  } catch (error: any) {
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
        message: error?.message || "Failed to delete loan application",
      },
      {
        status: 500,
      },
    );
  }
}
