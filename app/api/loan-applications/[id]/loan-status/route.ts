// app\api\loan-applications\[id]\loan-status\route.ts

import { handleError, ok } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const { loanStatus } = await req.json();

    if (!loanStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan status is required.",
        },
        { status: 400 },
      );
    }

    const application = await prisma.loanApplication.update({
      where: {
        id,
      },
      data: {
        loanStatus,
      },
    });

    return ok(application, "Loan status updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
