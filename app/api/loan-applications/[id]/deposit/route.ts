// app\api\loan-applications\[id]\deposit\route.ts

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { handleError } from "@/lib/api-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan Application not found.",
        },
        { status: 404 },
      );
    }

    const updated = await db.loanApplication.update({
      where: {
        id,
      },
      data: {
        depositStatus: body.depositStatus,
        depositAmount: body.depositAmount,
        depositDate: body.depositDate ? new Date(body.depositDate) : null,
        depositReference: body.depositReference,
        depositBank: body.depositBank,
        depositRemarks: body.depositRemarks,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit details updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error(error);

    return handleError(error);
  }
}
