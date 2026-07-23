// app/api/students/[id]/status/route.ts

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError, notFound } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";
import { notifyStudentStatusChanged } from "@/lib/notification.service";

const VALID_STATUSES = ["active", "inactive", "drop"] as const;

type StudentStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getAuthorizedUser(
      request,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.UPDATE,
    );

    const { id } = await params;
    const body = await request.json();

    if (
      !body.status ||
      !VALID_STATUSES.includes(body.status as StudentStatus)
    ) {
      return handleError(
        Object.assign(new Error("Invalid status value"), {
          status: 400,
        }),
      );
    }

    const newStatus = body.status as StudentStatus;

    const existingStudent = await db.student.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        studentName: true,
        status: true,
        branchId: true,
        counselorId: true,
      },
    });

    if (!existingStudent) {
      return notFound("Student");
    }

    if (existingStudent.status === newStatus) {
      return ok(existingStudent, "Student status is already updated");
    }

    const student = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updatedStudent = await tx.student.update({
          where: {
            id,
          },
          data: {
            status: newStatus,
          },
          select: {
            id: true,
            studentName: true,
            status: true,
            branchId: true,
            counselorId: true,
          },
        });

        await notifyStudentStatusChanged(
          {
            id: updatedStudent.id,
            studentName: updatedStudent.studentName,
            branchId: updatedStudent.branchId,
            counselorId: updatedStudent.counselorId,
          },
          existingStudent.status,
          newStatus,
          currentUser.id,
          tx,
        );

        return updatedStudent;
      },
    );

    const accessToken = request.cookies.get("access_token")?.value;

    if (accessToken) {
      await triggerNotificationProcessor(accessToken);
    }

    return ok(student, "Student status updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
