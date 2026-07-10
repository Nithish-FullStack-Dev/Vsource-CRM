import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { createFinancialEditSchema } from "@/schemas/loan-application/loan-application.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const toDecimal = (value: number | undefined) => {
  if (value === undefined) {
    return null;
  }

  return new Prisma.Decimal(value);
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan application ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        loanCategory: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    const body: unknown = await request.json();

    const financialEditSchema = createFinancialEditSchema(
      application.loanCategory,
    );

    const parsed = financialEditSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message || "Invalid financial details",
          errors: parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const updatedApplication = await db.loanApplication.update({
      where: {
        id,
      },
      data: {
        tuitionFee: toDecimal(parsed.data.tuitionFee),
        livingExpenses: toDecimal(parsed.data.livingExpenses),
        otherExpenses: toDecimal(parsed.data.otherExpenses),
        totalCourseCost: toDecimal(parsed.data.totalCourseCost),
        ownContribution: toDecimal(parsed.data.ownContribution),
        requiredLoanAmount: toDecimal(parsed.data.requiredLoanAmount),
        loanPreference: parsed.data.loanPreference ?? null,
        collateralAvailable: parsed.data.collateralAvailable ?? null,
        loanPurpose: parsed.data.loanPurpose ?? null,
        preferredTenure: parsed.data.preferredTenure ?? null,
        cibilScore: parsed.data.cibilScore ?? null,
        propertyType: parsed.data.propertyType ?? null,
        propertyLocation: parsed.data.propertyLocation ?? null,
        propertyValue: toDecimal(parsed.data.propertyValue),
        downPayment: toDecimal(parsed.data.downPayment),
      },
      select: {
        id: true,
        tuitionFee: true,
        livingExpenses: true,
        otherExpenses: true,
        totalCourseCost: true,
        ownContribution: true,
        requiredLoanAmount: true,
        loanPreference: true,
        collateralAvailable: true,
        loanPurpose: true,
        preferredTenure: true,
        cibilScore: true,
        propertyType: true,
        propertyLocation: true,
        propertyValue: true,
        downPayment: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Financial details updated successfully",
      data: {
        id: updatedApplication.id,
        tuitionFee: updatedApplication.tuitionFee?.toString() ?? null,
        livingExpenses: updatedApplication.livingExpenses?.toString() ?? null,
        otherExpenses: updatedApplication.otherExpenses?.toString() ?? null,
        totalCourseCost: updatedApplication.totalCourseCost?.toString() ?? null,
        ownContribution: updatedApplication.ownContribution?.toString() ?? null,
        requiredLoanAmount:
          updatedApplication.requiredLoanAmount?.toString() ?? null,
        loanPreference: updatedApplication.loanPreference,
        collateralAvailable: updatedApplication.collateralAvailable,
        loanPurpose: updatedApplication.loanPurpose,
        preferredTenure: updatedApplication.preferredTenure,
        cibilScore: updatedApplication.cibilScore,
        propertyType: updatedApplication.propertyType,
        propertyLocation: updatedApplication.propertyLocation,
        propertyValue: updatedApplication.propertyValue?.toString() ?? null,
        downPayment: updatedApplication.downPayment?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("PATCH loan financial details error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update financial details",
      },
      {
        status: 500,
      },
    );
  }
}
