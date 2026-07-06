import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";

const parseNullableAmount = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;

  const amount = Number(value);

  if (!Number.isFinite(amount)) return null;

  return amount;
};

async function saveLoanProfile(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;
    const body = await req.json();

    const appliedAmount = parseNullableAmount(body.appliedAmount);
    const sanctionedAmount = parseNullableAmount(body.sanctionedAmount);
    const disbursedAmount = body.disbursed
      ? parseNullableAmount(body.disbursedAmount)
      : null;

    const profile = await db.studentLoanProfile.upsert({
      where: {
        studentId,
      },
      create: {
        studentId,
        fintechAssigneeId: body.fintechAssigneeId,
        nbfc: body.nbfc,
        loanStatus: body.loanStatus,
        pfStatus: body.pfStatus,
        appliedAmount,
        sanctionedAmount,
        disbursed: body.disbursed ?? false,
        disbursedAmount,
      },
      update: {
        fintechAssigneeId: body.fintechAssigneeId,
        nbfc: body.nbfc,
        loanStatus: body.loanStatus,
        pfStatus: body.pfStatus,
        appliedAmount,
        sanctionedAmount,
        disbursed: body.disbursed ?? false,
        disbursedAmount,
      },
      include: {
        fintechAssignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return ok(profile, "Loan profile saved successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return saveLoanProfile(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return saveLoanProfile(req, context);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    const profile = await db.studentLoanProfile.findUnique({
      where: {
        studentId,
      },
      include: {
        fintechAssignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return ok(profile, "Loan profile fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
