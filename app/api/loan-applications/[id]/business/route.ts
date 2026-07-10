// app\api\loan-applications\[id]\business\route.ts

import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable();

const nullableDecimal = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
  .nullable();

const businessDetailsSchema = z
  .object({
    businessName: nullableText(150),
    businessType: nullableText(100),
    registrationType: nullableText(100),
    registrationNumber: nullableText(100),
    yearsInBusiness: nullableText(20),
    annualTurnover: nullableDecimal,
    annualIncome: nullableDecimal,
    existingEmi: nullableDecimal,
    businessAddress: nullableText(2000),
  })
  .strict();

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const toDecimal = (value: string | null) => {
  if (value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = businessDetailsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message || "Invalid business details",
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

    const updatedApplication = await db.loanApplication.update({
      where: {
        id,
      },
      data: {
        businessName: parsed.data.businessName,
        businessType: parsed.data.businessType,
        registrationType: parsed.data.registrationType,
        registrationNumber: parsed.data.registrationNumber,
        yearsInBusiness: parsed.data.yearsInBusiness,
        annualTurnover: toDecimal(parsed.data.annualTurnover),
        annualIncome: toDecimal(parsed.data.annualIncome),
        existingEmi: toDecimal(parsed.data.existingEmi),
        businessAddress: parsed.data.businessAddress,
      },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        registrationType: true,
        registrationNumber: true,
        yearsInBusiness: true,
        annualTurnover: true,
        annualIncome: true,
        existingEmi: true,
        businessAddress: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business details updated successfully",
      data: {
        ...updatedApplication,
        annualTurnover: updatedApplication.annualTurnover?.toString() ?? null,
        annualIncome: updatedApplication.annualIncome?.toString() ?? null,
        existingEmi: updatedApplication.existingEmi?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("PATCH loan business details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update business details",
      },
      {
        status: 500,
      },
    );
  }
}
