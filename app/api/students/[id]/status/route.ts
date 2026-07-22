// app\api\students\[id]\status\route.ts
import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

const VALID_STATUSES = ["active", "inactive", "drop"] as const;
type StudentStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthorizedUser(
      request,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.UPDATE,
    );

    const { id } = await params;

    const body = await request.json();

    if (!body.status || !VALID_STATUSES.includes(body.status as StudentStatus)) {
      return handleError(
        Object.assign(new Error("Invalid status value"), { status: 400 }),
      );
    }

    const student = await db.student.update({
      where: { id },
      data: { status: body.status as StudentStatus },
      select: {
        id: true,
        studentName: true,
        status: true,
        branchId: true,
        counselorId: true,
      },
    });

    return ok(student, "Student status updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
