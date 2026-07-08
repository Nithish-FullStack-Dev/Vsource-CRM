import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { followUpSchema } from '@/schemas/loan-application/loan-application.schema';

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
    const validatedData = followUpSchema.parse(body);

    // Check whether the loan application exists
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

    // Create follow-up and activity log together
    const created = await db.$transaction(async (tx) => {
      const followUp = await tx.loanFollowUp.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,

          type: validatedData.type ?? null,
          note: validatedData.note,

          followUpDate: toDate(validatedData.followUpDate),
          nextFollowUp: toDate(validatedData.nextFollowUp),

          // Required by current Prisma schema
          updatedAt: new Date(),
        },
      });

      await tx.loanActivity.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,
          type: 'follow-ups',
          title: 'Follow-up added',
          description: validatedData.note || 'Follow-up added.',
        },
      });

      return followUp;
    });

    return NextResponse.json(
      {
        message: 'Follow-up added successfully',
        data: created,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('POST loan follow-up error:', error);

    return NextResponse.json(
      {
        message:
          error?.issues?.[0]?.message ||
          error?.message ||
          'Failed to add follow-up',
      },
      {
        status: 400,
      }
    );
  }
}