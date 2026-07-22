// app\api\leads\[id]\status\route.ts
import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { badRequest, handleError, notFound, ok } from "@/lib/api-helpers";
import { Prisma } from "@/generated/prisma/client";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import {
  notifyLeadStatusChanged,
  notifyLeadConverted,
  notifyStudentCreated,
} from "@/lib/notification.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.UPDATE,
    );

    const { id } = await params;
    const body = await req.json();

    if (!body?.status) {
      return badRequest("Status is required");
    }

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        counselors: {
          select: { counselorId: true },
        },
      },
    });

    if (!lead) {
      return notFound("Lead");
    }

    const oldStatus = lead.status;
    const counselorId = currentUser.id || null;
    let createdStudentId: string | null = null;

    const result = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updatedLead = await tx.lead.update({
          where: { id },
          data: {
            status: body.status,
            ...(body.status === "converted"
              ? {
                  isConverted: true,
                  convertedAt: new Date(),
                }
              : {}),
          },
        });

        if (body.status === "converted") {
          const existingStudent = await tx.student.findUnique({
            where: {
              leadId: lead.id,
            },
          });

          if (!existingStudent) {
            const newStudent = await tx.student.create({
              data: {
                leadId: lead.id,
                branchId: lead.branchId,
                counselorId,
                studentName: lead.studentName ?? "",
                mobileNumber: lead.mobileNumber ?? "",
                emailId: lead.emailId ?? "",
              },
            });
            createdStudentId = newStudent.id;
          } else {
            createdStudentId = existingStudent.id;
          }
        }

        return updatedLead;
      },
    );

    // Fire notification triggers after transaction succeeds
    const leadForNotify = {
      id: lead.id,
      leadNumber: lead.leadNumber,
      studentName: lead.studentName,
      branchId: lead.branchId,
      counselors: lead.counselors,
    };

    if (body.status && body.status !== oldStatus) {
      await notifyLeadStatusChanged(
        leadForNotify,
        oldStatus,
        body.status,
        currentUser.id,
      );
    }

    if (body.status === "converted" && createdStudentId) {
      await notifyLeadConverted(
        leadForNotify,
        createdStudentId,
        currentUser.id,
      );
      await notifyStudentCreated(
        {
          id: createdStudentId,
          studentName: lead.studentName || lead.leadNumber,
          branchId: lead.branchId,
          counselorId,
        },
        currentUser.id,
      );
    }

    return ok(
      result,
      body.status === "converted"
        ? "Lead converted successfully"
        : "Lead status updated successfully",
    );
  } catch (err) {
    return handleError(err);
  }
}
