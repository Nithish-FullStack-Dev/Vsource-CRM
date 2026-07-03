/**
 * api/mbbs-leads/route.ts
 * GET  /api/mbbs-leads  — list MBBS leads
 * POST /api/mbbs-leads  — create MBBS lead
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { MbbsLeadCreateSchema } from "@/lib/schemas";
import { MbbsLeadStatus } from "@/generated/prisma/enums";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";
// import type { MbbsLeadStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MBBS_LEADS,
      PERMISSIONS.READ,
    );

    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;
    const branchId = sp.get("branchId") ?? undefined;
    const status = sp.get("status") as MbbsLeadStatus | null;
    const preferredCountry = sp.get("preferredCountry") ?? undefined;
    const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
    const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;

    const where: Prisma.MbbsLeadWhereInput = {
      ...(branchId && { branchId }),
      ...(status && { status }),
      ...(preferredCountry && { preferredCountry }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(search && {
        OR: [
          { studentName: { contains: search, mode: "insensitive" as const } },
          { mobileNumber: { contains: search, mode: "insensitive" as const } },
          { emailId: { contains: search, mode: "insensitive" as const } },
          { leadNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    if (currentUser.role.name === ROLES.COUNSELLOR) {
      where.AND = [
        {
          OR: [
            { createdById: currentUser.id },
            { counselors: { some: { counselorId: currentUser.id } } },
          ],
        },
      ];
    }

    const [leads, total] = await Promise.all([
      db.mbbsLead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          counselors: {
            select: { counselor: { select: { name: true, id: true } } },
          },
          _count: { select: { timelines: true } },
        },
      }),
      db.mbbsLead.count({ where }),
    ]);

    return ok(leads, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = MbbsLeadCreateSchema.parse(await req.json());
    const lastLead = await db.mbbsLead.findFirst({
      orderBy: { createdAt: "desc" },
      select: { leadNumber: true },
    });
    let nextNumber = 1;

    if (lastLead?.leadNumber) {
      const currentNumber = parseInt(
        lastLead.leadNumber.replace("MLD", ""),
        10,
      );
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    body.leadNumber = `MLD${String(nextNumber).padStart(4, "0")}`;
    const lead = await db.mbbsLead.create({
      data: body as any,
      include: {
        branch: { select: { id: true, name: true } },
      },
    });
    return created(lead, "MBBS Lead created successfully");
  } catch (err) {
    return handleError(err);
  }
}
