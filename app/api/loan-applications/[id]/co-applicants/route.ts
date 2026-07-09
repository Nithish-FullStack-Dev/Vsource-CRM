// app/api/loan-applications/[id]/co-applicants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { coApplicantSchema } from "@/schemas/loan-application/loan-application.schema";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

const nullableString = (value?: string) => {
  const normalized = value?.trim();

  return normalized ? normalized : null;
};

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();

    const validatedData = coApplicantSchema.parse(body);

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        applicationId: true,
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

    const created = await db.$transaction(async (tx) => {
      const coApplicant = await tx.loanCoApplicant.create({
        data: {
          applicationId: id,

          name: validatedData.name.trim(),

          relationship: nullableString(validatedData.relationship),

          dob: validatedData.dob ? new Date(validatedData.dob) : null,

          gender: nullableString(validatedData.gender),

          mobile: nullableString(validatedData.mobile),

          altMobile: nullableString(validatedData.altMobile),

          email: nullableString(validatedData.email),

          pan: validatedData.pan
            ? validatedData.pan.trim().toUpperCase()
            : null,

          aadhaar: nullableString(validatedData.aadhaar),

          address: nullableString(validatedData.address),

          city: nullableString(validatedData.city),

          state: nullableString(validatedData.state),

          pin: nullableString(validatedData.pin),

          employmentType: nullableString(validatedData.employmentType),

          occupation: nullableString(validatedData.occupation),

          employerName: nullableString(validatedData.employerName),

          designation: nullableString(validatedData.designation),

          monthlyIncome: validatedData.monthlyIncome ?? null,

          annualIncome: validatedData.annualIncome ?? null,

          existingEmi: validatedData.existingEmi ?? null,

          cibilScore: validatedData.cibilScore ?? null,
        },
      });

      await tx.loanActivity.create({
        data: {
          applicationId: id,

          type: "co-applicants",

          title: "Co-applicant added",

          description: `${validatedData.name} was added as ${validatedData.relationship}.`,
        },
      });

      return coApplicant;
    });

    return NextResponse.json(
      {
        message: "Co-applicant added successfully",
        data: created,
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error("POST CO-APPLICANT ERROR:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message:
            error.issues[0]?.message ?? "Invalid co-applicant information",

          errors: error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
          meta: error.meta,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to add co-applicant",
      },
      {
        status: 500,
      },
    );
  }
}
