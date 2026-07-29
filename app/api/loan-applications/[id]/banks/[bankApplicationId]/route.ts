import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import db from "@/lib/prisma";
import { bankApplicationSchema } from "@/schemas/loan-application/loan-application.schema";

type RouteContext = {
  params: Promise<{
    id: string;
    bankApplicationId: string;
  }>;
};

function toOptionalDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid application date");
  }

  return date;
}

function toOptionalDecimal(
  value: number | null | undefined,
): Prisma.Decimal | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: applicationId, bankApplicationId } = await context.params;

    const body = await request.json();

    const validatedData = bankApplicationSchema.partial().parse(body);

    const existing = await db.loanBankApplication.findFirst({
      where: {
        id: bankApplicationId,
        applicationId,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          message: "Bank application not found",
        },
        {
          status: 404,
        },
      );
    }

    let selectedBank: {
      id: string;
      name: string;
    } | null = null;

    if (validatedData.bankId !== undefined) {
      selectedBank = await db.bank.findFirst({
        where: {
          id: validatedData.bankId,
          status: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!selectedBank) {
        return NextResponse.json(
          {
            message: "Selected bank or NBFC was not found or is inactive",
          },
          {
            status: 404,
          },
        );
      }
    }

    const updated = await db.$transaction(async (transaction) => {
      const bankApplication = await transaction.loanBankApplication.update({
        where: {
          id: bankApplicationId,
        },

        data: {
          bankId: validatedData.bankId,

          applicationDate: toOptionalDate(validatedData.applicationDate),

          appliedAmount: toOptionalDecimal(validatedData.appliedAmount),

          status: validatedData.status,
        },

        include: {
          bank: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      await transaction.loanActivity.create({
        data: {
          applicationId,

          type: "banks",

          title: "Bank application updated",

          description: `Bank application updated for ${
            selectedBank?.name ?? existing.bank.name
          }`,
        },
      });

      return bankApplication;
    });

    return NextResponse.json({
      message: "Bank application updated successfully",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("PATCH bank application error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to update bank application",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id: applicationId, bankApplicationId } = await context.params;

    const existing = await db.loanBankApplication.findFirst({
      where: {
        id: bankApplicationId,
        applicationId,
      },
      include: {
        bank: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          message: "Bank application not found",
        },
        {
          status: 404,
        },
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.loanBankApplication.delete({
        where: {
          id: bankApplicationId,
        },
      });

      await transaction.loanActivity.create({
        data: {
          applicationId,

          type: "banks",

          title: "Bank application deleted",

          description: `Bank application deleted for ${existing.bank.name}`,
        },
      });
    });

    return NextResponse.json({
      message: "Bank application deleted successfully",
    });
  } catch (error: unknown) {
    console.error("DELETE bank application error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete bank application",
      },
      {
        status: 500,
      },
    );
  }
}
