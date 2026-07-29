import { handleError, ok } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: leadId } = await context.params;

    const loan = await prisma.loanApplication.findUnique({
      where: {
        leadId,
      },
      select: {
        fintechAssignee: {
          select: {
            name: true,
          },
        },
        depositStatus: true,
        depositDate: true,
        loanStatus: true,
        loanCategory: true,
        disbursementDate: true,
        disbursementStatus: true,
        sanctionBankApplication: {
          select: {
            bank: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return ok(loan, "Loan application process fetvhed successfully");
  } catch (error) {
    return handleError(error);
  }
}
