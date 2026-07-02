import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import { getPerformancePeriod } from "@/lib/performance-period";
import type {
  Branch,
  CounsellorPerformance,
  PerformanceQueryParams,
  PerformanceResponse,
  PerformanceSortField,
  SortOrder,
} from "@/types/counsellor-performance";

const COUNSELLOR_ROLE_NAMES = ["Counsellor", "Counselor"];

type AuthorizedUser = {
  id: string;
  role?: {
    name?: string | null;
  } | null;
  branches?: Array<{
    id?: string | null;
    name?: string | null;
  }> | null;
};

export class PerformanceAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "PerformanceAccessError";
    this.status = status;
  }
}

function normalizeRoleName(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function getAssignedBranchIds(branches: AuthorizedUser["branches"]) {
  return Array.from(
    new Set(
      (branches ?? [])
        .map((branch) => branch.id?.trim())
        .filter((branchId): branchId is string => Boolean(branchId)),
    ),
  );
}

function comparePerformance(
  first: CounsellorPerformance,
  second: CounsellorPerformance,
  sortBy: PerformanceSortField,
  sortOrder: SortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;

  if (sortBy === "name") {
    const result = first.name.localeCompare(second.name);

    return result === 0
      ? first.id.localeCompare(second.id)
      : result * direction;
  }

  const firstValue = first[sortBy];
  const secondValue = second[sortBy];
  const result = firstValue - secondValue;

  if (result === 0) {
    return first.name.localeCompare(second.name);
  }

  return result * direction;
}

async function getAvailableBranches(
  roleName: string,
  assignedBranchIds: string[],
): Promise<Branch[]> {
  const isRestrictedRole =
    roleName === "branch manager" ||
    roleName === "counsellor" ||
    roleName === "counselor";

  if (isRestrictedRole && assignedBranchIds.length === 0) {
    return [];
  }

  return db.branch.findMany({
    where: {
      status: true,
      ...(isRestrictedRole
        ? {
            id: {
              in: assignedBranchIds,
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function buildCounsellorPerformanceReport(
  currentUser: AuthorizedUser,
  params: PerformanceQueryParams,
): Promise<PerformanceResponse> {
  const period = getPerformancePeriod(params.period, params.date);
  const roleName = normalizeRoleName(currentUser.role?.name);
  const isCounsellor = roleName === "counsellor" || roleName === "counselor";
  const isBranchManager = roleName === "branch manager";
  const assignedBranchIds = getAssignedBranchIds(currentUser.branches);
  const requestedBranchId = params.branchId?.trim() || undefined;
  const search = params.search?.trim() || undefined;
  const sortBy = params.sortBy ?? "completionPercentage";
  const sortOrder = params.sortOrder ?? "desc";
  const availableBranches = await getAvailableBranches(
    roleName,
    assignedBranchIds,
  );

  if (
    requestedBranchId &&
    (isCounsellor || isBranchManager) &&
    !assignedBranchIds.includes(requestedBranchId)
  ) {
    throw new PerformanceAccessError(
      "You do not have access to the selected branch",
    );
  }

  let effectiveBranchIds: string[] | undefined;

  if (isBranchManager) {
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
        mode: "insensitive",
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
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              branches: {
                some: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const counsellors = await db.user.findMany({
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
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  const counsellorIds = counsellors.map((counsellor) => counsellor.id);

  const [achievements, createdLeads, targets] =
    counsellorIds.length > 0
      ? await Promise.all([
          db.student.groupBy({
            by: ["counselorId"],
            where: {
              counselorId: {
                in: counsellorIds,
              },
              createdAt: {
                gte: period.start,
                lt: period.end,
              },
              ...(effectiveBranchIds !== undefined
                ? {
                    branchId: {
                      in: effectiveBranchIds,
                    },
                  }
                : {}),
            },
            _count: {
              _all: true,
            },
          }),
          db.lead.groupBy({
            by: ["createdById"],
            where: {
              createdById: {
                in: counsellorIds,
              },
              createdAt: {
                gte: period.start,
                lt: period.end,
              },
              ...(effectiveBranchIds !== undefined
                ? {
                    branchId: {
                      in: effectiveBranchIds,
                    },
                  }
                : {}),
            },
            _count: {
              _all: true,
            },
          }),
          db.counsellorMonthlyTarget.findMany({
            where: {
              periodStart: period.targetPeriodStart,
              counsellorId: {
                in: counsellorIds,
              },
            },
            select: {
              counsellorId: true,
              target: true,
            },
          }),
        ])
      : ([[], [], []] as const);

  const achievementMap = new Map<string, number>();
  const leadsCreatedMap = new Map<string, number>();
  const targetMap = new Map<string, number>();

  for (const item of achievements) {
    if (item.counselorId) {
      achievementMap.set(item.counselorId, item._count?._all ?? 0);
    }
  }

  for (const item of createdLeads) {
    if (item.createdById) {
      leadsCreatedMap.set(item.createdById, item._count?._all ?? 0);
    }
  }

  for (const item of targets) {
    targetMap.set(item.counsellorId, item.target);
  }

  const counsellorData = counsellors
    .map<CounsellorPerformance>((counsellor) => {
      const target = targetMap.get(counsellor.id) ?? 0;
      const achieved = achievementMap.get(counsellor.id) ?? 0;
      const leadsCreated = leadsCreatedMap.get(counsellor.id) ?? 0;
      const completionPercentage =
        target > 0 ? Math.round((achieved / target) * 100) : 0;

      return {
        id: counsellor.id,
        name: counsellor.name,
        email: counsellor.email,
        branches: counsellor.branches,
        joinedAt: counsellor.createdAt.toISOString(),
        target,
        achieved,
        leadsCreated,
        completionPercentage,
        targetAchieved: target > 0 && achieved >= target,
      };
    })
    .sort((first, second) =>
      comparePerformance(first, second, sortBy, sortOrder),
    );

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

  return {
    access: {
      role: currentUser.role?.name ?? "Unknown",
      selfOnly: isCounsellor,
      assignedBranchIds:
        isCounsellor || isBranchManager ? assignedBranchIds : [],
      selectedBranchIds: effectiveBranchIds ?? [],
    },
    period: {
      type: period.type,
      date: period.date,
      year: period.year,
      month: period.month,
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      label: period.label,
      targetPeriodStart: period.targetPeriodStart.toISOString(),
    },
    summary: {
      totalCounsellors: counsellorData.length,
      totalTarget: summary.totalTarget,
      totalAchieved: summary.totalAchieved,
      totalLeadsCreated: summary.totalLeadsCreated,
      completionPercentage:
        summary.totalTarget > 0
          ? Math.round((summary.totalAchieved / summary.totalTarget) * 100)
          : 0,
    },
    availableBranches,
    counsellors: counsellorData,
  };
}
