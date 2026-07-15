// app\api\students\[id]\visa-profile\route.ts

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import {
  CasStatus,
  DepositStatus,
  IhsPaidStatus,
  VisaStatus,
  InterviewStatus,
} from "@/generated/prisma/enums";

const parseNullableDate = (value: unknown) => {
  if (!value || typeof value !== "string") return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

async function saveVisaProfile(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;
    const body = await req.json();

    const profile = await db.studentVisaProfile.upsert({
      where: {
        studentId,
      },

      create: {
        student: {
          connect: {
            id: studentId,
          },
        },

        depositDeadlineDate: parseNullableDate(body.depositDeadlineDate),
        depositStatus: body.depositStatus as DepositStatus | undefined,

        ihsPaidStatus: body.ihsPaidStatus as IhsPaidStatus | undefined,
        visaPaidStatus: body.visaPaidStatus ?? null,

        casDeadlineDate: parseNullableDate(body.casDeadlineDate),
        casStatus: body.casStatus as CasStatus | undefined,

        visaStatus: body.visaStatus as VisaStatus | undefined,
        visaDecisionDate: parseNullableDate(body.visaDecisionDate),

        universityStartDate: parseNullableDate(body.universityStartDate),
        universityEndDate: parseNullableDate(body.universityEndDate),

        interviewStatus: body.interviewStatus as InterviewStatus | undefined,
      },

      update: {
        depositDeadlineDate: parseNullableDate(body.depositDeadlineDate),
        depositStatus: body.depositStatus as DepositStatus | undefined,

        ihsPaidStatus: body.ihsPaidStatus as IhsPaidStatus | undefined,
        visaPaidStatus: body.visaPaidStatus ?? null,

        casDeadlineDate: parseNullableDate(body.casDeadlineDate),
        casStatus: body.casStatus as CasStatus | undefined,

        visaStatus: body.visaStatus as VisaStatus | undefined,

        visaDecisionDate: parseNullableDate(body.visaDecisionDate),

        universityStartDate: parseNullableDate(body.universityStartDate),
        universityEndDate: parseNullableDate(body.universityEndDate),

        interviewStatus: body.interviewStatus as InterviewStatus | undefined,
      },
    });

    return ok(profile, "Visa profile saved successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return saveVisaProfile(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return saveVisaProfile(req, context);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    const profile = await db.studentVisaProfile.findUnique({
      where: {
        studentId,
      },
    });

    return ok(profile, "Visa profile fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
