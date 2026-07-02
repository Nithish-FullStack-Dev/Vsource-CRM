// app/api/students/[id]/basic-info/route.ts

import { NextRequest } from "next/server";
import db from "@/lib/prisma";

import { ok, handleError } from "@/lib/api-helpers";
import { encrypt } from "@/lib/encryption";
import { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const updateData: Prisma.StudentUpdateInput = {
      studentName: body.studentName?.trim(),
      mobileNumber: body.mobileNumber?.trim(),
      emailId: body.emailId?.trim().toLowerCase(),

      dob: body.dob ? new Date(body.dob) : null,

      gender: body.gender || null,

      moi: body.moi?.trim() || null,

      undergraduate: body.undergraduate || null,

      applicationDate: body.applicationDate
        ? new Date(body.applicationDate)
        : null,

      counselor: body.counselorId
        ? {
            connect: {
              id: body.counselorId,
            },
          }
        : {
            disconnect: true,
          },

      currentStage: body.currentStage || null,

      status: body.status || undefined,
    };

    if (body.password?.trim()) {
      updateData.password = encrypt(body.password.trim());
    }

    const student = await db.student.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        counselor: true,
        branch: true,
      },
    });

    return ok(student);
  } catch (error) {
    return handleError(error);
  }
}
