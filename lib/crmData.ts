import db from "@/lib/prisma";
import {
  BranchPerformanceGroup,
  DashboardDataFilters,
  DashboardResponse,
  MastersResponse,
  UserPerformance,
} from "./crmTypes";

const monthIndex: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function formatDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function parseIntakeValue(name: string) {
  const match = name.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
  );
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[2]) * 12 + monthIndex[match[1].toLowerCase()];
}

function sortIntakesByUpcoming<T extends { name: string }>(intakes: T[]) {
  const now = new Date();
  const currentValue = now.getFullYear() * 12 + now.getMonth();
  return [...intakes].sort((a, b) => {
    const av = parseIntakeValue(a.name);
    const bv = parseIntakeValue(b.name);
    const aUpcoming = av >= currentValue;
    const bUpcoming = bv >= currentValue;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return av - bv || a.name.localeCompare(b.name);
  });
}

export function getDateRangeBounds(
  type: "today" | "week" | "month" | "custom",
  customStart: string | null,
  customEnd: string | null,
): { startDate: string; endDate: string; start: Date; end: Date } {
  const anchorDate = new Date();
  let start = new Date(anchorDate);
  let end = new Date(anchorDate);

  if (type === "week") {
    const day = anchorDate.getDay();
    start.setDate(anchorDate.getDate() - day);
    end.setDate(anchorDate.getDate() + (6 - day));
  } else if (type === "month") {
    start = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  } else if (type === "custom") {
    start = parseDateInput(customStart, start);
    end = parseDateInput(customEnd, end);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    start,
    end,
  };
}

function leadDateWhere(start: Date, end: Date) {
  return {
    OR: [
      { counsellingDate: { gte: start, lte: end } },
      { counsellingDate: null, createdAt: { gte: start, lte: end } },
    ],
  };
}

function studentDateWhere(start: Date, end: Date) {
  return {
    OR: [
      { applicationDate: { gte: start, lte: end } },
      { applicationDate: null, createdAt: { gte: start, lte: end } },
    ],
  };
}

function visaDateWhere(start: Date, end: Date) {
  return {
    OR: [
      { visaDecisionDate: { gte: start, lte: end } },
      { visaDecisionDate: null, updatedAt: { gte: start, lte: end } },
    ],
  };
}

function leadUserWhere(userId: string) {
  return {
    OR: [
      { createdById: userId },
      { convertedById: userId },
      { student: { counselorId: userId } },
    ],
  };
}

function leadIntakeWhere(intake: string | null) {
  if (!intake) return null;
  return {
    OR: [
      { preferredIntake: intake },
      { student: { applications: { some: { intake: { name: intake } } } } },
    ],
  };
}

function studentIntakeWhere(intake: string | null) {
  if (!intake) return {};
  return {
    OR: [
      { applications: { some: { intake: { name: intake } } } },
      { lead: { preferredIntake: intake } },
    ],
  };
}

function andWhere(items: Array<any | null>) {
  const filtered = items.filter(Boolean);
  return filtered.length ? { AND: filtered } : {};
}

async function getTargetForUser(
  branchId: string,
  userId: string,
  intake: string | null,
) {
  const where: any = {
    branchId,
    counsellorId: userId,
  };

  if (intake) {
    where.intake = { name: intake };
  }

  const rows = await db.counsellorIntakeTarget.findMany({
    where: {
      branchId,
      counsellorId: userId,
      ...(intake ? { intake: { name: intake } } : {}),
    },
    select: { target: true },
  });

  return rows.reduce((sum, row) => sum + row.target, 0);
}

export async function queryMasters(
  currentUserId: string,
): Promise<MastersResponse> {
 const currentUser = await db.user.findUnique({
  where: {
    id: currentUserId,
  },
  include: {
    branches: {
      where: {
        status: true,
      },
      include: {
        users: {
          include: {
            role: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    },
  },
});

if (!currentUser) {
  throw new Error("User not found");
}

const branches = currentUser.branches;

  const intakesRaw = await db.intake.findMany({
    where: { status: true },
    select: { id: true, name: true },
  });

  const intakes = sortIntakesByUpcoming(intakesRaw);
  const userMap = new Map<string, any>();

  branches.forEach((branch) => {
    branch.users.forEach((user) => {
      const existing = userMap.get(user.id);
      if (existing) {
        existing.branchIds.push(branch.id);
      } else {
        userMap.set(user.id, {
          id: user.id,
          name: user.name,
          branchIds: [branch.id],
          role: user.role?.name ?? "Counsellor",
          avatar: initials(user.name),
        });
      }
    });
  });

  const users = Array.from(userMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    branches: branches.map((branch) => ({ id: branch.id, name: branch.name })),
    users,
    intakes,
    defaultBranch: branches[0]?.id ?? "all",
    defaultUser: users[0]?.id ?? "all",
    defaultIntake: intakes[0]?.name ?? "all",
  };
}

async function getUserPerformance(
  branchId: string,
  user: any,
  filters: DashboardDataFilters,
  start: Date,
  end: Date,
): Promise<UserPerformance> {
  const intake = filters.intake;

  const [target, walkIns, applications, visaConversions] = await Promise.all([
    getTargetForUser(branchId, user.id, intake),
    db.lead.count({
      where: {
        branchId,
        ...andWhere([
          leadDateWhere(start, end),
          leadUserWhere(user.id),
          leadIntakeWhere(intake),
        ]),
      },
    }),
    db.student.count({
      where: {
        branchId,
        counselorId: user.id,
        ...studentIntakeWhere(intake),
        ...andWhere([studentDateWhere(start, end)]),
      },
    }),
    db.studentVisaProfile.count({
      where: {
        visaStatus: "APPROVED",
        student: {
          branchId,
          counselorId: user.id,
          ...studentIntakeWhere(intake),
        },
        ...andWhere([visaDateWhere(start, end)]),
      },
    }),
  ]);

  const progress =
    target > 0 ? parseFloat(((visaConversions / target) * 100).toFixed(1)) : 0;

  return {
    userId: user.id,
    userName: user.name,
    role: user.role?.name ?? "Counsellor",
    avatar: initials(user.name),
    target,
    walkIns,
    applications,
    visaConversions,
    progress,
  };
}

export async function queryDashboard(
  filters: DashboardDataFilters,
): Promise<DashboardResponse> {
  const { startDate, endDate, start, end } = getDateRangeBounds(
    filters.dateRangeType,
    filters.startDate,
    filters.endDate,
  );

  const branches = await db.branch.findMany({
    where: {
      status: true,
      ...(filters.branchId ? { id: filters.branchId } : {}),
    },
    include: {
      users: {
        where: filters.userId ? { id: filters.userId } : {},
        include: { role: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const branchPerformanceGroups: BranchPerformanceGroup[] = [];

  for (const branch of branches) {
    const userPerformances = await Promise.all(
      branch.users.map((user) =>
        getUserPerformance(branch.id, user, filters, start, end),
      ),
    );

    const branchTarget = userPerformances.reduce(
      (sum, user) => sum + user.target,
      0,
    );
    const branchWalkIns = userPerformances.reduce(
      (sum, user) => sum + user.walkIns,
      0,
    );
    const branchApplications = userPerformances.reduce(
      (sum, user) => sum + user.applications,
      0,
    );
    const branchVisaConversions = userPerformances.reduce(
      (sum, user) => sum + user.visaConversions,
      0,
    );
    const branchProgress =
      branchTarget > 0
        ? parseFloat(((branchVisaConversions / branchTarget) * 100).toFixed(1))
        : 0;

    if (userPerformances.length > 0) {
      branchPerformanceGroups.push({
        branchId: branch.id,
        branchName: branch.name,
        users: userPerformances,
        totals: {
          target: branchTarget,
          walkIns: branchWalkIns,
          applications: branchApplications,
          visaConversions: branchVisaConversions,
          progress: branchProgress,
        },
      });
    }
  }

  const grandTarget = branchPerformanceGroups.reduce(
    (sum, branch) => sum + branch.totals.target,
    0,
  );
  const grandWalkIns = branchPerformanceGroups.reduce(
    (sum, branch) => sum + branch.totals.walkIns,
    0,
  );
  const grandApplications = branchPerformanceGroups.reduce(
    (sum, branch) => sum + branch.totals.applications,
    0,
  );
  const grandVisaConversions = branchPerformanceGroups.reduce(
    (sum, branch) => sum + branch.totals.visaConversions,
    0,
  );
  const grandProgress =
    grandTarget > 0
      ? parseFloat(((grandVisaConversions / grandTarget) * 100).toFixed(1))
      : 0;

  return {
    filters: {
      branchId: filters.branchId,
      userId: filters.userId,
      intake: filters.intake,
      dateRangeType: filters.dateRangeType,
      startDate,
      endDate,
    },
    summary: {
      target: grandTarget,
      walkIns: grandWalkIns,
      applications: grandApplications,
      visaConversions: grandVisaConversions,
      progress: grandProgress,
    },
    branches: branchPerformanceGroups,
    grandTotal: {
      target: grandTarget,
      walkIns: grandWalkIns,
      applications: grandApplications,
      visaConversions: grandVisaConversions,
      progress: grandProgress,
    },
  };
}

export async function upsertTarget(
  branchId: string,
  userId: string,
  intake: string,
  targetValue: number,
  createdById?: string | null,
) {
  const [branch, user, intakeRecord] = await Promise.all([
    db.branch.findUnique({ where: { id: branchId }, select: { id: true } }),
    db.user.findUnique({ where: { id: userId }, select: { id: true } }),
    db.intake.findUnique({
      where: { name: intake },
      select: { id: true, name: true },
    }),
  ]);

  if (!branch) {
    throw new Error("Selected branch was not found");
  }

  if (!user) {
    throw new Error("Selected user was not found");
  }

  if (!intakeRecord) {
    throw new Error("Selected intake was not found");
  }

  return db.counsellorIntakeTarget.upsert({
    where: {
      counsellorId_intakeId_branchId: {
        counsellorId: userId,
        intakeId: intakeRecord.id,
        branchId,
      },
    },
    update: {
      target: targetValue,
    },
    create: {
      branchId,
      counsellorId: userId,
      intakeId: intakeRecord.id,
      target: targetValue,
      ...(createdById ? { createdById } : {}),
    },
  });
}
