import { NextRequest, NextResponse } from 'next/server';

import db from '@/lib/prisma';

import { updateLoanApplicationSchema } from '@/schemas/loan-application/loan-application.schema';

import {
  serializeLoanApplication,
  toLoanApplicationData,
} from '@/lib/loan-application/server';
import { Prisma } from '@/generated/prisma/client';

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Prisma include matching the CURRENT Prisma schema relation names.
 */
const loanApplicationInclude = {
  Branch: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  User_LoanApplication_counselorIdToUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  User_LoanApplication_fintechAssigneeIdToUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  LoanBankApplication: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },

  LoanCoApplicant: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },

  LoanFollowUp: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },

  LoanActivity: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },

  LoanDocument: {
    orderBy: {
      uploadedAt: 'desc' as const,
    },
  },
} satisfies Prisma.LoanApplicationInclude;

/**
 * GET
 * Get a single loan application.
 */
export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const row = await db.loanApplication.findUnique({
      where: {
        id,
      },
      include: loanApplicationInclude,
    });

    if (!row) {
      return NextResponse.json(
        {
          message: 'Loan application not found',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      data: serializeLoanApplication(row),
    });
  } catch (error) {
    console.error('GET loan application error:', error);

    return NextResponse.json(
      {
        message: 'Failed to load loan application',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PATCH
 * Update a loan application.
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();

    const values = updateLoanApplicationSchema.parse(body);

    const existingApplication = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        {
          message: 'Loan application not found',
        },
        {
          status: 404,
        }
      );
    }

    await db.loanApplication.update({
  where: {
    id,
  },
  data: toLoanApplicationData(values),
});

try {
  await db.loanActivity.create({
    data: {
      id: crypto.randomUUID(),
      applicationId: id,
      type: 'updated',
      title: 'Loan application updated',
      description: 'Loan application details were updated.',
    },
  });
} catch (activityError) {
  console.error('Loan activity creation failed:', activityError);
}

    const updated = await db.loanApplication.findUnique({
      where: {
        id,
      },
      include: loanApplicationInclude,
    });

    if (!updated) {
      return NextResponse.json(
        {
          message: 'Loan application not found after update',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      message: 'Loan application updated successfully',
      data: serializeLoanApplication(updated),
    });
  } catch (error: any) {
    console.error('PATCH loan application error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            message: 'Loan application not found',
          },
          {
            status: 404,
          }
        );
      }
    }

    return NextResponse.json(
      {
        message:
          error?.issues?.[0]?.message ||
          error?.message ||
          'Failed to update loan application',
      },
      {
        status: 400,
      }
    );
  }
}

/**
 * DELETE
 * Delete a loan application.
 */
export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const existingApplication = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        {
          message: 'Loan application not found',
        },
        {
          status: 404,
        }
      );
    }

    await db.loanApplication.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: 'Loan application deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE loan application error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            message: 'Loan application not found',
          },
          {
            status: 404,
          }
        );
      }
    }

    return NextResponse.json(
      {
        message:
          error?.message ||
          'Failed to delete loan application',
      },
      {
        status: 500,
      }
    );
  }
}