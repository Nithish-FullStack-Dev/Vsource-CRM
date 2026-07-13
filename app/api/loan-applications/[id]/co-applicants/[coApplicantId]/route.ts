// app/api/loan-applications/[id]/co-applicants/[coApplicantId]/route.ts
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    coApplicantId: string;
  }>;
};

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function optionalDecimal(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalInteger(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : undefined;
}

function optionalDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, coApplicantId } = await context.params;
    const body = await request.json();

    const existingCoApplicant = await db.loanCoApplicant.findFirst({
      where: {
        id: coApplicantId,
        applicationId: id,
      },
      select: {
        id: true,
      },
    });

    if (!existingCoApplicant) {
      return NextResponse.json(
        {
          message: "Co-applicant not found",
        },
        {
          status: 404,
        },
      );
    }

    const coApplicant = await db.loanCoApplicant.update({
      where: {
        id: coApplicantId,
      },
      data: {
        name: optionalString(body.name),
        relationship: optionalString(body.relationship),

        dob: optionalDate(body.dob),
        gender: optionalString(body.gender),

        mobile: optionalString(body.mobile),
        altMobile: optionalString(body.altMobile),
        email: optionalString(body.email),

        pan: optionalString(body.pan),
        aadhaar: optionalString(body.aadhaar),

        address: optionalString(body.address),
        city: optionalString(body.city),
        state: optionalString(body.state),
        pin: optionalString(body.pin),

        employmentType: optionalString(body.employmentType),
        occupation: optionalString(body.occupation),
        employerName: optionalString(body.employerName),
        designation: optionalString(body.designation),

        monthlyIncome: optionalDecimal(body.monthlyIncome),
        annualIncome: optionalDecimal(body.annualIncome),
        existingEmi: optionalDecimal(body.existingEmi),

        cibilScore: optionalInteger(body.cibilScore),
      },
    });

    return NextResponse.json({
      message: "Co-applicant updated successfully",
      data: coApplicant,
    });
  } catch (error) {
    console.error("UPDATE CO-APPLICANT ERROR:", error);

    return NextResponse.json(
      {
        message: "Unable to update co-applicant",
      },
      {
        status: 500,
      },
    );
  }
}
