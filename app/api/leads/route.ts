/**
 * api/leads/route.ts
 * GET  /api/leads  — list leads with rich filters
 * POST /api/leads  — create a lead
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
import { LeadCreateSchema } from "@/lib/schemas";
import { LeadStatus, LeadType } from "@/generated/prisma/enums";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.READ,
    );

    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;
    const branchId = sp.get("branchId") ?? undefined;
    const status = sp.get("status") as LeadStatus | null;
    const leadType = sp.get("leadType") as LeadType | null;
    const isConverted =
      sp.get("isConverted") !== null
        ? sp.get("isConverted") === "true"
        : undefined;
    const source = sp.get("source") ?? undefined;
    const preferredCountry = sp.get("preferredCountry") ?? undefined;
    const from = sp.get("from") ? new Date(sp.get("from")!) : undefined;
    const to = sp.get("to") ? new Date(sp.get("to")!) : undefined;

    const andFilters: Prisma.LeadWhereInput[] = [];

    if (currentUser.role.name === ROLES.BRANCH_MANAGER) {
      andFilters.push({
        branchId: {
          in: currentUser.branches.map((branch) => branch.id),
        },
      });
    } else if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR
    ) {
      andFilters.push({
        OR: [
          { createdById: currentUser.id },
          {
            counselors: {
              some: {
                counselorId: currentUser.id,
              },
            },
          },
        ],
      });
    }

    const where: Prisma.LeadWhereInput = {
      ...(branchId && { branchId }),
      ...(status && { status }),
      ...(leadType && { leadType }),
      ...(isConverted !== undefined && { isConverted }),
      ...(source && { source }),
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

      ...(andFilters.length > 0 && {
        AND: andFilters,
      }),
    };

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
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
                  name: true,
                  id: true,
                },
              },
            },
          },

          timelines: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              description: true,
              nextFollowup: true,
              createdAt: true,
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          _count: {
            select: {
              timelines: true,
            },
          },
        },
      }),
      db.lead.count({ where }),
    ]);

    return ok(leads, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.MASTER_LEADS,
      PERMISSIONS.CREATE,
    );

    const body = LeadCreateSchema.parse(await req.json());

    const { counselorIds, ...leadData } = body;

    const allLeads = await db.lead.findMany({
      select: {
        leadNumber: true,
      },
    });

    const highestLeadNumber = allLeads.reduce((max, lead) => {
      const num = parseInt(lead.leadNumber.replace("LD", ""), 10);

      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const leadNumber = `LD${String(highestLeadNumber + 1).padStart(4, "0")}`;

    const existingLead = await db.lead.findFirst({
      where: {
        OR: [
          {
            mobileNumber: leadData.mobileNumber,
          },
          {
            emailId: leadData.emailId,
          },
        ],
      },
    });

    if (existingLead) {
      if (existingLead.mobileNumber === leadData.mobileNumber) {
        throw new Error("Mobile number already exists");
      }

      if (existingLead.emailId === leadData.emailId) {
        throw new Error("Email address already exists");
      }
    }

    const selectedCounselorIds =
      currentUser.role.name === ROLES.COUNSELLOR
        ? [currentUser.id]
        : (counselorIds ?? []);

    const lead = await db.lead.create({
      data: {
        ...leadData,
        leadNumber,
        createdById: currentUser.id,
        updatedById: currentUser.id,

        counselors:
          selectedCounselorIds.length > 0
            ? {
                create: selectedCounselorIds.map((counselorId, index) => ({
                  counselorId,
                  assignedById: currentUser.id,
                  isPrimary: index === 0,
                })),
              }
            : undefined,
      },

      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },

        counselors: {
          include: {
            counselor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return created(lead, "Lead created successfully");
  } catch (err) {
    return handleError(err);
  }
}
