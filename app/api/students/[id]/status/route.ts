import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const student = await db.student.update({
      where: {
        id,
      },
      data: {
        status: body.status,
      },
    });

    return ok(student, "Student status updated successfully");
  } catch (error) {
    return handleError(error);
  }
}
