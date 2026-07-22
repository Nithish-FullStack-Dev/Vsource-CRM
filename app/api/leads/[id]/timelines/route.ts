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
import { notifyFollowupScheduled } from "@/lib/notification.service";

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

    const { id: leadId } = await params;
    const body = LeadTimelineCreateSchema.parse(await req.json());

    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: { counselors: { select: { counselorId: true } } },
    });
    if (!lead) return notFound("Lead");

    // Update lead's nextFollowup if provided in timeline
    if (body.nextFollowup) {
      await db.lead.update({
        where: { id: leadId },
        data: { nextFollowup: body.nextFollowup },
      });
    }

    const timeline = await db.leadTimeline.create({
      data: {
        leadId,
        ...body,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Fire follow-up scheduled notification
    await notifyFollowupScheduled(
      {
        id: lead.id,
        leadNumber: lead.leadNumber,
        studentName: lead.studentName,
        branchId: lead.branchId,
        counselors: lead.counselors,
      },
      body.nextFollowup || new Date(),
      body.description,
      currentUser.id,
    );

    return created(timeline, "Timeline entry added");
  } catch (err) {
    return handleError(err);
  }
}
