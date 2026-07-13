import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const application = await db.loanApplication.findUnique({
      where: { id },
      include: {
        sanction: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Loan application not found." },
        { status: 404 },
      );
    }

    if (!application.sanction) {
      return NextResponse.json(
        { message: "Loan sanction not found." },
        { status: 400 },
      );
    }

    const sanctionId = application.sanction.id;

    const result = await db.$transaction(async (tx) => {
      const disbursement = await tx.loanDisbursement.upsert({
        where: {
          applicationId: id,
        },
        create: {
          applicationId: id,
          sanctionId,

          disbursementDate: body.disbursementDate
            ? new Date(body.disbursementDate)
            : null,

          disbursedAmount: body.disbursedAmount,

          disbursementReference: body.disbursementReference,

          accountNumber: body.accountNumber,

          transactionId: body.transactionId,

          beneficiary: body.beneficiary,

          paymentMode: body.paymentMode,

          remarks: body.remarks,
        },

        update: {
          disbursementDate: body.disbursementDate
            ? new Date(body.disbursementDate)
            : null,

          disbursedAmount: body.disbursedAmount,

          disbursementReference: body.disbursementReference,

          accountNumber: body.accountNumber,

          transactionId: body.transactionId,

          beneficiary: body.beneficiary,

          paymentMode: body.paymentMode,

          remarks: body.remarks,
        },
      });

      await tx.loanApplication.update({
        where: { id },
        data: {
          disbursedAmount: body.disbursedAmount,
        },
      });

      return disbursement;
    });

    return NextResponse.json({
      success: true,
      message: "Disbursement updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      },
    );
  }
}
