// app\api\students\[id]\timeline\route.ts
import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { TimelineType } from "@/generated/prisma/browser";
import { notifyFollowupScheduled } from "@/lib/notification.service";

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

    const { id } = await params;

    const body = await request.json();

    const timeline = await db.studentTimeline.create({
      data: {
        studentId: id,
        type: body.type as TimelineType,
        description: body.description,
        followupDate: body.followupDate ? new Date(body.followupDate) : null,
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

    // Fire follow-up notification if type is followup and a date was provided
    if (body.type === "followup" && body.followupDate) {
      const student = await db.student.findUnique({
        where: { id },
        select: {
          id: true,
          studentName: true,
          branchId: true,
          counselorId: true,
        },
      });

      if (student) {
        // Build a lead-compatible shape from student data for the notification service
        const leadLike = {
          id: student.id,
          leadNumber: student.studentName ?? id,
          studentName: student.studentName,
          branchId: student.branchId ?? "",
          counselors: student.counselorId
            ? [{ counselorId: student.counselorId }]
            : [],
        };

        notifyFollowupScheduled(
          leadLike,
          body.followupDate,
          body.description ?? null,
          user.id,
        ).catch((err) =>
          console.error("[StudentTimeline] notifyFollowupScheduled failed:", err),
        );
      }
    }

    return ok(timeline, "Timeline added successfully");
  } catch (error) {
    return handleError(error);
  }
}

