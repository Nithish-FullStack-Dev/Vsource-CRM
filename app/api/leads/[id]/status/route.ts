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
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

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

    if (!body?.status || typeof body.status !== "string") {
      return badRequest("Status is required");
    }

    const existingLead = await db.lead.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        isConverted: true,
        studentName: true,
        leadNumber: true,
        branchId: true,
        mobileNumber: true,
        emailId: true,
        counselors: {
          select: {
            counselorId: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!existingLead) {
      return notFound("Lead");
    }

    if (body.status === existingLead.status) {
      return ok(existingLead, "Lead status is already updated");
    }

    const oldStatus = existingLead.status;
    const isConverting =
      body.status === "converted" && !existingLead.isConverted;

    const primaryCounselor =
      existingLead.counselors.find((item) => item.isPrimary) ??
      existingLead.counselors[0];

    const studentCounselorId = primaryCounselor?.counselorId ?? currentUser.id;

    const transactionResult = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updatedLead = await tx.lead.update({
          where: {
            id,
          },
          data: {
            status: body.status,
            updatedById: currentUser.id,
            ...(body.status === "converted"
              ? {
                  isConverted: true,
                  convertedAt:
                    existingLead.isConverted && !isConverting
                      ? undefined
                      : new Date(),
                }
              : {}),
          },
        });

        let studentId: string | null = null;
        let studentWasCreated = false;

        if (body.status === "converted") {
          const existingStudent = await tx.student.findUnique({
            where: {
              leadId: existingLead.id,
            },
            select: {
              id: true,
            },
          });

          if (existingStudent) {
            studentId = existingStudent.id;
          } else {
            const newStudent = await tx.student.create({
              data: {
                leadId: existingLead.id,
                branchId: existingLead.branchId,
                counselorId: studentCounselorId,
                studentName:
                  existingLead.studentName || existingLead.leadNumber,
                mobileNumber: existingLead.mobileNumber ?? "",
                emailId: existingLead.emailId ?? "",
              },
              select: {
                id: true,
              },
            });

            studentId = newStudent.id;
            studentWasCreated = true;
          }
        }

        const leadForNotification = {
          id: existingLead.id,
          leadNumber: existingLead.leadNumber,
          studentName: existingLead.studentName,
          branchId: existingLead.branchId,
          counselors: existingLead.counselors.map((assignment) => ({
            counselorId: assignment.counselorId,
          })),
        };

        await notifyLeadStatusChanged(
          leadForNotification,
          oldStatus,
          body.status,
          currentUser.id,
          tx,
        );

        if (isConverting && studentId) {
          await notifyLeadConverted(
            leadForNotification,
            studentId,
            currentUser.id,
            tx,
          );
        }

        if (studentWasCreated && studentId) {
          await notifyStudentCreated(
            {
              id: studentId,
              studentName: existingLead.studentName || existingLead.leadNumber,
              branchId: existingLead.branchId,
              counselorId: studentCounselorId,
            },
            currentUser.id,
            tx,
          );
        }

        return {
          updatedLead,
          studentId,
          studentWasCreated,
        };
      },
    );

    const accessToken = req.cookies.get("access_token")?.value;

    if (accessToken) {
      await triggerNotificationProcessor(accessToken);
    }

    return ok(
      {
        ...transactionResult.updatedLead,
        studentId: transactionResult.studentId,
      },
      body.status === "converted"
        ? "Lead converted successfully"
        : "Lead status updated successfully",
    );
  } catch (err) {
    return handleError(err);
  }
}
