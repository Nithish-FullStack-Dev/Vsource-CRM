// app\api\students\[id]\visa-profile\route.ts

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError, notFound } from "@/lib/api-helpers";
import {
  CasStatus,
  DepositStatus,
  IhsPaidStatus,
  VisaStatus,
  InterviewStatus,
} from "@/generated/prisma/enums";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";
import { notifyVisaStatusChanged } from "@/lib/notification.service";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";

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
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.UPDATE,
    );

    const { id: studentId } = await params;
    const body = await req.json();

    const existingStudent = await db.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        studentName: true,
        branchId: true,
      },
    });

    if (!existingStudent) {
      return notFound("Student");
    }

    const existingProfile = await db.studentVisaProfile.findUnique({
      where: {
        studentId,
      },
      select: {
        visaStatus: true,
      },
    });

    const profile = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updatedProfile = await tx.studentVisaProfile.upsert({
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

            interviewStatus: body.interviewStatus as
              | InterviewStatus
              | undefined,
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

            interviewStatus: body.interviewStatus as
              | InterviewStatus
              | undefined,
          },
        });

        if (
          existingProfile?.visaStatus !== updatedProfile.visaStatus &&
          (updatedProfile.visaStatus === VisaStatus.APPROVED ||
            updatedProfile.visaStatus === VisaStatus.REJECTED)
        ) {
          await notifyVisaStatusChanged(
            {
              id: existingStudent.id,
              studentName: existingStudent.studentName,
              branchId: existingStudent.branchId,
            },
            existingProfile?.visaStatus ?? VisaStatus.DECISION_PENDING,
            updatedProfile.visaStatus,
            currentUser.id,
            tx,
          );
        }

        return updatedProfile;
      },
    );

    const accessToken = req.cookies.get("access_token")?.value;

    if (accessToken) {
      await triggerNotificationProcessor(accessToken);
    }

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
