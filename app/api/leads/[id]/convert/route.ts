/**
 * api/leads/[id]/convert/route.ts
 * POST /api/leads/:id/convert
 *
 * Converts a Lead -> Student in one transaction and permanently records
 * which authenticated user performed the conversion.
 */

import { NextRequest } from "next/server";
import { z } from "zod";

import db from "@/lib/prisma";
import { badRequest, handleError, notFound, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getAuthorizedUser } from "@/lib/rbac";
import {
  notifyLeadConverted,
  notifyStudentCreated,
} from "@/lib/notification.service";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

const ConvertSchema = z.object({
  studentNumber: z.string().trim().min(1).optional(),
  counselorId: z.string().uuid().optional(),
});

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.UPDATE,
    );

    const { id: leadId } = await params;

    const body = ConvertSchema.parse(await req.json().catch(() => ({})));

    const lead = await db.lead.findUnique({
      where: {
        id: leadId,
      },

      select: {
        id: true,
        leadNumber: true,
        studentName: true,
        mobileNumber: true,
        emailId: true,
        branchId: true,
        isConverted: true,
        moi: true,

        student: {
          select: {
            id: true,
          },
        },

        counselors: {
          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              assignedAt: "asc",
            },
          ],

          select: {
            counselorId: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!lead) {
      return notFound("Lead");
    }

    if (lead.isConverted || lead.student) {
      return badRequest("Lead is already converted");
    }

    const studentName = clean(lead.studentName);
    const mobileNumber = clean(lead.mobileNumber);
    const emailId = clean(lead.emailId).toLowerCase();

    if (!studentName || !mobileNumber || !emailId) {
      return badRequest(
        "Student name, mobile number and email are required before conversion",
      );
    }

    const primaryCounselorId =
      lead.counselors.find((assignment) => assignment.isPrimary)?.counselorId ??
      null;

    const firstAssignedCounselorId = lead.counselors[0]?.counselorId ?? null;

    const counselorId =
      body.counselorId ??
      primaryCounselorId ??
      firstAssignedCounselorId ??
      currentUser.id;

    const result = await db.$transaction(async (tx) => {
      const convertedAt = new Date();

      const updatedLead = await tx.lead.update({
        where: {
          id: leadId,
        },

        data: {
          isConverted: true,
          convertedAt,
          convertedById: currentUser.id,
          updatedById: currentUser.id,
          status: "VISA_APPLICATION",
        },
      });

      const student = await tx.student.create({
        data: {
          leadId,
          branchId: lead.branchId,
          counselorId,
          studentName,
          mobileNumber,
          emailId,
          moi: lead.moi,

          // Add this only when Student has a studentNumber field:
          // studentNumber: body.studentNumber,
        },
      });

      return {
        lead: updatedLead,
        student,
      };
    });

    // Notify about lead conversion + new student
    await notifyLeadConverted(
      {
        id: leadId,
        leadNumber: lead.leadNumber,
        studentName: lead.studentName,
        branchId: lead.branchId,
        counselors: lead.counselors,
      },
      result.student.id,
      currentUser.id,
    );

    await notifyStudentCreated(
      {
        id: result.student.id,
        studentName: result.student.studentName,
        branchId: result.student.branchId,
        counselorId: result.student.counselorId,
      },
      currentUser.id,
    );

    return ok(result, "Lead converted to student successfully");
  } catch (error) {
    return handleError(error);
  }
}
