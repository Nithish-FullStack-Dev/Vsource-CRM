import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import { resolvePerformancePeriodRange } from "@/lib/performance-period";
import type {
  Branch,
  CounsellorPerformance,
  PerformanceQueryParams,
  PerformanceResponse,
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

type CounsellorWithIntakeTarget = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  branches: Branch[];
  intakeTargets: {
    target: number;
  }[];
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
        .map((branch) => branch.id?.trim())
        .filter((branchId): branchId is string => Boolean(branchId)),
    ),
  );
}

function calculateCompletionPercentage(target: number, achieved: number) {
  if (target <= 0) {
    return achieved > 0 ? 100 : 0;
  }

  return Math.round((achieved / target) * 100);
}

function sortPerformanceRows(
  rows: CounsellorPerformance[],
  sortBy: PerformanceQueryParams["sortBy"],
  sortOrder: PerformanceQueryParams["sortOrder"],
) {
  const field = sortBy ?? "completionPercentage";
  const direction = sortOrder === "asc" ? 1 : -1;

  return [...rows].sort((first, second) => {
    const firstValue = first[field];
    const secondValue = second[field];

    if (typeof firstValue === "string" && typeof secondValue === "string") {
      return firstValue.localeCompare(secondValue) * direction;
    }

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      return (firstValue - secondValue) * direction;
    }

    return 0;
  });
}

function createEmptyReport(
  params: PerformanceQueryParams,
  periodRange: ReturnType<typeof resolvePerformancePeriodRange>,
  availableBranches: Branch[],
  availableIntakes: {
    id: string;
    name: string;
  }[],
  intakeName = "No active intake",
): PerformanceResponse {
  return {
    period: {
      type: params.period,
      label: periodRange.label,
      date: params.date,
      startDate: periodRange.startDate,
      endDate: periodRange.endDate,
      intakeId: "",
      intakeName,
    },
    summary: {
      totalCounsellors: 0,
      totalTarget: 0,
      totalAchieved: 0,
      totalApplicationsCreated: 0,
      completionPercentage: 0,
    },
    counsellors: [],
    availableBranches,
    availableIntakes,
  };
}

export async function buildCounsellorPerformanceReport(
  currentUser: AuthorizedUser,
  params: PerformanceQueryParams,
): Promise<PerformanceResponse> {
  const roleName = normalizeRoleName(currentUser.role?.name);
  const isCounsellor = roleName === "counsellor" || roleName === "counselor";
  const isBranchManager = roleName === "branch manager";
  const assignedBranchIds = getAssignedBranchIds(currentUser.branches);

  if (isBranchManager && assignedBranchIds.length === 0) {
    throw new PerformanceAccessError(
      "No branches are assigned to your account",
    );
  }

  const periodRange = resolvePerformancePeriodRange({
    period: params.period,
    date: params.date,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const availableBranches = await db.branch.findMany({
    where: isBranchManager
      ? {
          id: {
            in: assignedBranchIds,
          },
        }
      : undefined,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const availableIntakes = await db.intake.findMany({
    where: {
      status: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (availableIntakes.length === 0) {
    return createEmptyReport(
      params,
      periodRange,
      availableBranches,
      availableIntakes,
    );
  }

  const requestedIntakeId = params.intakeId?.trim();

  const selectedIntake =
    availableIntakes.find((intake) => intake.id === requestedIntakeId) ??
    availableIntakes[0];

  const requestedBranchId =
    params.branchId && params.branchId !== "all"
      ? params.branchId.trim()
      : undefined;

  if (
    isBranchManager &&
    requestedBranchId &&
    !assignedBranchIds.includes(requestedBranchId)
  ) {
    throw new PerformanceAccessError(
      "You do not have access to the selected branch",
    );
  }

  const branchRestriction: Prisma.UserWhereInput = isBranchManager
    ? {
        branches: {
          some: {
            id: {
              in: assignedBranchIds,
            },
          },
        },
      }
    : {};

  const branchFilter: Prisma.UserWhereInput = requestedBranchId
    ? {
        branches: {
          some: {
            id: requestedBranchId,
          },
        },
      }
    : {};

  const searchText = params.search?.trim();

  const searchFilter: Prisma.UserWhereInput = searchText
    ? {
        OR: [
          {
            name: {
              contains: searchText,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: searchText,
              mode: "insensitive",
            },
          },
          {
            branches: {
              some: {
                name: {
                  contains: searchText,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      }
    : {};

  const counsellors: CounsellorWithIntakeTarget[] = await db.user.findMany({
    where: {
      role: {
        name: {
          in: COUNSELLOR_ROLE_NAMES,
          mode: "insensitive",
        },
      },
      ...(isCounsellor ? { id: currentUser.id } : {}),
      ...branchRestriction,
      ...branchFilter,
      ...searchFilter,
    },
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
      intakeTargets: {
        where: {
          intakeId: selectedIntake.id,
        },
        select: {
          target: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const counsellorIds = counsellors.map((counsellor) => counsellor.id);
  const achievedByCounsellor = new Map<string, number>();

  if (counsellorIds.length > 0) {
    const applications = await db.studentApplication.findMany({
      where: {
        intakeId: selectedIntake.id,
        createdAt: {
          gte: periodRange.start,
          lt: periodRange.end,
        },
        student: {
          counselorId: {
            in: counsellorIds,
          },
        },
      },
      select: {
        id: true,
        student: {
          select: {
            counselorId: true,
          },
        },
      },
    });

    for (const application of applications) {
      const counsellorId = application.student?.counselorId;

      if (!counsellorId) {
        continue;
      }

      achievedByCounsellor.set(
        counsellorId,
        (achievedByCounsellor.get(counsellorId) ?? 0) + 1,
      );
    }
  }

  const rows: CounsellorPerformance[] = counsellors.map((counsellor) => {
    const intakeTarget = counsellor.intakeTargets.at(0);
    const target = intakeTarget?.target ?? 0;
    const achieved = achievedByCounsellor.get(counsellor.id) ?? 0;
    const completionPercentage = calculateCompletionPercentage(
      target,
      achieved,
    );

    return {
      id: counsellor.id,
      name: counsellor.name,
      email: counsellor.email,
      joinedAt: counsellor.createdAt.toISOString(),
      branches: counsellor.branches,
      target,
      achieved,
      applicationsCreated: achieved,
      completionPercentage,
      targetAchieved: target > 0 && achieved >= target,
    };
  });

  const sortedRows = sortPerformanceRows(rows, params.sortBy, params.sortOrder);
  const totalTarget = rows.reduce((sum, row) => sum + row.target, 0);
  const totalAchieved = rows.reduce((sum, row) => sum + row.achieved, 0);
  const completionPercentage = calculateCompletionPercentage(
    totalTarget,
    totalAchieved,
  );

  return {
    period: {
      type: params.period,
      label: periodRange.label,
      date: params.date,
      startDate: periodRange.startDate,
      endDate: periodRange.endDate,
      intakeId: selectedIntake.id,
      intakeName: selectedIntake.name,
    },
    summary: {
      totalCounsellors: rows.length,
      totalTarget,
      totalAchieved,
      totalApplicationsCreated: totalAchieved,
      completionPercentage,
    },
    counsellors: sortedRows,
    availableBranches,
    availableIntakes,
  };
}
