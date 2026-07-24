/**
 * api/leads/[id]/timelines/route.ts
 * GET  /api/leads/:id/timelines  — list timelines for a lead
 * POST /api/leads/:id/timelines  — add a timeline entry
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  notFound,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { LeadTimelineCreateSchema } from "@/lib/schemas";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { notifyLeadFollowupScheduled } from "@/lib/notification.service";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: leadId } = await params;
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) return notFound("Lead");

    const [timelines, total] = await Promise.all([
      db.leadTimeline.findMany({
        where: { leadId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } },
        },
      }),
      db.leadTimeline.count({ where: { leadId } }),
    ]);

    return ok(timelines, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.UPDATE,
    );

    const accessToken = req.cookies.get("access_token")?.value;

    const { id: leadId } = await params;

    const body = LeadTimelineCreateSchema.parse(await req.json());

    const timeline = await db.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: {
          id: leadId,
        },
        include: {
          counselors: {
            select: {
              counselorId: true,
            },
          },
        },
      });

      if (!lead) {
        throw new Error("Lead not found");
      }

      // Update lead's next follow-up date
      if (body.nextFollowup) {
        await tx.lead.update({
          where: {
            id: leadId,
          },
          data: {
            nextFollowup: body.nextFollowup,
          },
        });
      }

      // Create timeline
      const createdTimeline = await tx.leadTimeline.create({
        data: {
          leadId,
          ...body,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Only send notification when a follow-up date exists
      if (body.nextFollowup) {
        await notifyLeadFollowupScheduled(
          {
            id: lead.id,
            leadNumber: lead.leadNumber,
            studentName: lead.studentName,
            branchId: lead.branchId,
            counselors: lead.counselors,
          },
          body.nextFollowup,
          body.description,
          currentUser.id,
          tx,
        );
      }

      return createdTimeline;
    });

    await triggerNotificationProcessor(accessToken);

    return created(timeline, "Timeline entry added");
  } catch (err) {
    return handleError(err);
  }
}
