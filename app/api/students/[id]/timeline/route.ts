// app\api\students\[id]\timeline\route.ts
import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { TimelineType } from "@/generated/prisma/browser";
import {
  notifyFollowupScheduled,
  scheduleFollowupReminder,
} from "@/lib/notification.service";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await getAuthorizedUser(
      request,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );

    const { id } = await params;

    const timeline = await db.studentTimeline.findMany({
      where: {
        studentId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return ok(timeline);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthorizedUser(
      request,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.CREATE,
    );

    const accessToken = request.cookies.get("access_token")?.value;
    const { id } = await params;
    const body = await request.json();

    const followupDate = body.followupDate ? new Date(body.followupDate) : null;

    if (
      body.type === "followup" &&
      (!followupDate || Number.isNaN(followupDate.getTime()))
    ) {
      throw new Error("A valid follow-up date is required");
    }

    const timeline = await db.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          studentName: true,
          branchId: true,
          counselorId: true,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      const createdTimeline = await tx.studentTimeline.create({
        data: {
          studentId: id,
          type: body.type as TimelineType,
          description: body.description?.trim() || null,
          followupDate,
          createdById: user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (createdTimeline.type === "followup" && createdTimeline.followupDate) {
        // Immediate notification:
        // "Follow-up has been scheduled."
        await notifyFollowupScheduled(
          student,
          createdTimeline.followupDate,
          createdTimeline.description,
          user.id,
          tx,
        );

        // Future notification:
        // "You have a follow-up today."
        await scheduleFollowupReminder(
          {
            id: createdTimeline.id,
            studentId: createdTimeline.studentId,
            followupDate: createdTimeline.followupDate,
            description: createdTimeline.description,
          },
          student,
          user.id,
          tx,
        );
      }

      return createdTimeline;
    });

    /*
     * This processes only notifications that are due now.
     *
     * FOLLOWUP_SCHEDULED will be processed.
     * FOLLOWUP_REMINDER remains PENDING because its
     * nextAttemptAt is in the future.
     */
    await triggerNotificationProcessor(accessToken);

    return ok(timeline, "Timeline added successfully");
  } catch (error) {
    return handleError(error);
  }
}
