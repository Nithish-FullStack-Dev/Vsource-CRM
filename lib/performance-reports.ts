import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import type {
  PerformanceApplicationExportRow,
  PerformanceReportBranchPoint,
  PerformanceReportCountryPoint,
  PerformanceReportCounselorPoint,
  PerformanceReportData,
  PerformanceReportFilters,
  PerformanceReportFilterOptions,
  PerformanceReportMonthlyPoint,
  PerformanceReportRow,
  PerformanceReportSourcePoint,
  PerformanceReportStatusPoint,
  ReportDatePreset,
  ReportRecordScope,
} from "@/types/performance-report";

const performanceLeadSelect = {
  id: true,
  leadNumber: true,
  studentName: true,
  mobileNumber: true,
  emailId: true,
  source: true,
  branchId: true,
  isConverted: true,
  convertedAt: true,
  preferredCountry: true,
  preferredIntake: true,
  preferredCourse: true,
  status: true,
  nextFollowup: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  counselors: {
    orderBy: [{ isPrimary: "desc" }, { assignedAt: "asc" }],
    select: {
      counselorId: true,
      isPrimary: true,
      counselor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  student: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.LeadSelect;

const performanceStudentSelect = {
  id: true,
  leadId: true,
  branchId: true,
  counselorId: true,
  studentName: true,
  mobileNumber: true,
  emailId: true,
  currentStage: true,
  status: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  counselor: {
    select: {
      id: true,
      name: true,
    },
  },
  lead: {
    select: {
      id: true,
      leadNumber: true,
      source: true,
      preferredCountry: true,
      preferredIntake: true,
      preferredCourse: true,
      status: true,
      convertedAt: true,
      nextFollowup: true,
      createdAt: true,
    },
  },
  visaProfile: {
    select: {
      depositStatus: true,
      ihsPaidStatus: true,
      visaPaidStatus: true,
      casStatus: true,
      visaStatus: true,
    },
  },
  loanProfile: {
    select: {
      fintechAssigneeId: true,
      nbfc: true,
      loanStatus: true,
      pfStatus: true,  
      disbursed: true,
      fintechAssignee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.StudentSelect;

const performanceApplicationSelect = {
  id: true,
  studentId: true,
  countryId: true,
  countryName: true,
  universityId: true,
  universityName: true,
  courseId: true,
  courseName: true,
  intakeId: true,
  intakeName: true,
  portal: true,
  applicationDate: true,
  status: true,
  offerStatus: true,
  createdAt: true,
  country: {
    select: {
      id: true,
      name: true,
    },
  },
  university: {
    select: {
      id: true,
      name: true,
    },
  },
  course: {
    select: {
      id: true,
      name: true,
    },
  },
  intake: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.StudentApplicationSelect;

type PerformanceLeadRecord = Prisma.LeadGetPayload<{
  select: typeof performanceLeadSelect;
}>;

type PerformanceStudentRecord = Prisma.StudentGetPayload<{
  select: typeof performanceStudentSelect;
}>;

type PerformanceApplicationRecord = Prisma.StudentApplicationGetPayload<{
  select: typeof performanceApplicationSelect;
}>;

type DateRange = {
  gte?: Date;
  lt?: Date;
};

type FilterLookup = {
  countryName: string;
  intakeName: string;
};

export type PerformanceReportAccessScope =
  | {
      kind: "all";
    }
  | {
      kind: "branches";
      branchIds: string[];
    }
  | {
      kind: "user";
      userId: string;
      userName: string;
    };

type BranchAccumulator = {
  branchId: string;
  branch: string;
  leads: number;
  lostLeads: number;
  students: number;
  droppedStudents: number;
  applications: number;
  visaApproved: number;
  
};

type CounselorAccumulator = {
  counselorId: string;
  counselor: string;
  branchActivity: Map<
    string,
    {
      branchId: string;
      branch: string;
      records: number;
    }
  >;
  leads: number;
  qualifiedLeads: number;
  lostLeads: number;
  students: number;
  droppedStudents: number;
  applications: number;
  offers: number;
  casReceived: number;
  visaApproved: number;
  loanSanctioned: number;
  
};

type CounselorDetails = {
  name: string;
  branches: Array<{
    id: string;
    name: string;
  }>;
};

type TargetMetrics = {
  totalTarget: number;
  totalAchieved: number;
  totalLeadsCreated: number;
  targetMonths: number;
  branchTargets: ReadonlyMap<string, number>;
  branchAchievements: ReadonlyMap<string, number>;
  branchLeadsCreated: ReadonlyMap<string, number>;
  counselorTargets: ReadonlyMap<string, number>;
  counselorAchievements: ReadonlyMap<string, number>;
  counselorLeadsCreated: ReadonlyMap<string, number>;
  counselorDetails: ReadonlyMap<string, CounselorDetails>;
};

const STUDY_ABROAD_LEAD_TYPE = "study_abroad";
const CONVERTED_LEAD_STATUS = "converted";
const COUNSELLOR_ROLE_NAMES = ["Counsellor", "Counselor"];
const LOST_LEAD_STATUSES = new Set(["lost", "closed_lost", "lead_lost"]);
const DROPPED_STUDENT_STATUSES = new Set([
  "drop",
  "dropped",
  "student_dropped",
]);

const FULL_PERFORMANCE_ACCESS: PerformanceReportAccessScope = {
  kind: "all",
};

function buildLeadAccessWhere(
  accessScope: PerformanceReportAccessScope,
): Prisma.LeadWhereInput | null {
  if (accessScope.kind === "branches") {
    return {
      branchId: {
        in: accessScope.branchIds,
      },
    };
  }

  if (accessScope.kind === "user") {
    return {
      OR: [
        {
          createdById: accessScope.userId,
        },
        {
          counselors: {
            some: {
              counselorId: accessScope.userId,
            },
          },
        },
      ],
    };
  }

  return null;
}

function buildStudentAccessWhere(
  accessScope: PerformanceReportAccessScope,
): Prisma.StudentWhereInput | null {
  if (accessScope.kind === "branches") {
    return {
      branchId: {
        in: accessScope.branchIds,
      },
    };
  }

  if (accessScope.kind === "user") {
    return {
      OR: [
        {
          counselorId: accessScope.userId,
        },
        {
          lead: {
            is: {
              OR: [
                {
                  createdById: accessScope.userId,
                },
                {
                  counselors: {
                    some: {
                      counselorId: accessScope.userId,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    };
  }

  return null;
}

function clean(value: string | null): string {
  return value?.trim() ?? "";
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function getIndiaCalendarDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;

  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
}

function parseDateOnly(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateRange(
  preset: ReportDatePreset,
  customStartDate: string,
  customEndDate: string,
  now = new Date(),
): DateRange | null {
  const today = getIndiaCalendarDate(now);

  switch (preset) {
    case "today":
      return {
        gte: today,
        lt: addDays(today, 1),
      };

    case "yesterday": {
      const yesterday = addDays(today, -1);

      return {
        gte: yesterday,
        lt: today,
      };
    }

    case "last_7_days":
      return {
        gte: addDays(today, -6),
        lt: addDays(today, 1),
      };

    case "last_30_days":
      return {
        gte: addDays(today, -29),
        lt: addDays(today, 1),
      };

    case "this_month":
      return {
        gte: startOfMonth(today),
        lt: addDays(today, 1),
      };

    case "last_month": {
      const thisMonth = startOfMonth(today);
      const lastMonth = new Date(
        Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - 1, 1),
      );

      return {
        gte: lastMonth,
        lt: thisMonth,
      };
    }

    case "this_quarter":
      return {
        gte: startOfQuarter(today),
        lt: addDays(today, 1),
      };

    case "last_quarter": {
      const thisQuarter = startOfQuarter(today);
      const lastQuarter = new Date(
        Date.UTC(
          thisQuarter.getUTCFullYear(),
          thisQuarter.getUTCMonth() - 3,
          1,
        ),
      );

      return {
        gte: lastQuarter,
        lt: thisQuarter,
      };
    }

    case "this_year":
      return {
        gte: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)),
        lt: addDays(today, 1),
      };

    case "custom": {
      const start = parseDateOnly(customStartDate);
      const end = parseDateOnly(customEndDate);

      if (!start && !end) {
        return null;
      }

      return {
        ...(start && { gte: start }),
        ...(end && { lt: addDays(end, 1) }),
      };
    }

    default:
      return null;
  }
}

function addMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

function getTargetMonthRange(
  dateRange: DateRange | null,
): Prisma.DateTimeFilter | undefined {
  if (!dateRange) {
    return undefined;
  }

  return {
    ...(dateRange.gte && { gte: startOfMonth(dateRange.gte) }),
    ...(dateRange.lt && {
      lt: addMonths(startOfMonth(addDays(dateRange.lt, -1)), 1),
    }),
  };
}

async function getTargetMetrics(
  filters: PerformanceReportFilters,
  accessScope: PerformanceReportAccessScope,
): Promise<TargetMetrics> {
  const dateRange = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  

  const counselorConditions: Prisma.UserWhereInput[] = [
    {
      role: {
        is: {
          name: {
            in: COUNSELLOR_ROLE_NAMES,
            mode: "insensitive",
          },
        },
      },
    },
  ];

  const achievementConditions: Prisma.StudentWhereInput[] = [];
  const createdLeadConditions: Prisma.LeadWhereInput[] = [];

  if (filters.counselorId && accessScope.kind !== "user") {
    counselorConditions.push({ id: filters.counselorId });
    achievementConditions.push({ counselorId: filters.counselorId });
    createdLeadConditions.push({ createdById: filters.counselorId });
  }

  if (filters.branchId) {
    counselorConditions.push({
      branches: {
        some: {
          id: filters.branchId,
        },
      },
    });
    achievementConditions.push({ branchId: filters.branchId });
    createdLeadConditions.push({ branchId: filters.branchId });
  }

  if (accessScope.kind === "branches") {
    counselorConditions.push({
      branches: {
        some: {
          id: {
            in: accessScope.branchIds,
          },
        },
      },
    });
    achievementConditions.push({
      branchId: {
        in: accessScope.branchIds,
      },
    });
    createdLeadConditions.push({
      branchId: {
        in: accessScope.branchIds,
      },
    });
  } else if (accessScope.kind === "user") {
    counselorConditions.push({ id: accessScope.userId });

    const studentAccessWhere = buildStudentAccessWhere(accessScope);

    if (studentAccessWhere) {
      achievementConditions.push(studentAccessWhere);
    }

    // "Leads Added" remains creator-based. Assigned leads are still included
    // in All Leads / Students / Applications through the report access scope.
    createdLeadConditions.push({ createdById: accessScope.userId });
  }

  const [targets, achievements, createdLeads] = await Promise.all([
   db.counsellorIntakeTarget.findMany({
  where: {
    counsellor: {
      AND: counselorConditions,
    },
  },
  select: {
    target: true,
    counsellor: {
      select: {
        id: true,
        name: true,
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
    },
  },
}),
    db.student.groupBy({
      by: ["branchId", "counselorId"],
      where: {
        ...(dateRange && { createdAt: dateRange }),
        ...(achievementConditions.length > 0 && {
          AND: achievementConditions,
        }),
      },
      _count: {
        _all: true,
      },
    }),
    db.lead.groupBy({
      by: ["branchId", "createdById"],
      where: {
        leadType: STUDY_ABROAD_LEAD_TYPE as Prisma.LeadWhereInput["leadType"],
        ...(dateRange && { createdAt: dateRange }),
        ...(createdLeadConditions.length > 0 && {
          AND: createdLeadConditions,
        }),
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const branchTargets = new Map<string, number>();
  const branchAchievements = new Map<string, number>();
  const branchLeadsCreated = new Map<string, number>();
  const counselorTargets = new Map<string, number>();
  const counselorAchievements = new Map<string, number>();
  const counselorLeadsCreated = new Map<string, number>();
  const counselorDetails = new Map<string, CounselorDetails>();
  const allowedBranchIds =
    accessScope.kind === "branches" ? new Set(accessScope.branchIds) : null;
  let totalTarget = 0;

  for (const item of targets) {
    const counselorId = item.counsellor.id;
    const visibleBranches = item.counsellor.branches.filter((branch) => {
      if (filters.branchId && branch.id !== filters.branchId) {
        return false;
      }

      if (allowedBranchIds && !allowedBranchIds.has(branch.id)) {
        return false;
      }

      return true;
    });

    totalTarget += item.target;
   
    counselorTargets.set(
      counselorId,
      (counselorTargets.get(counselorId) ?? 0) + item.target,
    );
    counselorDetails.set(counselorId, {
      name: item.counsellor.name,
      branches: visibleBranches,
    });

    for (const branch of visibleBranches) {
      branchTargets.set(
        branch.id,
        (branchTargets.get(branch.id) ?? 0) + item.target,
      );
    }
  }

  for (const item of achievements) {
    branchAchievements.set(
      item.branchId,
      (branchAchievements.get(item.branchId) ?? 0) + item._count._all,
    );

    const performanceCounselorId =
      accessScope.kind === "user" ? accessScope.userId : item.counselorId;

    if (performanceCounselorId) {
      counselorAchievements.set(
        performanceCounselorId,
        (counselorAchievements.get(performanceCounselorId) ?? 0) +
          item._count._all,
      );
    }
  }

  for (const item of createdLeads) {
    branchLeadsCreated.set(
      item.branchId,
      (branchLeadsCreated.get(item.branchId) ?? 0) + item._count._all,
    );

    if (item.createdById) {
      counselorLeadsCreated.set(
        item.createdById,
        (counselorLeadsCreated.get(item.createdById) ?? 0) + item._count._all,
      );
    }
  }

  return {
    totalTarget,
    totalAchieved: achievements.reduce(
      (total, item) => total + item._count._all,
      0,
    ),
    totalLeadsCreated: createdLeads.reduce(
      (total, item) => total + item._count._all,
      0,
    ),
    targetMonths: 0,
    branchTargets,
    branchAchievements,
    branchLeadsCreated,
    counselorTargets,
    counselorAchievements,
    counselorLeadsCreated,
    counselorDetails,
  };
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeStatus(value: string | null | undefined): string {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_") ?? ""
  );
}

function isLostLead(value: string | null | undefined): boolean {
  return LOST_LEAD_STATUSES.has(normalizeStatus(value));
}

function isDroppedStudent(value: string | null | undefined): boolean {
  return DROPPED_STUDENT_STATUSES.has(normalizeStatus(value));
}

function humanizeStatus(value: string): string {
  if (!value) {
    return "Not Set";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isOfferStatus(value: string): boolean {
  const normalized = normalizeStatus(value);

  if (!normalized) {
    return false;
  }

  return ![
    "none",
    "not_received",
    "pending",
    "rejected",
    "not_applicable",
  ].includes(normalized);
}

function isVisaApproved(value: string): boolean {
  const normalized = normalizeStatus(value);

  return ["approved", "visa_approved", "granted"].includes(normalized);
}

function isCasReceived(value: string): boolean {
  const normalized = normalizeStatus(value);

  return ["received", "cas_received", "issued"].includes(normalized);
}

function isLoanSanctioned(value: string): boolean {
  const normalized = normalizeStatus(value);

  return [
    "sanctioned",
    "approved",
    "disbursed",
    "partially_disbursed",
    "fully_disbursed",
  ].includes(normalized);
}

function getPrimaryLeadCounselor(lead: PerformanceLeadRecord) {
  return (
    lead.counselors.find((assignment) => assignment.isPrimary) ??
    lead.counselors[0] ??
    null
  );
}

function getApplicationCountry(application: PerformanceApplicationRecord) {
  return application.countryName ?? application.country?.name ?? "Not Set";
}

function getApplicationUniversity(application: PerformanceApplicationRecord) {
  return (
    application.universityName ?? application.university?.name ?? "Not Set"
  );
}

function getApplicationCourse(application: PerformanceApplicationRecord) {
  return application.courseName ?? application.course?.name ?? "Not Set";
}

function getApplicationIntake(application: PerformanceApplicationRecord) {
  return application.intakeName ?? application.intake?.name ?? "Not Set";
}

function sortApplicationsByDate(
  applications: PerformanceApplicationRecord[],
): PerformanceApplicationRecord[] {
  return [...applications].sort((a, b) => {
    const aDate = (a.applicationDate ?? a.createdAt).getTime();
    const bDate = (b.applicationDate ?? b.createdAt).getTime();

    return bDate - aDate;
  });
}

function groupApplicationsByStudent(
  applications: PerformanceApplicationRecord[],
): Map<string, PerformanceApplicationRecord[]> {
  const map = new Map<string, PerformanceApplicationRecord[]>();

  for (const application of applications) {
    const current = map.get(application.studentId) ?? [];
    current.push(application);
    map.set(application.studentId, current);
  }

  for (const [studentId, studentApplications] of map.entries()) {
    map.set(studentId, sortApplicationsByDate(studentApplications));
  }

  return map;
}

type PerformanceCounselorOverride = {
  id: string;
  name: string;
};

function getPerformanceCounselorOverride(
  accessScope: PerformanceReportAccessScope,
): PerformanceCounselorOverride | null {
  if (accessScope.kind !== "user") {
    return null;
  }

  return {
    id: accessScope.userId,
    name: accessScope.userName,
  };
}

function mapLeadToRow(
  lead: PerformanceLeadRecord,
  counselorOverride: PerformanceCounselorOverride | null,
): PerformanceReportRow {
  const counselorAssignment = getPrimaryLeadCounselor(lead);
  const counselorId =
    counselorOverride?.id ?? counselorAssignment?.counselorId ?? null;
  const counselorName =
    counselorOverride?.name ??
    counselorAssignment?.counselor?.name ??
    "Not Assigned";

  return {
    recordType: "lead",
    recordId: lead.id,
    leadId: lead.id,
    leadNumber: lead.leadNumber,
    studentId: null,
    studentName: lead.studentName ?? "Not Set",
    emailId: lead.emailId ?? "",
    mobileNumber: lead.mobileNumber ?? "",
    branchId: lead.branchId,
    branchName: lead.branch?.name ?? "Not Assigned",
    counselorId,
    counselorName,
    source: lead.source ?? "Not Set",
    countryName: lead.preferredCountry ?? "Not Set",
    intakeName: lead.preferredIntake ?? "Not Set",
    courseName: lead.preferredCourse ?? "Not Set",
    lifecycleStatus: String(lead.status ?? ""),
    currentStage: "lead",
    createdAt: lead.createdAt.toISOString(),
    convertedAt: lead.convertedAt?.toISOString() ?? null,
    nextFollowup: lead.nextFollowup?.toISOString() ?? null,
    applicationsCount: 0,
    latestApplicationId: null,
    latestUniversityName: "Not Applied",
    latestApplicationDate: null,
    latestApplicationStatus: "",
    latestOfferStatus: "",
    casStatus: "",
    visaStatus: "",
    loanStatus: "",
    nbfc: "",
    fintechAssigneeName: "Not Assigned",
  };
}

function mapStudentToRow(
  student: PerformanceStudentRecord,
  studentApplications: PerformanceApplicationRecord[],
  counselorOverride: PerformanceCounselorOverride | null,
): PerformanceReportRow {
  const latestApplication = studentApplications[0] ?? null;
  const visaProfile = student.visaProfile;
  const loanProfile = student.loanProfile;
  const counselorId = counselorOverride?.id ?? student.counselorId;
  const counselorName =
    counselorOverride?.name ?? student.counselor?.name ?? "Not Assigned";

  return {
    recordType: "student",
    recordId: student.id,
    leadId: student.leadId,
    leadNumber: student.lead.leadNumber,
    studentId: student.id,
    studentName: student.studentName,
    emailId: student.emailId,
    mobileNumber: student.mobileNumber,
    branchId: student.branchId,
    branchName: student.branch?.name ?? "Not Assigned",
    counselorId,
    counselorName,
    source: student.lead.source ?? "Not Set",
    countryName: latestApplication
      ? getApplicationCountry(latestApplication)
      : (student.lead.preferredCountry ?? "Not Set"),
    intakeName: latestApplication
      ? getApplicationIntake(latestApplication)
      : (student.lead.preferredIntake ?? "Not Set"),
    courseName: latestApplication
      ? getApplicationCourse(latestApplication)
      : (student.lead.preferredCourse ?? "Not Set"),
    lifecycleStatus: String(student.status ?? ""),
    currentStage: String(student.currentStage ?? ""),
    createdAt: student.createdAt.toISOString(),
    convertedAt:
      student.lead.convertedAt?.toISOString() ??
      student.createdAt.toISOString(),
    nextFollowup: student.lead.nextFollowup?.toISOString() ?? null,
    applicationsCount: studentApplications.length,
    latestApplicationId: latestApplication?.id ?? null,
    latestUniversityName: latestApplication
      ? getApplicationUniversity(latestApplication)
      : "Not Applied",
    latestApplicationDate:
      latestApplication?.applicationDate?.toISOString() ?? null,
    latestApplicationStatus: latestApplication
      ? String(latestApplication.status ?? "")
      : "",
    latestOfferStatus: latestApplication
      ? String(latestApplication.offerStatus ?? "")
      : "",
    casStatus: visaProfile?.casStatus ?? "",
    visaStatus: visaProfile?.visaStatus ?? "",
    loanStatus: loanProfile?.loanStatus ?? "",
    nbfc: loanProfile?.nbfc ?? "",
    fintechAssigneeName: loanProfile?.fintechAssignee?.name ?? "Not Assigned",
  };
}

function mapApplicationToExportRow(
  application: PerformanceApplicationRecord,
  student: PerformanceStudentRecord,
  counselorOverride: PerformanceCounselorOverride | null,
): PerformanceApplicationExportRow {
  const visaProfile = student.visaProfile;
  const loanProfile = student.loanProfile;
  const counselorName =
    counselorOverride?.name ?? student.counselor?.name ?? "Not Assigned";

  return {
    applicationId: application.id,
    studentId: student.id,
    leadNumber: student.lead.leadNumber,
    studentName: student.studentName,
    emailId: student.emailId,
    mobileNumber: student.mobileNumber,
    branchName: student.branch?.name ?? "Not Assigned",
    counselorName,
    source: student.lead.source ?? "Not Set",
    countryName: getApplicationCountry(application),
    universityName: getApplicationUniversity(application),
    courseName: getApplicationCourse(application),
    intakeName: getApplicationIntake(application),
    portal: application.portal ?? "",
    applicationDate: application.applicationDate?.toISOString() ?? null,
    applicationStatus: String(application.status ?? ""),
    offerStatus: String(application.offerStatus ?? ""),
    depositStatus: visaProfile?.depositStatus ?? "",
    ihsPaidStatus: visaProfile?.ihsPaidStatus ?? "",
    visaPaidStatus: visaProfile?.visaPaidStatus ?? "",
    casStatus: visaProfile?.casStatus ?? "",
    visaStatus: visaProfile?.visaStatus ?? "",
    fintechAssigneeName: loanProfile?.fintechAssignee?.name ?? "Not Assigned",
    nbfc: loanProfile?.nbfc ?? "",
    loanStatus: loanProfile?.loanStatus ?? "",
    pfStatus: loanProfile?.pfStatus ?? "",
    
    
    disbursed: loanProfile?.disbursed ?? false,
    
  };
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    month: "short",
    year: "2-digit",
  });
}

function buildMonthlyVolume(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applications: PerformanceApplicationRecord[],
): PerformanceReportMonthlyPoint[] {
  const map = new Map<string, PerformanceReportMonthlyPoint>();

  const ensurePoint = (date: Date) => {
    const key = monthKey(date);
    const current = map.get(key) ?? {
      key,
      label: monthLabel(date),
      leads: 0,
      students: 0,
      applications: 0,
    };

    map.set(key, current);
    return current;
  };

  for (const lead of leads) {
    ensurePoint(lead.createdAt).leads += 1;
  }

  for (const student of students) {
    const conversionDate = student.lead.convertedAt ?? student.createdAt;
    ensurePoint(conversionDate).students += 1;
  }

  for (const application of applications) {
    const applicationDate =
      application.applicationDate ?? application.createdAt;
    ensurePoint(applicationDate).applications += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);
}

function buildCountryDemand(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applicationsByStudent: Map<string, PerformanceApplicationRecord[]>,
): PerformanceReportCountryPoint[] {
  const map = new Map<
    string,
    {
      leads: number;
      studentIds: Set<string>;
      applications: number;
    }
  >();

  const ensureCountry = (country: string) => {
    const key = country || "Not Set";
    const current = map.get(key) ?? {
      leads: 0,
      studentIds: new Set<string>(),
      applications: 0,
    };

    map.set(key, current);
    return current;
  };

  for (const lead of leads) {
    ensureCountry(lead.preferredCountry ?? "Not Set").leads += 1;
  }

  for (const student of students) {
    const studentApplications = applicationsByStudent.get(student.id) ?? [];

    if (studentApplications.length === 0) {
      ensureCountry(student.lead.preferredCountry ?? "Not Set").studentIds.add(
        student.id,
      );
      continue;
    }

    for (const application of studentApplications) {
      const current = ensureCountry(getApplicationCountry(application));
      current.studentIds.add(student.id);
      current.applications += 1;
    }
  }

  return Array.from(map.entries())
    .map(([country, value]) => ({
      country,
      leads: value.leads,
      students: value.studentIds.size,
      applications: value.applications,
    }))
    .sort(
      (a, b) =>
        b.leads +
        b.students +
        b.applications -
        (a.leads + a.students + a.applications),
    );
}

function buildLeadStatusBreakdown(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
): PerformanceReportStatusPoint[] {
  const map = new Map<string, number>();

  for (const lead of leads) {
    const status = humanizeStatus(String(lead.status ?? ""));
    map.set(status, (map.get(status) ?? 0) + 1);
  }

  if (students.length > 0) {
    map.set("Converted", (map.get("Converted") ?? 0) + students.length);
  }

  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function buildLeadSourceBreakdown(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
): PerformanceReportSourcePoint[] {
  const map = new Map<
    string,
    {
      leads: number;
      students: number;
    }
  >();

  const ensureSource = (source: string) => {
    const key = source || "Not Set";
    const current = map.get(key) ?? {
      leads: 0,
      students: 0,
    };

    map.set(key, current);
    return current;
  };

  for (const lead of leads) {
    ensureSource(lead.source ?? "Not Set").leads += 1;
  }

  for (const student of students) {
    ensureSource(student.lead.source ?? "Not Set").students += 1;
  }

  return Array.from(map.entries())
    .map(([source, value]) => ({
      source,
      leads: value.leads,
      students: value.students,
      total: value.leads + value.students,
    }))
    .sort((a, b) => b.total - a.total);
}

function buildStatusBreakdown(
  values: string[],
): PerformanceReportStatusPoint[] {
  const map = new Map<string, number>();

  for (const value of values) {
    const status = humanizeStatus(value);
    map.set(status, (map.get(status) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function buildBranchPerformance(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applications: PerformanceApplicationRecord[],
  targetMetrics: TargetMetrics,
): PerformanceReportBranchPoint[] {
  const map = new Map<string, BranchAccumulator>();
  const studentMap = new Map(students.map((student) => [student.id, student]));

  const ensureBranch = (branchId: string, branch: string) => {
    const current = map.get(branchId) ?? {
      branchId,
      branch,
      leads: 0,
      lostLeads: 0,
      students: 0,
      droppedStudents: 0,
      applications: 0,
      visaApproved: 0,
    };

    map.set(branchId, current);
    return current;
  };

  for (const lead of leads) {
    const current = ensureBranch(
      lead.branchId,
      lead.branch?.name ?? "Not Assigned",
    );

    current.leads += 1;

    if (isLostLead(String(lead.status ?? ""))) {
      current.lostLeads += 1;
    }
  }

  for (const student of students) {
    const current = ensureBranch(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    );

    current.students += 1;

    if (isDroppedStudent(String(student.status ?? ""))) {
      current.droppedStudents += 1;
    }

    if (isVisaApproved(student.visaProfile?.visaStatus ?? "")) {
      current.visaApproved += 1;
    }

   
  }

  for (const application of applications) {
    const student = studentMap.get(application.studentId);

    if (!student) {
      continue;
    }

    ensureBranch(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    ).applications += 1;
  }

  return Array.from(map.values())
    .map((value) => {
      const pipelineRecords = value.leads + value.students;
      const leadsCreated =
        targetMetrics.branchLeadsCreated.get(value.branchId) ?? 0;
      const target = targetMetrics.branchTargets.get(value.branchId) ?? 0;
      const achieved =
        targetMetrics.branchAchievements.get(value.branchId) ?? 0;

      return {
        branchId: value.branchId,
        branch: value.branch,
        leads: value.leads,
        lostLeads: value.lostLeads,
        students: value.students,
        droppedStudents: value.droppedStudents,
        leadsCreated,
        target,
        achieved,
        targetCompletionPercentage:
          target > 0 ? Number(((achieved / target) * 100).toFixed(1)) : 0,
        applications: value.applications,
        conversionRate:
          pipelineRecords === 0
            ? 0
            : Number(((value.students / pipelineRecords) * 100).toFixed(1)),
        visaApproved: value.visaApproved,
      };
    })
    .sort(
      (a, b) =>
        b.leads +
        b.students +
        b.applications -
        (a.leads + a.students + a.applications),
    );
}

function buildCounselorPerformance(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applications: PerformanceApplicationRecord[],
  targetMetrics: TargetMetrics,
  selectedBranchId: string,
  accessScope: PerformanceReportAccessScope,
): PerformanceReportCounselorPoint[] {
  const map = new Map<string, CounselorAccumulator>();
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const counselorOverride = getPerformanceCounselorOverride(accessScope);

  const ensureCounselor = (
    counselorId: string,
    counselor: string,
    branchId?: string,
    branch?: string,
  ) => {
    const current = map.get(counselorId) ?? {
      counselorId,
      counselor,
      branchActivity: new Map(),
      leads: 0,
      qualifiedLeads: 0,
      lostLeads: 0,
      students: 0,
      droppedStudents: 0,
      applications: 0,
      offers: 0,
      casReceived: 0,
      visaApproved: 0,
      loanSanctioned: 0,
    };

    if (branchId) {
      const activity = current.branchActivity.get(branchId) ?? {
        branchId,
        branch: branch || "Not Assigned",
        records: 0,
      };

      activity.records += 1;
      current.branchActivity.set(branchId, activity);
    }

    map.set(counselorId, current);
    return current;
  };

  for (const lead of leads) {
    const assignment = getPrimaryLeadCounselor(lead);
    const counselorId =
      counselorOverride?.id ?? assignment?.counselorId ?? "unassigned";
    const counselor =
      counselorOverride?.name ?? assignment?.counselor?.name ?? "Unassigned";
    const current = ensureCounselor(
      counselorId,
      counselor,
      lead.branchId,
      lead.branch?.name ?? "Not Assigned",
    );

    current.leads += 1;

    if (normalizeStatus(String(lead.status ?? "")) === "qualified") {
      current.qualifiedLeads += 1;
    }

    if (isLostLead(String(lead.status ?? ""))) {
      current.lostLeads += 1;
    }
  }

  for (const student of students) {
    const counselorId =
      counselorOverride?.id ?? student.counselorId ?? "unassigned";
    const counselor =
      counselorOverride?.name ?? student.counselor?.name ?? "Unassigned";
    const current = ensureCounselor(
      counselorId,
      counselor,
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    );

    current.students += 1;

    if (isDroppedStudent(String(student.status ?? ""))) {
      current.droppedStudents += 1;
    }

    if (isCasReceived(student.visaProfile?.casStatus ?? "")) {
      current.casReceived += 1;
    }

    if (isVisaApproved(student.visaProfile?.visaStatus ?? "")) {
      current.visaApproved += 1;
    }

    if (isLoanSanctioned(student.loanProfile?.loanStatus ?? "")) {
      current.loanSanctioned += 1;
    }
  }

  for (const application of applications) {
    const student = studentMap.get(application.studentId);

    if (!student) {
      continue;
    }

    const counselorId =
      counselorOverride?.id ?? student.counselorId ?? "unassigned";
    const counselor =
      counselorOverride?.name ?? student.counselor?.name ?? "Unassigned";
    const current = ensureCounselor(counselorId, counselor);

    current.applications += 1;

    if (isOfferStatus(String(application.offerStatus ?? ""))) {
      current.offers += 1;
    }
  }

  for (const [counselorId, details] of targetMetrics.counselorDetails) {
    const current = ensureCounselor(counselorId, details.name);

    for (const branch of details.branches) {
      if (selectedBranchId && branch.id !== selectedBranchId) {
        continue;
      }

      if (!current.branchActivity.has(branch.id)) {
        current.branchActivity.set(branch.id, {
          branchId: branch.id,
          branch: branch.name,
          records: 0,
        });
      }
    }
  }

  return Array.from(map.values())
    .map((value) => {
      const details = targetMetrics.counselorDetails.get(value.counselorId);
      const activityBranches = Array.from(value.branchActivity.values()).sort(
        (a, b) => b.records - a.records || a.branch.localeCompare(b.branch),
      );
      const selectedBranch = selectedBranchId
        ? activityBranches.find(
            (branch) => branch.branchId === selectedBranchId,
          )
        : undefined;
      const reportingBranch = selectedBranch ??
        activityBranches[0] ??
        details?.branches[0] ?? {
          id: "unassigned",
          name: "Not Assigned",
        };
      const branchId =
        "branchId" in reportingBranch
          ? reportingBranch.branchId
          : (reportingBranch ?? "Not Assigned");
      const branch =
        "branch" in reportingBranch
          ? reportingBranch.branch
          : (reportingBranch ?? "Not Assigned");
      const totalWalkins = value.leads + value.students;
      const target = targetMetrics.counselorTargets.get(value.counselorId) ?? 0;
      const achieved =
        targetMetrics.counselorAchievements.get(value.counselorId) ?? 0;

      return {
        branchId,
        branch,
        counselorId: value.counselorId,
        counselor: value.counselor,
        totalWalkins,
        leadsCreated:
          targetMetrics.counselorLeadsCreated.get(value.counselorId) ?? 0,
        leads: value.leads,
        qualifiedLeads: value.qualifiedLeads,
        lostLeads: value.lostLeads,
        students: value.students,
        droppedStudents: value.droppedStudents,
        target,
        achieved,
        targetCompletionPercentage:
          target > 0 ? Number(((achieved / target) * 100).toFixed(1)) : 0,
        applications: value.applications,
        offers: value.offers,
        conversionRate:
          totalWalkins > 0
            ? Number(((value.students / totalWalkins) * 100).toFixed(1))
            : 0,
        casReceived: value.casReceived,
        visaApproved: value.visaApproved,
        loanSanctioned: value.loanSanctioned,
      };
    })
    .sort(
      (a, b) =>
        a.branch.localeCompare(b.branch) ||
        a.branchId.localeCompare(b.branchId) ||
        a.counselor.localeCompare(b.counselor),
    );
}

function buildSummary(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applications: PerformanceApplicationRecord[],
  targetMetrics: TargetMetrics,
) {
  const totalPipelineRecords = leads.length + students.length;

  return {
    totalPipelineRecords,
    totalLeads: leads.length,
    totalStudents: students.length,
    totalApplications: applications.length,
    qualifiedLeads: leads.filter(
      (lead) => normalizeStatus(String(lead.status)) === "qualified",
    ).length,
    lostLeads: leads.filter((lead) => isLostLead(String(lead.status))).length,
    droppedStudents: students.filter((student) =>
      isDroppedStudent(String(student.status)),
    ).length,
    totalTarget: targetMetrics.totalTarget,
    totalAchieved: targetMetrics.totalAchieved,
    totalLeadsCreated: targetMetrics.totalLeadsCreated,
    targetMonths: targetMetrics.targetMonths,
    targetCompletionPercentage:
      targetMetrics.totalTarget > 0
        ? Number(
            (
              (targetMetrics.totalAchieved / targetMetrics.totalTarget) *
              100
            ).toFixed(1),
          )
        : 0,
    conversionRate:
      totalPipelineRecords === 0
        ? 0
        : Number(((students.length / totalPipelineRecords) * 100).toFixed(1)),
    offerApplications: applications.filter((application) =>
      isOfferStatus(String(application.offerStatus ?? "")),
    ).length,
    visaApprovedStudents: students.filter((student) =>
      isVisaApproved(student.visaProfile?.visaStatus ?? ""),
    ).length,
    casReceivedStudents: students.filter((student) =>
      isCasReceived(student.visaProfile?.casStatus ?? ""),
    ).length,
    loanSanctionedStudents: students.filter((student) =>
      isLoanSanctioned(student.loanProfile?.loanStatus ?? ""),
    ).length,
  
  };
}

function hasApplicationFilters(filters: PerformanceReportFilters): boolean {
  return Boolean(
    filters.countryId ||
    filters.intakeId ||
    filters.universityId ||
    filters.applicationStatus,
  );
}

function hasStudentOnlyApplicationFilters(
  filters: PerformanceReportFilters,
): boolean {
  return Boolean(filters.universityId || filters.applicationStatus);
}

function hasComplianceFilters(filters: PerformanceReportFilters): boolean {
  return Boolean(
    filters.casStatus ||
    filters.visaStatus ||
    filters.loanStatus ||
    filters.nbfc ||
    filters.fintechAssigneeId,
  );
}

function shouldIncludeLeads(filters: PerformanceReportFilters): boolean {
  if (filters.recordScope === "students") {
    return false;
  }

  if (filters.leadStatus === CONVERTED_LEAD_STATUS) {
    return false;
  }

  if (
    hasStudentOnlyApplicationFilters(filters) ||
    hasComplianceFilters(filters)
  ) {
    return false;
  }

  return true;
}

function shouldIncludeStudents(filters: PerformanceReportFilters): boolean {
  if (filters.recordScope === "leads") {
    return false;
  }

  if (filters.leadStatus && filters.leadStatus !== CONVERTED_LEAD_STATUS) {
    return false;
  }

  return true;
}

function buildLeadWhere(
  filters: PerformanceReportFilters,
  lookup: FilterLookup,
  accessScope: PerformanceReportAccessScope,
): Prisma.LeadWhereInput {
  const andConditions: Prisma.LeadWhereInput[] = [];
  const where: Prisma.LeadWhereInput = {
    leadType: STUDY_ABROAD_LEAD_TYPE as Prisma.LeadWhereInput["leadType"],
    isConverted: false,
    student: {
      is: null,
    },
  };

  if (filters.search) {
    where.OR = [
      {
        leadNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        studentName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        emailId: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        mobileNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        preferredCountry: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        preferredCourse: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  if (filters.counselorId && accessScope.kind !== "user") {
    where.counselors = {
      some: {
        counselorId: filters.counselorId,
      },
    };
  }

  if (filters.leadStatus) {
    where.status = filters.leadStatus as Prisma.LeadWhereInput["status"];
  }

  if (filters.leadSource) {
    where.source = {
      equals: filters.leadSource,
      mode: "insensitive",
    };
  }

  if (lookup.countryName) {
    where.preferredCountry = {
      contains: lookup.countryName,
      mode: "insensitive",
    };
  }

  if (lookup.intakeName) {
    where.preferredIntake = {
      contains: lookup.intakeName,
      mode: "insensitive",
    };
  }

  const dateRange = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );

  if (dateRange) {
    where.createdAt = dateRange;
  }

  const accessWhere = buildLeadAccessWhere(accessScope);

  if (accessWhere) {
    andConditions.push(accessWhere);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

function buildApplicationWhere(
  filters: PerformanceReportFilters,
): Prisma.StudentApplicationWhereInput {
  const where: Prisma.StudentApplicationWhereInput = {};

  if (filters.countryId) {
    where.countryId = filters.countryId;
  }

  if (filters.intakeId) {
    where.intakeId = filters.intakeId;
  }

  if (filters.universityId) {
    where.universityId = filters.universityId;
  }

  if (filters.applicationStatus) {
    where.status =
      filters.applicationStatus as Prisma.StudentApplicationWhereInput["status"];
  }

  return where;
}

function buildStudentWhere(
  filters: PerformanceReportFilters,
  accessScope: PerformanceReportAccessScope,
): Prisma.StudentWhereInput {
  const andConditions: Prisma.StudentWhereInput[] = [];
  const where: Prisma.StudentWhereInput = {};
  const leadWhere: Prisma.LeadWhereInput = {};
  const loanProfileWhere: Prisma.StudentLoanProfileWhereInput = {};
  const visaLoanWhere: Prisma.StudentVisaProfileWhereInput = {};
  const applicationWhere = buildApplicationWhere(filters);

  if (filters.search) {
    where.OR = [
      {
        studentName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        emailId: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        mobileNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        lead: {
          is: {
            leadNumber: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        lead: {
          is: {
            preferredCountry: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        applications: {
          some: {
            OR: [
              {
                universityName: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                courseName: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ];
  }

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  if (filters.counselorId && accessScope.kind !== "user") {
    where.counselorId = filters.counselorId;
  }

  if (filters.leadSource) {
    leadWhere.source = {
      equals: filters.leadSource,
      mode: "insensitive",
    };
  }

  if (filters.leadStatus === CONVERTED_LEAD_STATUS) {
    leadWhere.status = CONVERTED_LEAD_STATUS as Prisma.LeadWhereInput["status"];
  }

  if (Object.keys(leadWhere).length > 0) {
    where.lead = {
      is: leadWhere,
    };
  }

  if (Object.keys(applicationWhere).length > 0) {
    where.applications = {
      some: applicationWhere,
    };
  }

  if (filters.loanStatus) {
    loanProfileWhere.loanStatus = filters.loanStatus;
  }

  if (filters.nbfc) {
    loanProfileWhere.nbfc = filters.nbfc;
  }

  if (filters.fintechAssigneeId) {
    loanProfileWhere.fintechAssigneeId = filters.fintechAssigneeId;
  }

  if (Object.keys(loanProfileWhere).length > 0) {
    where.loanProfile = {
      is: loanProfileWhere,
    };
  }

  const dateRange = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );

  if (dateRange) {
    where.createdAt = dateRange;
  }

  const accessWhere = buildStudentAccessWhere(accessScope);

  if (accessWhere) {
    andConditions.push(accessWhere);
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

async function getFilterLookup(
  filters: PerformanceReportFilters,
): Promise<FilterLookup> {
  const [country, intake] = await Promise.all([
    filters.countryId
      ? db.country.findUnique({
          where: {
            id: filters.countryId,
          },
          select: {
            name: true,
          },
        })
      : Promise.resolve(null),
    filters.intakeId
      ? db.intake.findUnique({
          where: {
            id: filters.intakeId,
          },
          select: {
            name: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    countryName: country?.name ?? "",
    intakeName: intake?.name ?? "",
  };
}

export function parsePerformanceReportFilters(
  searchParams: URLSearchParams,
): PerformanceReportFilters {
  const allowedPresets: ReportDatePreset[] = [
    "all",
    "today",
    "yesterday",
    "last_7_days",
    "last_30_days",
    "this_month",
    "last_month",
    "this_quarter",
    "last_quarter",
    "this_year",
    "custom",
  ];

  const allowedScopes: ReportRecordScope[] = ["all", "leads", "students"];
  const requestedPreset = clean(searchParams.get("datePreset"));
  const requestedScope = clean(searchParams.get("recordScope"));

  const datePreset = allowedPresets.includes(
    requestedPreset as ReportDatePreset,
  )
    ? (requestedPreset as ReportDatePreset)
    : "all";

  const recordScope = allowedScopes.includes(
    requestedScope as ReportRecordScope,
  )
    ? (requestedScope as ReportRecordScope)
    : "all";

  return {
    search: clean(searchParams.get("search")),
    recordScope,
    branchId: clean(searchParams.get("branchId")),
    counselorId: clean(searchParams.get("counselorId")),
    leadStatus: clean(searchParams.get("leadStatus")),
    leadSource: clean(searchParams.get("leadSource")),
    countryId: clean(searchParams.get("countryId")),
    intakeId: clean(searchParams.get("intakeId")),
    universityId: clean(searchParams.get("universityId")),
    applicationStatus: clean(searchParams.get("applicationStatus")),
    casStatus: clean(searchParams.get("casStatus")),
    visaStatus: clean(searchParams.get("visaStatus")),
    loanStatus: clean(searchParams.get("loanStatus")),
    nbfc: clean(searchParams.get("nbfc")),
    fintechAssigneeId: clean(searchParams.get("fintechAssigneeId")),
    datePreset,
    startDate: clean(searchParams.get("startDate")),
    endDate: clean(searchParams.get("endDate")),
  };
}

export function parsePerformanceReportPagination(
  searchParams: URLSearchParams,
): {
  page: number;
  limit: number;
} {
  return {
    page: parsePositiveInteger(searchParams.get("page"), 1, 100000),
    limit: parsePositiveInteger(searchParams.get("limit"), 20, 100),
  };
}

export async function getPerformanceReport(
  filters: PerformanceReportFilters,
  page: number,
  limit: number,
  includeApplicationRows = false,
  accessScope: PerformanceReportAccessScope = FULL_PERFORMANCE_ACCESS,
): Promise<PerformanceReportData> {
  const lookup = await getFilterLookup(filters);
  const includeLeads = shouldIncludeLeads(filters);
  const includeStudents = shouldIncludeStudents(filters);

  const [leads, students, targetMetrics] = await Promise.all([
    includeLeads
      ? db.lead.findMany({
          where: buildLeadWhere(filters, lookup, accessScope),
          select: performanceLeadSelect,
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([] as PerformanceLeadRecord[]),
    includeStudents
      ? db.student.findMany({
          where: buildStudentWhere(filters, accessScope),
          select: performanceStudentSelect,
          orderBy: {
            createdAt: "desc",
          },
        })
      : Promise.resolve([] as PerformanceStudentRecord[]),
    getTargetMetrics(filters, accessScope),
  ]);

  const studentIds = students.map((student) => student.id);
  const applications =
    studentIds.length === 0
      ? []
      : await db.studentApplication.findMany({
          where: {
            ...buildApplicationWhere(filters),
            studentId: {
              in: studentIds,
            },
          },
          select: performanceApplicationSelect,
          orderBy: [
            {
              applicationDate: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
        });

  const applicationsByStudent = groupApplicationsByStudent(applications);
  const counselorOverride = getPerformanceCounselorOverride(accessScope);
  const allRows = [
    ...leads.map((lead) => mapLeadToRow(lead, counselorOverride)),
    ...students.map((student) =>
      mapStudentToRow(
        student,
        applicationsByStudent.get(student.id) ?? [],
        counselorOverride,
      ),
    ),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const rows = allRows.slice(start, start + limit);
  const studentMap = new Map(students.map((student) => [student.id, student]));

  const applicationRows = includeApplicationRows
    ? applications.flatMap((application) => {
        const student = studentMap.get(application.studentId);

        return student
          ? [mapApplicationToExportRow(application, student, counselorOverride)]
          : [];
      })
    : undefined;

  return {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(leads, students, applications, targetMetrics),
    monthlyVolume: buildMonthlyVolume(leads, students, applications),
    countryDemand: buildCountryDemand(leads, students, applicationsByStudent),
    leadStatusBreakdown: buildLeadStatusBreakdown(leads, students),
    leadSourceBreakdown: buildLeadSourceBreakdown(leads, students),
    applicationStatusBreakdown: buildStatusBreakdown(
      applications.map((application) => String(application.status ?? "")),
    ),
    visaStatusBreakdown: buildStatusBreakdown(
      students.map((student) => student.visaProfile?.visaStatus ?? ""),
    ),
    loanStatusBreakdown: buildStatusBreakdown(
      students.map((student) => student.loanProfile?.loanStatus ?? ""),
    ),
    branchPerformance: buildBranchPerformance(
      leads,
      students,
      applications,
      targetMetrics,
    ),
    counselorPerformance: buildCounselorPerformance(
      leads,
      students,
      applications,
      targetMetrics,
      filters.branchId,
      accessScope,
    ),
    rows,
    ...(applicationRows && { applicationRows }),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getPerformanceReportForExport(
  filters: PerformanceReportFilters,
  accessScope: PerformanceReportAccessScope = FULL_PERFORMANCE_ACCESS,
): Promise<PerformanceReportData> {
  return getPerformanceReport(
    filters,
    1,
    Number.MAX_SAFE_INTEGER,
    true,
    accessScope,
  );
}

export async function getPerformanceReportFilterOptions(): Promise<PerformanceReportFilterOptions> {
  const [
    branches,
    counselors,
    countries,
    intakes,
    universities,
    applicationStatuses,
    visaProfiles,
    loanProfiles,
    fintechProfiles,
    leadSourcesMaster,
    leadSourcesUsed,
  ] = await Promise.all([
    db.branch.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.user.findMany({
      where: {
        role: {
          is: {
            name: "Counsellor",
          },
        },
      },
      select: {
        id: true,
        name: true,
        branches: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.country.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.intake.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.university.findMany({
      select: {
        id: true,
        name: true,
        countryId: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.studentApplication.findMany({
      distinct: ["status"],
      select: {
        status: true,
      },
      orderBy: {
        status: "asc",
      },
    }),
    db.studentVisaProfile.findMany({
      select: {
        casStatus: true,
        visaStatus: true,
        casDeadlineDate: true,
      },
    }),
    db.studentLoanProfile.findMany({
      select: {
        loanStatus: true,
        nbfc: true,
        fintechAssigneeId: true,
      },
    }),
    db.studentLoanProfile.findMany({
      where: {
        fintechAssigneeId: {
          not: null,
        },
      },
      distinct: ["fintechAssigneeId"],
      select: {
        fintechAssignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    db.leadSource.findMany({
      where: {
        status: true,
      },
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.lead.findMany({
      where: {
        source: {
          not: null,
        },
      },
      distinct: ["source"],
      select: {
        source: true,
      },
    }),
  ]);

  const uniqueSorted = (values: Array<string | null | undefined>) =>
    Array.from(
      new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
    ).sort((a, b) => a.localeCompare(b));

  return {
    branches: branches.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
    counselors: counselors.map((counselor) => ({
      value: counselor.id,
      label: counselor.name,
      branchIds: counselor.branches.map((branch) => branch.id),
    })),
    countries: countries.map((country) => ({
      value: country.id,
      label: country.name,
    })),
    intakes: intakes.map((intake) => ({
      value: intake.id,
      label: intake.name,
    })),
    universities: universities.map((university) => ({
      value: university.id,
      label: university.name,
      countryId: university.countryId,
    })),
    fintechAssignees: fintechProfiles
      .map((profile) => profile.fintechAssignee)
      .filter(
        (
          assignee,
        ): assignee is {
          id: string;
          name: string;
        } => Boolean(assignee),
      )
      .map((assignee) => ({
        value: assignee.id,
        label: assignee.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    leadStatuses: [
      "draft",
      "new",
      "contacted",
      "qualified",
      "converted",
      "lost",
    ],
    leadSources: uniqueSorted([
      ...leadSourcesMaster.map((source) => source.name),
      ...leadSourcesUsed.map((lead) => lead.source),
    ]),
    applicationStatuses: applicationStatuses.map((item) => String(item.status)),
    casStatuses: uniqueSorted(visaProfiles.map((profile) => profile.casStatus)),
    visaStatuses: uniqueSorted(
      visaProfiles.map((profile) => profile.visaStatus),
    ),
    loanStatuses: uniqueSorted(
      loanProfiles.map((profile) => profile.loanStatus),
    ),
    nbfcs: uniqueSorted(loanProfiles.map((profile) => profile.nbfc)),
  };
}
