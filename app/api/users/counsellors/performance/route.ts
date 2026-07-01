// app\api\users\counsellors\performance\route.ts

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getCurrentIstMonth, getIstMonthRange } from "@/lib/month-range";

type UpdateMonthlyTargetBody = {
  counsellorId?: string;
  year?: number;
  month?: number;
  target?: number;
};

const COUNSELLOR_ROLE_NAMES = ["Counsellor", "Counselor"];

function normalizeRoleName(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function getAssignedBranchIds(
  branches:
    | Array<{
        id?: string | null;
      }>
    | null
    | undefined,
) {
  return Array.from(
    new Set(
      (branches ?? [])
        .map((branch) => branch?.id?.trim())
        .filter((branchId): branchId is string => Boolean(branchId)),
    ),
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    {
      status: 403,
    },
  );
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.READ,
    );

    const searchParams = req.nextUrl.searchParams;
    const currentMonth = getCurrentIstMonth();

    const year = Number(searchParams.get("year") ?? currentMonth.year);

    const month = Number(searchParams.get("month") ?? currentMonth.month);

    const requestedBranchId = searchParams.get("branchId")?.trim() || undefined;

    const { start, end, periodStart } = getIstMonthRange(year, month);

    const roleName = normalizeRoleName(currentUser.role?.name);

    const isCounsellor = roleName === "counsellor" || roleName === "counselor";

    const isBranchManager = roleName === "branch manager";

    const assignedBranchIds = getAssignedBranchIds(currentUser.branches);

    let effectiveBranchIds: string[] | undefined;

    if (isBranchManager) {
      if (requestedBranchId && !assignedBranchIds.includes(requestedBranchId)) {
        return forbidden("You do not have access to the selected branch");
      }

      effectiveBranchIds = requestedBranchId
        ? [requestedBranchId]
        : assignedBranchIds;
    } else if (requestedBranchId) {
      effectiveBranchIds = [requestedBranchId];
    }

    const counsellorWhere: Prisma.UserWhereInput = {
      role: {
        name: {
          in: COUNSELLOR_ROLE_NAMES,
        },
      },
      ...(isCounsellor
        ? {
            id: currentUser.id,
          }
        : {}),
      ...(effectiveBranchIds !== undefined
        ? {
            branches: {
              some: {
                id: {
                  in: effectiveBranchIds,
                },
              },
            },
          }
        : {}),
    };

    const studentWhere: Prisma.StudentWhereInput = {
      counselorId: isCounsellor
        ? currentUser.id
        : {
            not: null,
          },
      createdAt: {
        gte: start,
        lt: end,
      },
      ...(effectiveBranchIds !== undefined
        ? {
            branchId: {
              in: effectiveBranchIds,
            },
          }
        : {}),
    };

    const leadWhere: Prisma.LeadWhereInput = {
      createdById: isCounsellor
        ? currentUser.id
        : {
            not: null,
          },
      createdAt: {
        gte: start,
        lt: end,
      },
      ...(effectiveBranchIds !== undefined
        ? {
            branchId: {
              in: effectiveBranchIds,
            },
          }
        : {}),
    };

    const [counsellors, achievements, createdLeads, targets] =
      await db.$transaction([
        db.user.findMany({
          where: counsellorWhere,
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            branches: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        }),

        db.student.groupBy({
          by: ["counselorId"],
          where: studentWhere,
          orderBy: {
            counselorId: "asc",
          },
          _count: {
            _all: true,
          },
        }),

        db.lead.groupBy({
          by: ["createdById"],
          where: leadWhere,
          orderBy: {
            createdById: "asc",
          },
          _count: {
            _all: true,
          },
        }),

        db.counsellorMonthlyTarget.findMany({
          where: {
            periodStart,
            counsellor: counsellorWhere,
          },
          select: {
            counsellorId: true,
            target: true,
          },
        }),
      ]);

    const achievementMap = new Map<string, number>();

    for (const item of achievements) {
      if (!item.counselorId) continue;

      const count = (item._count as { _all: number } | undefined)?._all ?? 0;

      achievementMap.set(item.counselorId, count);
    }

    const leadsCreatedMap = new Map<string, number>();

    for (const item of createdLeads) {
      if (!item.createdById) continue;

      const count = (item._count as { _all: number } | undefined)?._all ?? 0;

      leadsCreatedMap.set(item.createdById, count);
    }

    const targetMap = new Map<string, number>();

    for (const item of targets) {
      targetMap.set(item.counsellorId, item.target);
    }

    const counsellorData = counsellors.map((counsellor) => {
      const target = targetMap.get(counsellor.id) ?? 0;

      const achieved = achievementMap.get(counsellor.id) ?? 0;

      const leadsCreated = leadsCreatedMap.get(counsellor.id) ?? 0;

      return {
        id: counsellor.id,
        name: counsellor.name,
        email: counsellor.email,
        branches: counsellor.branches ?? [],
        joinedAt: counsellor.createdAt,
        year,
        month,
        periodStart,
        target,
        achieved,
        leadsCreated,
        completionPercentage:
          target > 0 ? Math.round((achieved / target) * 100) : 0,
        targetAchieved: target > 0 && achieved >= target,
      };
    });

    const summary = counsellorData.reduce(
      (result, counsellor) => {
        result.totalTarget += counsellor.target;

        result.totalAchieved += counsellor.achieved;

        result.totalLeadsCreated += counsellor.leadsCreated;

        return result;
      },
      {
        totalTarget: 0,
        totalAchieved: 0,
        totalLeadsCreated: 0,
      },
    );

    return ok({
      access: {
        role: currentUser.role?.name ?? "Unknown",
        selfOnly: isCounsellor,
        assignedBranchIds: isBranchManager ? assignedBranchIds : [],
        selectedBranchIds: effectiveBranchIds ?? [],
      },
      period: {
        year,
        month,
        start,
        end,
      },
      summary: {
        totalTarget: summary.totalTarget,
        totalAchieved: summary.totalAchieved,
        totalLeadsCreated: summary.totalLeadsCreated,
        completionPercentage:
          summary.totalTarget > 0
            ? Math.round((summary.totalAchieved / summary.totalTarget) * 100)
            : 0,
      },
      counsellors: counsellorData,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.UPDATE,
    );

    const body = (await req
      .json()
      .catch(() => null)) as UpdateMonthlyTargetBody | null;

    const counsellorId =
      typeof body?.counsellorId === "string" ? body.counsellorId.trim() : "";

    const year = Number(body?.year);
    const month = Number(body?.month);
    const target = Number(body?.target);

    if (!counsellorId) {
      throw new Error("Counsellor ID is required");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new Error("Invalid year");
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Invalid month");
    }

    if (!Number.isInteger(target) || target < 0) {
      throw new Error("Target must be a non-negative integer");
    }

    const roleName = normalizeRoleName(currentUser.role?.name);

    const isCounsellor = roleName === "counsellor" || roleName === "counselor";

    const isBranchManager = roleName === "branch manager";

    const assignedBranchIds = getAssignedBranchIds(currentUser.branches);

    if (isCounsellor && counsellorId !== currentUser.id) {
      return forbidden("You can only access your own target");
    }

    if (isBranchManager && assignedBranchIds.length === 0) {
      return forbidden("No branches are assigned to your account");
    }

    const { periodStart } = getIstMonthRange(year, month);

    const counsellorWhere: Prisma.UserWhereInput = {
      id: counsellorId,
      role: {
        name: {
          in: COUNSELLOR_ROLE_NAMES,
        },
      },
      ...(isBranchManager
        ? {
            branches: {
              some: {
                id: {
                  in: assignedBranchIds,
                },
              },
            },
          }
        : {}),
    };

    const counsellor = await db.user.findFirst({
      where: counsellorWhere,
      select: {
        id: true,
        name: true,
      },
    });

    if (!counsellor) {
      return forbidden(
        "Counsellor not found or you do not have access to this counsellor",
      );
    }

    const monthlyTarget = await db.counsellorMonthlyTarget.upsert({
      where: {
        counsellorId_periodStart: {
          counsellorId: counsellor.id,
          periodStart,
        },
      },
      update: {
        target,
      },
      create: {
        counsellorId: counsellor.id,
        periodStart,
        target,
      },
      select: {
        id: true,
        counsellorId: true,
        periodStart: true,
        target: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({
      ...monthlyTarget,
      counsellorName: counsellor.name,
    });
  } catch (error) {
    return handleError(error);
  }
}
