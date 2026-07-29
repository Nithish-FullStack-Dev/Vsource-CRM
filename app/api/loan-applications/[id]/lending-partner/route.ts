// app\api\loan-applications\[id]\lending-partner\route.ts

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { handleError, notFound, ok } from "@/lib/api-helpers";
import { updateLoanLendingPartnerSchema } from "@/schemas/loan-application/loan-application.schema";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();

    const values = updateLoanLendingPartnerSchema.parse(body);

    const existing = await db.loanApplication.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existing) {
      return notFound("Loan application");
    }

    const updated = await db.loanApplication.update({
      where: {
        id,
      },

      data: {
        requiredLoanAmount: values.requiredLoanAmount ?? null,

        sanctionBankId: values.sanctionBankId ?? null,
        sanctionedAmount: values.sanctionedAmount ?? null,
        sanctionDate: values.sanctionDate
          ? new Date(values.sanctionDate)
          : null,

        disbursementStatus: values.disbursementStatus ?? null,
        disbursementDate: values.disbursementDate
          ? new Date(values.disbursementDate)
          : null,
        disbursedBank: values.disbursedBank ?? null,
        disbursedAmount: values.disbursedAmount ?? null,

        depositAmount: values.depositAmount ?? null,
        depositDate: values.depositDate ? new Date(values.depositDate) : null,
        depositBank: values.depositBank ?? null,
        depositStatus: values.depositStatus ?? null,
      },
    });

    return ok(updated, "Lending partner updated successfully");
  } catch (error) {
    console.error("PATCH lending partner:", error);

    return handleError(error);
  }
}
