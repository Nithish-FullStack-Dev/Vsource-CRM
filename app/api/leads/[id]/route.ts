/**
 * api/leads/[id]/route.ts
 * GET    /api/leads/:id
 * PATCH  /api/leads/:id
 * DELETE /api/leads/:id
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { LeadUpdateSchema } from "@/lib/schemas";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";
import {
  notifyLeadStatusChanged,
  notifyLeadAssigned,
  notifyLeadFollowupScheduled,
} from "@/lib/notification.service";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.READ,
    );

    const { id } = await params;

    const lead = await db.lead.findFirst({
      where: {
        id,

        OR: [
          {
            createdById: currentUser.id,
          },
          {
            counselors: {
              some: {
                counselorId: currentUser.id,
              },
            },
          },
        ],
      },

      include: {
        branch: true,

        counselors: {
          select: {
            isPrimary: true,

            counselor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        englishTests: {
          orderBy: {
            createdAt: "asc",
          },
        },

        timelines: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },

            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },

        student: true,
      },
    });

    if (!lead) {
      return notFound("Lead");
    }

    return ok(lead);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.UPDATE,
    );

    const { id } = await params;
    const body = LeadUpdateSchema.parse(await req.json());

    const {
      counselorIds,
      englishTests,
      assignedCounselorId: _assignedCounselorId,
      followupDate,
      followupNote,
      branchId,
      ...leadData
    } = body;

    const existingLead = await db.lead.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        studentName: true,
        leadNumber: true,
        branchId: true,
        counselors: {
          select: {
            counselorId: true,
          },
        },
      },
    });

    if (!existingLead) {
      return notFound("Lead");
    }

    const previousCounselorIds = existingLead.counselors.map(
      (assignment) => assignment.counselorId,
    );

    const uniqueCounselorIds =
      counselorIds !== undefined
        ? Array.from(new Set(counselorIds))
        : undefined;

    const newlyAssignedCounselorIds =
      uniqueCounselorIds?.filter(
        (counselorId) => !previousCounselorIds.includes(counselorId),
      ) ?? [];

    const lead = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const updateData: Prisma.LeadUpdateInput = {
        ...leadData,
        ...(body.status !== undefined && {
          status: body.status,
        }),
        ...(branchId && {
          branch: {
            connect: {
              id: branchId,
            },
          },
        }),
        updatedBy: {
          connect: {
            id: currentUser.id,
          },
        },
      };

      if (followupDate) {
        updateData.nextFollowup = new Date(followupDate);
      }

      await tx.lead.update({
        where: {
          id,
        },
        data: updateData,
      });

      if (uniqueCounselorIds !== undefined) {
        await tx.leadCounselor.deleteMany({
          where: {
            leadId: id,
          },
        });

        if (uniqueCounselorIds.length > 0) {
          await tx.leadCounselor.createMany({
            data: uniqueCounselorIds.map((counselorId, index) => ({
              leadId: id,
              counselorId,
              assignedById: currentUser.id,
              isPrimary: index === 0,
            })),
          });
        }
      }

      if (englishTests !== undefined) {
        await tx.leadEnglishTest.deleteMany({
          where: {
            leadId: id,
          },
        });

        if (englishTests.length > 0) {
          await tx.leadEnglishTest.createMany({
            data: englishTests.map((test) => ({
              leadId: id,
              testType: test.testType,
              totalScore: test.totalScore,
              listeningScore: test.listeningScore,
              readingScore: test.readingScore,
              writingScore: test.writingScore,
              speakingScore: test.speakingScore,
            })),
          });
        }
      }

      if (followupDate || followupNote?.trim()) {
        await tx.leadTimeline.create({
          data: {
            leadId: id,
            description: followupNote?.trim() || "Follow-up scheduled",
            nextFollowup: followupDate ? new Date(followupDate) : null,
            createdById: currentUser.id,
            updatedById: currentUser.id,
          },
        });
      }

      const updatedLead = await tx.lead.findUniqueOrThrow({
        where: {
          id,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          counselors: {
            select: {
              isPrimary: true,
              counselorId: true,
              counselor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          englishTests: {
            orderBy: {
              createdAt: "asc",
            },
          },
          timelines: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              updatedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              timelines: true,
            },
          },
        },
      });

      const leadForNotification = {
        id: updatedLead.id,
        leadNumber: updatedLead.leadNumber,
        studentName: updatedLead.studentName,
        branchId: updatedLead.branchId,
        counselors: updatedLead.counselors.map((assignment) => ({
          counselorId: assignment.counselorId,
        })),
      };

      if (body.status !== undefined && body.status !== existingLead.status) {
        await notifyLeadStatusChanged(
          leadForNotification,
          existingLead.status,
          body.status,
          currentUser.id,
          tx,
        );
      }

      if (newlyAssignedCounselorIds.length > 0) {
        await notifyLeadAssigned(
          leadForNotification,
          newlyAssignedCounselorIds,
          currentUser.id,
          tx,
        );
      }

      if (followupDate) {
        await notifyLeadFollowupScheduled(
          leadForNotification,
          new Date(followupDate),
          followupNote?.trim(),
          currentUser.id,
          tx,
        );
      }

      return updatedLead;
    });

    const accessToken = req.cookies.get("access_token")?.value;

    if (accessToken) {
      await triggerNotificationProcessor(accessToken);
    }

    return ok(lead, "Lead updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(req, MODULES.MASTER_LEADS, PERMISSIONS.DELETE);

    const { id } = await params;

    const existingLead = await db.lead.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existingLead) {
      return notFound("Lead");
    }

    await db.lead.delete({
      where: {
        id,
      },
    });

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
