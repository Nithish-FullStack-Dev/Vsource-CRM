import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { followUpSchema } from "@/schemas/loan-application/loan-application.schema";
import { handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

const toDate = (value?: string | null): Date | null => {
  return value ? new Date(value) : null;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const user = await getAuthorizedUser(
      req,
      MODULES.LOAN_APPLICATION,
      PERMISSIONS.CREATE,
    );

    const body = await req.json();
    const validatedData = followUpSchema.parse(body);

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    const followUp = await db.loanFollowUp.create({
      data: {
        id: crypto.randomUUID(),
        applicationId: id,
        type: validatedData.type ?? null,
        note: validatedData.note,
        followUpDate: toDate(validatedData.followUpDate),
        nextFollowUp: toDate(validatedData.nextFollowUp),
        updatedAt: new Date(),
        createdById: user?.id,
      },
    });

    return NextResponse.json(
      {
        message: "Follow-up added successfully",
        data: followUp,
      },
      {
        status: 201,
      },
    );
  } catch (error: any) {
    console.error("POST loan follow-up error:", error);

    return handleError(error);
  }
}
