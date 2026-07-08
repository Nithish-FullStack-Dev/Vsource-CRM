import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { coApplicantSchema } from '@/schemas/loan-application/loan-application.schema';

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();
    const validatedData = coApplicantSchema.parse(body);

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

    // Create co-applicant and activity log together
    const created = await db.$transaction(async (tx) => {
      const coApplicant = await tx.loanCoApplicant.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,

          name: validatedData.name,
          relationship: validatedData.relationship ?? null,
          mobile: validatedData.mobile ?? null,
          email: validatedData.email ?? null,
          occupation: validatedData.occupation ?? null,
          income: validatedData.income ?? null,
          cibilScore: validatedData.cibilScore ?? null,

          // Required by the current Prisma schema
          updatedAt: new Date(),
        },
      });

      await tx.loanActivity.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,
          type: 'co-applicants',
          title: 'Co-applicant added',
          description: `Co-applicant ${validatedData.name} added`,
        },
      });

      return coApplicant;
    });

    return NextResponse.json(
      {
        message: 'Co-applicant added successfully',
        data: created,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('POST co-applicant error:', error);

    return NextResponse.json(
      {
        message:
          error?.issues?.[0]?.message ||
          error?.message ||
          'Failed to add co-applicant',
      },
      {
        status: 400,
      }
    );
  }
}