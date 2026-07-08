import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { activitySchema } from '@/schemas/loan-application/loan-application.schema';

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();

    const validatedData = activitySchema.parse(body);

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

    // Create activity
    const created = await db.loanActivity.create({
      data: {
        id: crypto.randomUUID(),
        applicationId: id,
        type: validatedData.type ?? 'activities',
        title: validatedData.title,
        description: validatedData.description ?? null,
      },
    });

    return NextResponse.json(
      {
        message: 'Activity added successfully',
        data: created,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('POST loan activity error:', error);

    return NextResponse.json(
      {
        message:
          error?.issues?.[0]?.message ||
          error?.message ||
          'Failed to add activity',
      },
      {
        status: 400,
      }
    );
  }
}