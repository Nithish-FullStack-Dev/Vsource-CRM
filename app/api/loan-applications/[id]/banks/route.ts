// app\api\loan-applications\[id]\banks\route.ts

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { bankApplicationSchema } from "@/schemas/loan-application/loan-application.schema";
import { Prisma } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toOptionalDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid application date");
  }

  return date;
}

function toDecimal(value?: number | null): Prisma.Decimal | null {
  if (value === undefined || value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: applicationId } = await context.params;
    const body = await request.json();

    const validatedData = bankApplicationSchema.parse(body);

    const [application, bank] = await Promise.all([
      db.loanApplication.findUnique({
        where: {
          id: applicationId,
        },
        select: {
          id: true,
          applicationId: true,
          fullName: true,
        },
      }),

      db.bank.findFirst({
        where: {
          id: validatedData.bankId,
          status: true,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

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

    if (!bank) {
      return NextResponse.json(
        {
          message: "Selected bank or NBFC was not found or is inactive",
        },
        {
          status: 404,
        },
      );
    }

    const existingBankApplication = await db.loanBankApplication.findUnique({
      where: {
        applicationId_bankId: {
          applicationId,
          bankId: validatedData.bankId,
        },
      },
    });

    if (existingBankApplication) {
      return NextResponse.json(
        {
          message: `${bank.name} has already been added to this loan application.`,
        },
        {
          status: 409,
        },
      );
    }

    const created = await db.$transaction(async (transaction) => {
      const bankApplication = await transaction.loanBankApplication.create({
        data: {
          applicationId,

          bankId: validatedData.bankId,

          applicationDate: toOptionalDate(validatedData.applicationDate),

          appliedAmount: toDecimal(validatedData.appliedAmount),

          status: validatedData.status ?? null,
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

          title: "Bank application added",

          description: `Bank application added for ${bank.name}`,
        },
      });

      return bankApplication;
    });

    return NextResponse.json(
      {
        message: "Bank application added successfully",
        data: created,
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error("POST bank application error:", error);

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
        message: "Failed to add bank application",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
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

    return NextResponse.json(application.bankApplications);
  } catch (error) {
    console.error("GET BANK APPLICATIONS ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to load bank applications",
      },
      {
        status: 500,
      },
    );
  }
}
