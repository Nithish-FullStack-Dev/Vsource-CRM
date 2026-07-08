import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { bankApplicationSchema } from '@/schemas/loan-application/loan-application.schema';

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

    const body = await req.json();

    const validatedData = bankApplicationSchema.parse(body);

    // Check if loan application exists
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
          message: 'Loan application not found',
        },
        {
          status: 404,
        }
      );
    }

    // Create bank application and activity log
    const created = await db.$transaction(async (tx) => {
      const bankApplication = await tx.loanBankApplication.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,

          bank: validatedData.bank,
          branch: validatedData.branch ?? null,
          applicationNo: validatedData.applicationNo ?? null,

          loginDate: toDate(validatedData.loginDate),

          appliedAmount: validatedData.appliedAmount ?? null,
          sanctionedAmount: validatedData.sanctionedAmount ?? null,

          sanctionDate: toDate(validatedData.sanctionDate),

          disbursedAmount: validatedData.disbursedAmount ?? null,

          disbursementDate: toDate(validatedData.disbursementDate),

          roi: validatedData.roi ?? null,
          tenure: validatedData.tenure ?? null,
          status: validatedData.status ?? null,
          remarks: validatedData.remarks ?? null,

          // Required by your current Prisma schema
          updatedAt: new Date(),
        },
      });

      await tx.loanActivity.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,
          type: 'banks',
          title: 'Bank application added',
          description: `Bank application added for ${validatedData.bank}`,
        },
      });

      return bankApplication;
    });

    return NextResponse.json(
      {
        message: 'Bank application added successfully',
        data: created,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('POST bank application error:', error);

    return NextResponse.json(
      {
        message:
          error?.issues?.[0]?.message ||
          error?.message ||
          'Failed to add bank application',
      },
      {
        status: 400,
      }
    );
  }
}