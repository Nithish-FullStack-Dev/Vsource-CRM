/**
 * api/branches/route.ts
 * GET  /api/branches
 * POST /api/branches
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
import { BranchCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;

    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = {
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            code: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            city: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),

      ...(status !== undefined && { status }),
    };

    const [branches, total] = await Promise.all([
      db.branch.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },

        include: {
          _count: {
            select: {
              users: true,
              leads: true,
              students: true,
              mbbsLeads: true,
            },
          },

          students: {
            where: {
              visaProfile: {
                is: {
                  visaStatus: "APPROVED",
                },
              },
            },

            select: {
              id: true,
            },
          },
        },
      }),

      db.branch.count({
        where,
      }),
    ]);

    const formattedBranches = branches.map((branch) => ({
      ...branch,

      usersCount: branch._count.users,

      leadsCount: branch._count.leads + branch._count.mbbsLeads,

      studentsCount: branch._count.students,

      visaApprovalsCount: branch.students.length,

      students: undefined,

      _count: undefined,
    }));

    return ok(formattedBranches, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = BranchCreateSchema.parse(await req.json());

    const branch = await db.branch.create({
      data: body,
    });

    return created(branch, "Branch created successfully");
  } catch (err) {
    return handleError(err);
  }
}
