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
      },
    });

    if (!existingLead) {
      return notFound("Lead");
    }

    const lead = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const updateData: Prisma.LeadUpdateInput = {
        ...leadData,

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

      /*
       * Update assigned counselors only when counselorIds
       * is explicitly provided in the PATCH request.
       */
      if (counselorIds !== undefined) {
        await tx.leadCounselor.deleteMany({
          where: {
            leadId: id,
          },
        });

        if (counselorIds.length > 0) {
          await tx.leadCounselor.createMany({
            data: counselorIds.map((counselorId, index) => ({
              leadId: id,
              counselorId,
              assignedById: currentUser.id,
              isPrimary: index === 0,
            })),
          });
        }
      }

      /*
       * Update English proficiency tests only when
       * englishTests is explicitly provided.
       *
       * Current strategy:
       * 1. Delete existing tests.
       * 2. Create the latest tests received from frontend.
       *
       * Everything happens inside one transaction.
       */
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

      /*
       * Create follow-up timeline entry.
       */
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

      return tx.lead.findUnique({
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
    });

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
