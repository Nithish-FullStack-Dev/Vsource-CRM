import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";

async function saveLoanProfile(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;
    const body = await req.json();

    const profile = await db.studentLoanProfile.upsert({
      where: {
        studentId,
      },
      create: {
        studentId,
        fintechAssigneeId: body.fintechAssigneeId || null,
        nbfc: body.nbfc || null,
        loanStatus: body.loanStatus || null,
        pfStatus: body.pfStatus || null,
        depositDate: body.depositDate ? new Date(body.depositDate) : null,
        disbursed: body.disbursed ?? false,
        disbursedDate:
          body.disbursed && body.disbursedDate
            ? new Date(body.disbursedDate)
            : null,
      },
      update: {
        fintechAssigneeId: body.fintechAssigneeId || null,
        nbfc: body.nbfc || null,
        loanStatus: body.loanStatus || null,
        pfStatus: body.pfStatus || null,
        depositDate: body.depositDate ? new Date(body.depositDate) : null,
        disbursed: body.disbursed ?? false,
        disbursedDate:
          body.disbursed && body.disbursedDate
            ? new Date(body.disbursedDate)
            : null,
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
