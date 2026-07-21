import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import {
  resolveFinalLeadOwner,
  resolveFinalLoanOwner,
  resolveFinalStudentOwner,
  type ResolvedReportOwner,
} from "@/lib/report-owner";
import type {
  DirectorReportComparisonRow,
  DirectorReportData,
  DirectorReportFilterOptions,
  DirectorReportFilters,
  DirectorReportRow,
  DirectorReportSummary,
  DirectorReportTableTotals,
  DirectorReportLeadDetail,
  DirectorReportIntakeComparisonRow,
} from "@/types/director-report";

const STUDY_ABROAD_LEAD_TYPE = "study_abroad";
const LOST_LEAD_STATUSES = new Set(["lost", "closed_lost", "lead_lost"]);
const DROPPED_STUDENT_STATUSES = new Set(["drop", "dropped", "student_dropped"]);
const ACTIVE_LEAD_STATUSES = new Set(["new", "contacted", "qualified", "follow_up", "followup", "active"]);

const directorLeadSelect = {
  id: true,
  leadNumber: true,
  studentName: true,
  mobileNumber: true,
  emailId: true,
  source: true,
  branchId: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  convertedById: true,
  convertedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  isConverted: true,
  convertedAt: true,
  preferredCountry: true,
  preferredIntake: true,
  preferredCourse: true,
  status: true,
  createdAt: true,
  branch: {
    select: {
      id: true,
      name: true,
    },
  },
  counselors: {
    orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
    select: {
      counselorId: true,
      isPrimary: true,
      assignedAt: true,
      counselor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.LeadSelect;

const directorStudentSelect = {
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
      branchId: true,
      createdById: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      convertedById: true,
      convertedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      preferredCountry: true,
      preferredIntake: true,
      preferredCourse: true,
      status: true,
      convertedAt: true,
      createdAt: true,
      counselors: {
        orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
        select: {
          counselorId: true,
          isPrimary: true,
          assignedAt: true,
          counselor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      loanApplication: {
        select: {
          id: true,
          fintechAssigneeId: true,
          loanStatus: true,
          requiredLoanAmount: true,
          sanctionedAmount: true,
          disbursedAmount: true,
          sanction: {
            select: {
              sanctionedAmount: true,
            },
          },
          disbursement: {
            select: {
              disbursedAmount: true,
            },
          },
        },
      },
    },
  },
  applications: {
    select: {
      id: true,
      intakeId: true,
      intakeName: true,
      intake: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  visaProfile: {
    select: {
      casStatus: true,
      visaStatus: true,
      visaDecisionDate: true,
    },
  },
  loanProfile: {
    select: {
      loanStatus: true,
      nbfc: true,
      fintechAssigneeId: true,
      disbursed: true,
      disbursedDate: true,
    },
  },
} satisfies Prisma.StudentSelect;

const directorApplicationSelect = {
  id: true,
  studentId: true,
  intakeId: true,
  intakeName: true,
  countryId: true,
  countryName: true,
  universityId: true,
  universityName: true,
  applicationDate: true,
  status: true,
  offerStatus: true,
  createdAt: true,
  intake: {
    select: {
      id: true,
      name: true,
    },
  },
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
  student: {
    select: {
      id: true,
      leadId: true,
      branchId: true,
      counselorId: true,
      studentName: true,
      mobileNumber: true,
      emailId: true,
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
          branchId: true,
          createdById: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          convertedById: true,
          convertedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          preferredCountry: true,
          preferredIntake: true,
          preferredCourse: true,
          status: true,
          convertedAt: true,
          createdAt: true,
          counselors: {
            orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
            select: {
              counselorId: true,
              isPrimary: true,
              assignedAt: true,
              counselor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          loanApplication: {
            select: {
              id: true,
              fintechAssigneeId: true,
              loanStatus: true,
              requiredLoanAmount: true,
              sanctionedAmount: true,
              disbursedAmount: true,
              sanction: {
                select: {
                  sanctionedAmount: true,
                },
              },
              disbursement: {
                select: {
                  disbursedAmount: true,
                },
              },
            },
          },
        },
      },
      visaProfile: {
        select: {
          casStatus: true,
          visaStatus: true,
          visaDecisionDate: true,
        },
      },
      loanProfile: {
        select: {
          loanStatus: true,
          nbfc: true,
          fintechAssigneeId: true,
          disbursed: true,
          disbursedDate: true,
        },
      },
    },
  },
} satisfies Prisma.StudentApplicationSelect;

type DirectorLeadRecord = Prisma.LeadGetPayload<{ select: typeof directorLeadSelect }>;
type DirectorStudentRecord = Prisma.StudentGetPayload<{ select: typeof directorStudentSelect }>;
type DirectorApplicationRecord = Prisma.StudentApplicationGetPayload<{ select: typeof directorApplicationSelect }>;

type DateRange = {
  gte: Date;
  lt: Date;
};

type UserDirectory = Map<string, string>;

type IntakeDirectory = Map<string, IntakeLookup>;

type IntakeLookup = {
  id: string;
  name: string;
};

type CountryLookup = {
  id: string;
  name: string;
};

type AttributedUser = {
  userId: string;
  userName: string;
  attribution: string;
};

type LeadUserReference = {
  id: string;
  leadNumber: string;
  source: string | null;
  branchId: string;
  createdById: string | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  convertedById: string | null;
  convertedBy: {
    id: string;
    name: string;
  } | null;
  convertedAt: Date | null;
  preferredCountry: string | null;
  preferredIntake: string | null;
  status: string | null;
  createdAt: Date;
  counselors: Array<{
    counselorId: string;
    isPrimary: boolean;
    assignedAt: Date;
    counselor: {
      id: string;
      name: string;
    } | null;
  }>;
};

type StudentUserReference = {
  counselorId: string | null;
  counselor: {
    id: string;
    name: string;
  } | null;
  lead: LeadUserReference;
};

type MutableRow = DirectorReportRow & {
  leadNumberSet: Set<string>;
};

type RowCollection = {
  rows: Map<string, MutableRow>;
  details: DirectorReportLeadDetail[];
};

function clean(value: string | null): string {
  return value?.trim() ?? "";
}

function normalizeStatus(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

function round(value: number, decimals = 1): number {
  return Number(value.toFixed(decimals));
}

function percentage(part: number, total: number): number {
  return total > 0 ? round((part / total) * 100) : 0;
}

function isLostLead(status: string | null | undefined): boolean {
  return LOST_LEAD_STATUSES.has(normalizeStatus(status));
}

function isActiveLead(status: string | null | undefined): boolean {
  const normalized = normalizeStatus(status);

  return normalized ? ACTIVE_LEAD_STATUSES.has(normalized) : false;
}

function isQualifiedLead(status: string | null | undefined): boolean {
  return normalizeStatus(status) === "qualified";
}

function isDroppedStudent(status: string | null | undefined): boolean {
  return DROPPED_STUDENT_STATUSES.has(normalizeStatus(status));
}

function isOfferStatus(status: string | null | undefined): boolean {
  const normalized = normalizeStatus(status);

  return Boolean(
    normalized &&
      !["none", "not_received", "pending", "rejected", "not_applicable"].includes(normalized),
  );
}

function isCasReceived(status: string | null | undefined): boolean {
  return ["received", "cas_received", "issued"].includes(normalizeStatus(status));
}

function isVisaApproved(status: string | null | undefined): boolean {
  return ["approved", "visa_approved", "granted"].includes(normalizeStatus(status));
}

function isLoanSanctioned(status: string | null | undefined): boolean {
  return [
    "sanctioned",
    "approved",
    "disbursed",
    "partially_disbursed",
    "fully_disbursed",
    "sanctioned_approved",
  ].includes(normalizeStatus(status));
}

type DirectorStudentWithProfiles =
  | DirectorStudentRecord
  | DirectorApplicationRecord["student"];

function getStudentLoanMetrics(student: DirectorStudentWithProfiles) {
  const legacyProfile = student.loanProfile;
  const loanApplication = student.lead.loanApplication;
  const status = loanApplication?.loanStatus ?? legacyProfile?.loanStatus ?? "";
  const appliedAmount = toNumber(loanApplication?.requiredLoanAmount);
  const sanctionedAmount = toNumber(
    loanApplication?.sanction?.sanctionedAmount ??
      loanApplication?.sanctionedAmount,
  );
  const disbursedAmount = toNumber(
    loanApplication?.disbursement?.disbursedAmount ??
      loanApplication?.disbursedAmount,
  );

  const loggedIn = Boolean(loanApplication || legacyProfile);
  const approved =
    Boolean(loanApplication?.sanction) ||
    sanctionedAmount > 0 ||
    isLoanSanctioned(status);

  return {
    status,
    loggedIn,
    approved,
    appliedAmount,
    sanctionedAmount,
    disbursedAmount,
    sanctioned: approved,
    disbursed:
      Boolean(loanApplication?.disbursement) ||
      disbursedAmount > 0 ||
      Boolean(legacyProfile?.disbursed),
  };
}

function applyLoanMetrics(
  row: MutableRow,
  loan: ReturnType<typeof getStudentLoanMetrics>,
) {
  row.loanLogins += loan.loggedIn ? 1 : 0;
  row.loanApproved += loan.approved ? 1 : 0;
  row.loanSanctioned += loan.sanctioned ? 1 : 0;
  row.loanDisbursed += loan.disbursed ? 1 : 0;
  row.appliedAmount += loan.appliedAmount;
  row.sanctionedAmount += loan.sanctionedAmount;
  row.disbursedAmount += loan.disbursedAmount;
}

function hasLoanActivity(
  loan: ReturnType<typeof getStudentLoanMetrics>,
): boolean {
  return Boolean(
    loan.loggedIn ||
      loan.approved ||
      loan.sanctioned ||
      loan.disbursed ||
      loan.appliedAmount ||
      loan.sanctionedAmount ||
      loan.disbursedAmount
  );
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

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  return addDays(date, diff);
}

function parseDateOnly(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(date: Date | null | undefined, range: DateRange): boolean {
  if (!date) {
    return false;
  }

  return date >= range.gte && date < range.lt;
}

function studentLifecycleDate(
  student: Pick<DirectorStudentRecord, "createdAt" | "lead">,
): Date {
  return student.lead.convertedAt ?? student.createdAt;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
  });
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  });
}

function weekLabel(start: Date): string {
  return `${dateLabel(start)} - ${dateLabel(addDays(start, 6))}`;
}

function getRanges(now = new Date()) {
  const today = getIndiaCalendarDate(now);
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const currentWeekStart = startOfWeek(today);
  const currentWeekEnd = addDays(currentWeekStart, 7);
  const previousWeekStart = addDays(currentWeekStart, -7);
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = addMonths(currentMonthStart, 1);
  const previousMonthStart = addMonths(currentMonthStart, -1);
  const quarterStartMonth = Math.floor(today.getUTCMonth() / 3) * 3;
  const currentQuarterStart = new Date(Date.UTC(today.getUTCFullYear(), quarterStartMonth, 1));
  const previousQuarterStart = addMonths(currentQuarterStart, -3);
  const currentYearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));

  return {
    today,
    todayRange: { gte: today, lt: tomorrow },
    yesterdayRange: { gte: yesterday, lt: today },
    last7DaysRange: { gte: addDays(today, -6), lt: tomorrow },
    last30DaysRange: { gte: addDays(today, -29), lt: tomorrow },
    currentWeekStart,
    currentWeekRange: { gte: currentWeekStart, lt: currentWeekEnd },
    previousWeekRange: { gte: previousWeekStart, lt: currentWeekStart },
    currentMonthStart,
    currentMonthRange: { gte: currentMonthStart, lt: currentMonthEnd },
    previousMonthRange: { gte: previousMonthStart, lt: currentMonthStart },
    currentQuarterRange: { gte: currentQuarterStart, lt: currentMonthEnd },
    previousQuarterRange: { gte: previousQuarterStart, lt: currentQuarterStart },
    currentYearRange: { gte: currentYearStart, lt: currentMonthEnd },
    allRange: { gte: new Date(Date.UTC(1970, 0, 1)), lt: currentMonthEnd },
    reportRange: { gte: previousMonthStart, lt: currentMonthEnd },
  };
}

function getCustomRange(filters: DirectorReportFilters): DateRange | null {
  if (filters.datePreset !== "custom") {
    return null;
  }

  const start = parseDateOnly(filters.startDate);
  const end = parseDateOnly(filters.endDate);

  if (!start && !end) {
    return null;
  }

  return {
    gte: start ?? new Date(Date.UTC(1970, 0, 1)),
    lt: end ? addDays(end, 1) : addMonths(getIndiaCalendarDate(new Date()), 1),
  };
}

function getPrimaryRange(
  filters: DirectorReportFilters,
  ranges: ReturnType<typeof getRanges>,
): DateRange {
  const customRange = getCustomRange(filters);

  if (customRange) {
    return customRange;
  }

  const map: Record<Exclude<DirectorReportFilters["datePreset"], "custom">, DateRange> = {
    all: ranges.allRange,
    today: ranges.todayRange,
    yesterday: ranges.yesterdayRange,
    last_7_days: ranges.last7DaysRange,
    last_30_days: ranges.last30DaysRange,
    this_week: ranges.currentWeekRange,
    last_week: ranges.previousWeekRange,
    this_month: ranges.currentMonthRange,
    last_month: ranges.previousMonthRange,
    this_quarter: ranges.currentQuarterRange,
    last_quarter: ranges.previousQuarterRange,
    this_year: ranges.currentYearRange,
  };

  return map[filters.datePreset as Exclude<DirectorReportFilters["datePreset"], "custom">] ?? ranges.currentMonthRange;
}

function mergeRanges(...ranges: DateRange[]): DateRange {
  return {
    gte: new Date(Math.min(...ranges.map((range) => range.gte.getTime()))),
    lt: new Date(Math.max(...ranges.map((range) => range.lt.getTime()))),
  };
}

function getPrimaryPeriodLabel(filters: DirectorReportFilters, range: DateRange): string {
  const labels: Partial<Record<DirectorReportFilters["datePreset"], string>> = {
    all: "All Time",
    today: "Today",
    yesterday: "Yesterday",
    last_7_days: "Last 7 Days",
    last_30_days: "Last 30 Days",
    this_week: weekLabel(range.gte),
    last_week: weekLabel(range.gte),
    this_month: monthLabel(range.gte),
    last_month: monthLabel(range.gte),
    this_quarter: "This Quarter",
    last_quarter: "Last Quarter",
    this_year: String(range.gte.getUTCFullYear()),
    custom: "Selected Period",
  };

  return labels[filters.datePreset] ?? "Selected Period";
}

function emptySummary(): DirectorReportSummary {
  return {
    totalWalkins: 0,
    leadsAdded: 0,
    allLeads: 0,
    activeLeads: 0,
    qualifiedLeads: 0,
    lostLeads: 0,
    students: 0,
    droppedStudents: 0,
    applications: 0,
    offers: 0,
    casReceived: 0,
    visaApproved: 0,
    loanLogins: 0,
    loanApproved: 0,
    loanSanctioned: 0,
    loanDisbursed: 0,
    target: 0,
    achieved: 0,
    appliedAmount: 0,
    sanctionedAmount: 0,
    disbursedAmount: 0,
    leadToStudentConversionPercentage: 0,
    applicationConversionPercentage: 0,
    visaConversionPercentage: 0,
    loanConversionPercentage: 0,
    targetCompletionPercentage: 0,
  };
}

function finalizeSummary<T extends DirectorReportSummary>(summary: T): T {
  summary.leadToStudentConversionPercentage = percentage(
    summary.students,
    summary.totalWalkins,
  );
  summary.applicationConversionPercentage = percentage(summary.applications, summary.students);
  summary.visaConversionPercentage = percentage(summary.visaApproved, summary.students);
  summary.loanConversionPercentage = percentage(summary.loanApproved, summary.loanLogins);
  summary.targetCompletionPercentage = percentage(summary.achieved, summary.target);

  return summary;
}

function applySummary(target: DirectorReportSummary, value: DirectorReportSummary) {
  target.totalWalkins += value.totalWalkins;
  target.leadsAdded += value.leadsAdded;
  target.allLeads += value.allLeads;
  target.activeLeads += value.activeLeads;
  target.qualifiedLeads += value.qualifiedLeads;
  target.lostLeads += value.lostLeads;
  target.students += value.students;
  target.droppedStudents += value.droppedStudents;
  target.applications += value.applications;
  target.offers += value.offers;
  target.casReceived += value.casReceived;
  target.visaApproved += value.visaApproved;
  target.loanLogins += value.loanLogins;
  target.loanApproved += value.loanApproved;
  target.loanSanctioned += value.loanSanctioned;
  target.loanDisbursed += value.loanDisbursed;
  target.target += value.target;
  target.achieved += value.achieved;
  target.appliedAmount += value.appliedAmount;
  target.sanctionedAmount += value.sanctionedAmount;
  target.disbursedAmount += value.disbursedAmount;
}

function createRow(
  periodKey: string,
  periodLabel: string,
  branchId: string,
  branchName: string,
  counselorId: string,
  counselorName: string,
  intake?: IntakeLookup | null,
): MutableRow {
  return {
    rowId: `${periodKey}:${intake?.id ?? "all"}:${branchId}:${counselorId}`,
    periodKey,
    periodLabel,
    branchId,
    branchName,
    counselorId,
    counselorName,
    intakeId: intake?.id ?? null,
    intakeName: intake?.name ?? null,
    ...emptySummary(),
    leadNumbers: [],
    leadNumberSet: new Set<string>(),
    avgWeeklyWalkins: 0,
    avgWeeklyApplications: 0,
    avgWeeklyLoanLogins: 0,
    avgWeeklyLoanApproved: 0,
    avgWeeklyLoanSanctioned: 0,
    avgWeeklyVisaApproved: 0,
  };
}

function getRow(
  collection: RowCollection,
  periodKey: string,
  periodLabel: string,
  branchId: string,
  branchName: string,
  counselorId: string,
  counselorName: string,
  intake?: IntakeLookup | null,
): MutableRow {
  const key = `${periodKey}:${intake?.id ?? "all"}:${branchId}:${counselorId}`;
  const existing = collection.rows.get(key);

  if (existing) {
    return existing;
  }

  const row = createRow(periodKey, periodLabel, branchId, branchName, counselorId, counselorName, intake);
  collection.rows.set(key, row);

  return row;
}

function pushLeadNumber(row: MutableRow, leadNumber: string | null | undefined) {
  if (!leadNumber || row.leadNumberSet.has(leadNumber)) {
    return;
  }

  row.leadNumberSet.add(leadNumber);
  row.leadNumbers.push(leadNumber);
}

const UNASSIGNED_USER_ID = "__unassigned__";

function applyUserFilter(
  user: AttributedUser,
  filters: DirectorReportFilters,
): AttributedUser[] {
  if (filters.counselorId && user.userId !== filters.counselorId) {
    return [];
  }

  return [user];
}

function ownerSourceLabel(owner: ResolvedReportOwner): string {
  const labels: Record<ResolvedReportOwner["source"], string> = {
    latest_assignment: "Latest Assignment",
    creator: "Creator (Never Assigned)",
    converted_by: "Converted By",
    student_counselor: "Student Counsellor",
    fintech_assignee: "Fintech Assignee",
    loan_counselor: "Loan Counsellor",
    loan_creator: "Loan Created By",
    unassigned: "Unassigned",
  };

  return labels[owner.source];
}

function toAttributedUser(
  owner: ResolvedReportOwner,
  users: UserDirectory,
  filters: DirectorReportFilters,
  stage: "Walk-in" | "Student" | "Loan",
): AttributedUser[] {
  return applyUserFilter(
    {
      userId: owner.id,
      userName: users.get(owner.id) ?? owner.name,
      attribution: `${stage} Owner — ${ownerSourceLabel(owner)}`,
    },
    filters,
  );
}

/**
 * Open walk-ins belong to one current owner:
 * latest assignment first, creator only when the lead was never assigned.
 */
function getFinalLeadOwner(
  lead: LeadUserReference,
  users: UserDirectory,
  filters: DirectorReportFilters,
): AttributedUser[] {
  return toAttributedUser(
    resolveFinalLeadOwner(lead),
    users,
    filters,
    "Walk-in",
  );
}

/**
 * Converted records belong to the user who performed the conversion.
 * Student.counselorId is only a fallback when convertedById was not captured.
 */
function getFinalStudentOwner(
  student: StudentUserReference,
  users: UserDirectory,
  filters: DirectorReportFilters,
): AttributedUser[] {
  return toAttributedUser(
    resolveFinalStudentOwner(student),
    users,
    filters,
    "Student",
  );
}

function getFinalLoanOwner(
  student: DirectorStudentWithProfiles,
  users: UserDirectory,
  filters: DirectorReportFilters,
): AttributedUser[] {
  const owner = resolveFinalLoanOwner({
    fintechAssigneeId:
      student.lead.loanApplication?.fintechAssigneeId ??
      student.loanProfile?.fintechAssigneeId ??
      null,
    lead: {
      ...student.lead,
      student: {
        counselorId: student.counselorId,
        counselor: student.counselor,
      },
    },
  });

  return toAttributedUser(owner, users, filters, "Loan");
}

function intakeDirectoryKey(value: string | null | undefined): string {
  return normalizeStatus(value);
}

function buildIntakeDirectory(
  options: DirectorReportFilterOptions,
): IntakeDirectory {
  return new Map(
    options.intakes.map((option) => [
      intakeDirectoryKey(option.label),
      { id: option.value, name: option.label },
    ]),
  );
}

function resolveIntake(
  name: string | null | undefined,
  intakeLookup: IntakeLookup | null,
  directory: IntakeDirectory,
): IntakeLookup | null {
  const cleanedName = name?.trim();

  if (!cleanedName) {
    return intakeLookup;
  }

  const matched = directory.get(intakeDirectoryKey(cleanedName));

  if (matched) {
    return matched;
  }

  if (
    intakeLookup &&
    intakeDirectoryKey(intakeLookup.name) === intakeDirectoryKey(cleanedName)
  ) {
    return intakeLookup;
  }

  return {
    id: `name:${intakeDirectoryKey(cleanedName)}`,
    name: cleanedName,
  };
}

function getLeadIntake(
  lead: Pick<LeadUserReference, "preferredIntake">,
  intakeLookup: IntakeLookup | null,
  directory: IntakeDirectory,
): IntakeLookup | null {
  return resolveIntake(lead.preferredIntake, intakeLookup, directory);
}

function getStudentIntake(
  student: DirectorStudentRecord,
  intakeLookup: IntakeLookup | null,
  directory: IntakeDirectory,
): IntakeLookup | null {
  const matchingApplication = intakeLookup
    ? student.applications.find(
        (application) =>
          application.intakeId === intakeLookup.id ||
          intakeDirectoryKey(application.intakeName ?? application.intake?.name) ===
            intakeDirectoryKey(intakeLookup.name),
      )
    : student.applications.find(
        (application) =>
          application.intakeId ||
          application.intakeName ||
          application.intake?.name,
      );

  if (matchingApplication) {
    const name =
      matchingApplication.intakeName ??
      matchingApplication.intake?.name ??
      intakeLookup?.name ??
      "Not Set";
    const id =
      matchingApplication.intakeId ??
      matchingApplication.intake?.id ??
      directory.get(intakeDirectoryKey(name))?.id ??
      intakeLookup?.id ??
      `name:${intakeDirectoryKey(name)}`;

    return { id, name };
  }

  return getLeadIntake(student.lead, intakeLookup, directory);
}

function getApplicationIntake(application: DirectorApplicationRecord, fallback: IntakeLookup | null): IntakeLookup | null {
  const name = application.intakeName ?? application.intake?.name ?? fallback?.name ?? "Not Set";
  const id = application.intakeId ?? application.intake?.id ?? fallback?.id ?? name;

  return { id, name };
}

function leadMatchesIntake(
  lead: Pick<LeadUserReference, "preferredIntake">,
  intake: IntakeLookup | null,
): boolean {
  if (!intake) {
    return true;
  }

  return normalizeStatus(lead.preferredIntake) === normalizeStatus(intake.name);
}

function studentMatchesIntake(
  student: StudentUserReference & {
    applications?: Array<{
      intakeId: string | null;
      intakeName: string | null;
      intake: { id: string; name: string } | null;
    }>;
  },
  intake: IntakeLookup | null,
): boolean {
  if (!intake) {
    return true;
  }

  const applications = student.applications ?? [];

  return (
    leadMatchesIntake(student.lead, intake) ||
    applications.some(
      (application) =>
        application.intakeId === intake.id ||
        normalizeStatus(application.intakeName ?? application.intake?.name) === normalizeStatus(intake.name),
    )
  );
}

function addLeadDetail(
  collection: RowCollection,
  lead: LeadUserReference,
  branchName: string,
  user: AttributedUser,
  studentName: string,
  mobileNumber: string,
  source: string,
  createdAt: Date,
) {
  collection.details.push({
    rowId: `${lead.id}:${user.userId}:${user.attribution}`,
    leadId: lead.id,
    leadNumber: lead.leadNumber,
    branchName,
    counselorId: user.userId,
    counselorName: user.userName,
    studentName,
    mobileNumber,
    source,
    preferredCountry: lead.preferredCountry ?? "Not Set",
    preferredIntake: lead.preferredIntake ?? "Not Set",
    status: String(lead.status ?? ""),
    attribution: user.attribution,
    createdAt: createdAt.toISOString(),
  });
}

function addLeadToCollection(
  collection: RowCollection,
  lead: DirectorLeadRecord,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
) {
  if (!inRange(lead.createdAt, range) || !leadMatchesIntake(lead, intake)) {
    return;
  }

  const branchId = lead.branchId;
  const branchName = lead.branch?.name ?? "Not Assigned";
  const attributedUsers = getFinalLeadOwner(lead, users, filters);

  for (const user of attributedUsers) {
    const row = getRow(collection, periodKey, periodLabel, branchId, branchName, user.userId, user.userName);

    row.totalWalkins += 1;
    row.allLeads += 1;
    row.leadsAdded += 1;
    row.activeLeads += isActiveLead(String(lead.status ?? "")) ? 1 : 0;
    row.qualifiedLeads += isQualifiedLead(String(lead.status ?? "")) ? 1 : 0;
    row.lostLeads += isLostLead(String(lead.status ?? "")) ? 1 : 0;
    pushLeadNumber(row, lead.leadNumber);
    addLeadDetail(collection, lead, branchName, user, lead.studentName ?? "Not Set", lead.mobileNumber ?? "", lead.source ?? "Not Set", lead.createdAt);
  }
}

function addStudentToCollection(
  collection: RowCollection,
  student: DirectorStudentRecord,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
) {
  if (!inRange(studentLifecycleDate(student), range) || !studentMatchesIntake(student, intake)) {
    return;
  }

  const visaProfile = student.visaProfile;
  const loan = getStudentLoanMetrics(student);
  const branchId = student.branchId;
  const branchName = student.branch?.name ?? "Not Assigned";
  const studentOwners = getFinalStudentOwner(student, users, filters);
  const studentOwnerIds = new Set(studentOwners.map((owner) => owner.userId));

  for (const user of studentOwners) {
    const row = getRow(
      collection,
      periodKey,
      periodLabel,
      branchId,
      branchName,
      user.userId,
      user.userName,
    );

    row.totalWalkins += 1;
    row.students += 1;
    row.droppedStudents += isDroppedStudent(String(student.status ?? "")) ? 1 : 0;
    row.casReceived += isCasReceived(String(visaProfile?.casStatus ?? "")) ? 1 : 0;
    row.visaApproved += isVisaApproved(String(visaProfile?.visaStatus ?? "")) ? 1 : 0;
    row.achieved += 1;
    pushLeadNumber(row, student.lead.leadNumber);
    addLeadDetail(
      collection,
      student.lead,
      branchName,
      user,
      student.studentName,
      student.mobileNumber,
      student.lead.source ?? "Not Set",
      studentLifecycleDate(student),
    );
  }

  if (hasLoanActivity(loan)) {
    for (const user of getFinalLoanOwner(student, users, filters)) {
      const row = getRow(
        collection,
        periodKey,
        periodLabel,
        branchId,
        branchName,
        user.userId,
        user.userName,
      );

      applyLoanMetrics(row, loan);
      pushLeadNumber(row, student.lead.leadNumber);

      if (!studentOwnerIds.has(user.userId)) {
        addLeadDetail(
          collection,
          student.lead,
          branchName,
          user,
          student.studentName,
          student.mobileNumber,
          student.lead.source ?? "Not Set",
          studentLifecycleDate(student),
        );
      }
    }
  }
}

function addApplicationToCollection(
  collection: RowCollection,
  application: DirectorApplicationRecord,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  forceIntakeGrouping = false,
) {
  const applicationDate = application.applicationDate ?? application.createdAt;

  if (!inRange(applicationDate, range)) {
    return;
  }

  if (intake && application.intakeId !== intake.id && normalizeStatus(application.intakeName ?? application.intake?.name) !== normalizeStatus(intake.name)) {
    return;
  }

  const student = application.student;
  const branchId = student.branchId;
  const branchName = student.branch?.name ?? "Not Assigned";
  const applicationIntake = forceIntakeGrouping ? getApplicationIntake(application, intake) : null;
  const attributedUsers = getFinalStudentOwner(student, users, filters);

  for (const user of attributedUsers) {
    const row = getRow(collection, periodKey, periodLabel, branchId, branchName, user.userId, user.userName, applicationIntake);

    row.applications += 1;
    row.offers += isOfferStatus(String(application.offerStatus ?? "")) ? 1 : 0;
    pushLeadNumber(row, student.lead.leadNumber);
  }
}

function addTargetsToCollection(
  collection: RowCollection,
  periodKey: string,
  periodLabel: string,
  targets: Awaited<ReturnType<typeof getTargets>>,
  filters: DirectorReportFilters,
  groupByIntake = false,
) {
  for (const target of targets) {
    if (filters.branchId && target.branchId !== filters.branchId) {
      continue;
    }

    if (filters.counselorId && target.counsellorId !== filters.counselorId) {
      continue;
    }

    if (filters.intakeId && target.intakeId !== filters.intakeId) {
      continue;
    }

    const rowPeriodKey = groupByIntake ? target.intakeId : periodKey;
    const rowPeriodLabel = groupByIntake ? target.intake.name : periodLabel;
    const intake = groupByIntake
      ? { id: target.intake.id, name: target.intake.name }
      : null;
    const matchingRows = Array.from(collection.rows.values()).filter(
      (row) =>
        row.periodKey === rowPeriodKey &&
        row.branchId === target.branchId &&
        row.counselorId === target.counsellorId &&
        (!groupByIntake || row.intakeId === target.intakeId),
    );

    if (matchingRows.length === 0) {
      const row = getRow(
        collection,
        rowPeriodKey,
        rowPeriodLabel,
        target.branch.id,
        target.branch.name,
        target.counsellor.id,
        target.counsellor.name,
        intake,
      );
      row.target += target.target;
      continue;
    }

    for (const row of matchingRows) {
      row.target += target.target;
    }
  }
}

function finalizeRows(collection: RowCollection, weeksForAverage = 1): DirectorReportRow[] {
  return Array.from(collection.rows.values())
    .map((row) => {
      row.leadNumbers.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      row.avgWeeklyWalkins = round(row.totalWalkins / weeksForAverage);
      row.avgWeeklyApplications = round(row.applications / weeksForAverage);
      row.avgWeeklyLoanLogins = round(row.loanLogins / weeksForAverage);
      row.avgWeeklyLoanApproved = round(row.loanApproved / weeksForAverage);
      row.avgWeeklyLoanSanctioned = row.avgWeeklyLoanApproved;
      row.avgWeeklyVisaApproved = round(row.visaApproved / weeksForAverage);
      finalizeSummary(row);
      delete (row as Partial<MutableRow>).leadNumberSet;

      return row;
    })
    .sort(
      (a, b) =>
        a.periodKey.localeCompare(b.periodKey) ||
        a.branchName.localeCompare(b.branchName) ||
        a.counselorName.localeCompare(b.counselorName),
    );
}

function summarizeRows(rows: DirectorReportRow[]): DirectorReportSummary {
  const summary = emptySummary();

  for (const row of rows) {
    applySummary(summary, row);
  }

  return finalizeSummary(summary);
}

function compareSummaries(
  current: DirectorReportSummary,
  previous: DirectorReportSummary,
): DirectorReportComparisonRow[] {
  const metrics: Array<[
    string,
    keyof DirectorReportSummary,
    DirectorReportComparisonRow["valueType"],
  ]> = [
    ["Total Walk-ins", "totalWalkins", "number"],
    ["Leads Added", "leadsAdded", "number"],
    ["Students", "students", "number"],
    ["Applications", "applications", "number"],
    ["Visa Approved", "visaApproved", "number"],
    ["Loan Logins", "loanLogins", "number"],
    ["Loan Approved", "loanApproved", "number"],
    ["Sanctioned Amount", "sanctionedAmount", "currency"],
    ["Disbursed Amount", "disbursedAmount", "currency"],
    ["Lead to Student Conversion", "leadToStudentConversionPercentage", "percentage"],
    ["Application Conversion", "applicationConversionPercentage", "percentage"],
    ["Visa Conversion", "visaConversionPercentage", "percentage"],
    ["Loan Approval Conversion", "loanConversionPercentage", "percentage"],
  ];

  return metrics.map(([metric, key, valueType]) => {
    const currentValue = Number(current[key]);
    const previousValue = Number(previous[key]);
    const difference = round(currentValue - previousValue);

    return {
      rowId: `${String(key)}:${valueType}`,
      metric,
      current: currentValue,
      previous: previousValue,
      difference,
      changePercentage:
        previousValue > 0
          ? round((difference / previousValue) * 100)
          : currentValue > 0
            ? 100
            : 0,
      valueType,
    };
  });
}

function collection(): RowCollection {
  return {
    rows: new Map<string, MutableRow>(),
    details: [],
  };
}

function hasApplicationFilters(filters: DirectorReportFilters): boolean {
  return Boolean(filters.universityId || filters.applicationStatus);
}

function hasStudentOnlyFilters(filters: DirectorReportFilters): boolean {
  return Boolean(
    filters.universityId ||
      filters.applicationStatus ||
      filters.casStatus ||
      filters.visaStatus ||
      filters.loanStatus ||
      filters.nbfc ||
      filters.fintechAssigneeId,
  );
}

function shouldIncludeLeads(filters: DirectorReportFilters): boolean {
  return (
    filters.recordScope !== "students" &&
    filters.leadStatus !== "converted" &&
    !hasStudentOnlyFilters(filters)
  );
}

function shouldIncludeStudents(filters: DirectorReportFilters): boolean {
  return filters.recordScope !== "leads";
}

function buildLeadWhere(
  filters: DirectorReportFilters,
  range: DateRange,
  intake: IntakeLookup | null,
  country: CountryLookup | null,
): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [
    {
      leadType: STUDY_ABROAD_LEAD_TYPE as Prisma.LeadWhereInput["leadType"],
      isConverted: false,
      student: { is: null },
      createdAt: range,
    },
  ];

  if (filters.branchId) and.push({ branchId: filters.branchId });
  if (filters.leadStatus) and.push({ status: filters.leadStatus as Prisma.LeadWhereInput["status"] });
  if (filters.source) and.push({ source: { equals: filters.source, mode: "insensitive" } });
  if (intake) and.push({ preferredIntake: { equals: intake.name, mode: "insensitive" } });
  if (country) and.push({ preferredCountry: { equals: country.name, mode: "insensitive" } });

  if (filters.search) {
    and.push({
      OR: [
        { leadNumber: { contains: filters.search, mode: "insensitive" } },
        { studentName: { contains: filters.search, mode: "insensitive" } },
        { mobileNumber: { contains: filters.search, mode: "insensitive" } },
        { emailId: { contains: filters.search, mode: "insensitive" } },
        { source: { contains: filters.search, mode: "insensitive" } },
        { preferredCountry: { contains: filters.search, mode: "insensitive" } },
        { preferredCourse: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (filters.counselorId) {
    and.push({
      OR: [
        { createdById: filters.counselorId },
        { convertedById: filters.counselorId },
        { counselors: { some: { counselorId: filters.counselorId } } },
      ],
    });
  }

  return { AND: and };
}

function buildApplicationRelationWhere(
  filters: DirectorReportFilters,
): Prisma.StudentApplicationWhereInput {
  return {
    ...(filters.countryId && { countryId: filters.countryId }),
    ...(filters.intakeId && { intakeId: filters.intakeId }),
    ...(filters.universityId && { universityId: filters.universityId }),
    ...(filters.applicationStatus && {
      status: filters.applicationStatus as Prisma.StudentApplicationWhereInput["status"],
    }),
  };
}

function buildVisaWhere(
  filters: DirectorReportFilters,
): Prisma.StudentVisaProfileWhereInput {
  return {
    ...(filters.casStatus && {
      casStatus:
        filters.casStatus as Prisma.StudentVisaProfileWhereInput["casStatus"],
    }),
    ...(filters.visaStatus && {
      visaStatus:
        filters.visaStatus as Prisma.StudentVisaProfileWhereInput["visaStatus"],
    }),
  };
}

function buildLoanProfileWhere(
  filters: DirectorReportFilters,
): Prisma.StudentLoanProfileWhereInput {
  return {
    ...(filters.loanStatus && {
      loanStatus: { equals: filters.loanStatus, mode: "insensitive" },
    }),
    ...(filters.nbfc && {
      nbfc: { equals: filters.nbfc, mode: "insensitive" },
    }),
    ...(filters.fintechAssigneeId && {
      fintechAssigneeId: filters.fintechAssigneeId,
    }),
  };
}

function buildLinkedLoanWhere(
  filters: DirectorReportFilters,
): Prisma.LoanApplicationWhereInput {
  return {
    ...(filters.loanStatus && {
      loanStatus: { equals: filters.loanStatus, mode: "insensitive" },
    }),
    ...(filters.fintechAssigneeId && {
      fintechAssigneeId: filters.fintechAssigneeId,
    }),
  };
}

function buildStudentLoanFilter(
  filters: DirectorReportFilters,
): Prisma.StudentWhereInput | null {
  const loanProfileWhere = buildLoanProfileWhere(filters);
  const linkedLoanWhere = buildLinkedLoanWhere(filters);
  const alternatives: Prisma.StudentWhereInput[] = [];

  if (Object.keys(loanProfileWhere).length > 0) {
    alternatives.push({ loanProfile: { is: loanProfileWhere } });
  }

  if (
    !filters.nbfc &&
    Object.keys(linkedLoanWhere).length > 0
  ) {
    alternatives.push({
      lead: {
        is: {
          loanApplication: { is: linkedLoanWhere },
        },
      },
    });
  }

  return alternatives.length > 0 ? { OR: alternatives } : null;
}

function buildStudentWhere(
  filters: DirectorReportFilters,
  range: DateRange,
  intake: IntakeLookup | null,
  country: CountryLookup | null,
): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [
    {
      OR: [
        { lead: { is: { convertedAt: range } } },
        {
          AND: [
            { lead: { is: { convertedAt: null } } },
            { createdAt: range },
          ],
        },
      ],
    },
  ];
  const applicationWhere = buildApplicationRelationWhere(filters);
  const visaWhere = buildVisaWhere(filters);
  const studentLoanFilter = buildStudentLoanFilter(filters);

  if (filters.branchId) and.push({ branchId: filters.branchId });
  if (filters.source) and.push({ lead: { is: { source: { equals: filters.source, mode: "insensitive" } } } });
  if (filters.leadStatus) and.push({ lead: { is: { status: filters.leadStatus as Prisma.LeadWhereInput["status"] } } });

  if (intake) {
    and.push({
      OR: [
        { lead: { is: { preferredIntake: { equals: intake.name, mode: "insensitive" } } } },
        { applications: { some: { intakeId: intake.id } } },
      ],
    });
  }

  if (country) {
    and.push({
      OR: [
        { lead: { is: { preferredCountry: { equals: country.name, mode: "insensitive" } } } },
        { applications: { some: { countryId: country.id } } },
      ],
    });
  }

  if (hasApplicationFilters(filters)) {
    and.push({ applications: { some: applicationWhere } });
  }

  if (Object.keys(visaWhere).length > 0) {
    and.push({ visaProfile: { is: visaWhere } });
  }

  if (studentLoanFilter) {
    and.push(studentLoanFilter);
  }

  if (filters.search) {
    and.push({
      OR: [
        { studentName: { contains: filters.search, mode: "insensitive" } },
        { mobileNumber: { contains: filters.search, mode: "insensitive" } },
        { emailId: { contains: filters.search, mode: "insensitive" } },
        { lead: { is: { leadNumber: { contains: filters.search, mode: "insensitive" } } } },
        { lead: { is: { preferredCountry: { contains: filters.search, mode: "insensitive" } } } },
        { applications: { some: { universityName: { contains: filters.search, mode: "insensitive" } } } },
        { applications: { some: { courseName: { contains: filters.search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.counselorId) {
    and.push({
      OR: [
        { counselorId: filters.counselorId },
        { lead: { is: { createdById: filters.counselorId } } },
        { lead: { is: { convertedById: filters.counselorId } } },
        { lead: { is: { counselors: { some: { counselorId: filters.counselorId } } } } },
        { loanProfile: { is: { fintechAssigneeId: filters.counselorId } } },
        {
          lead: {
            is: {
              loanApplication: {
                is: { fintechAssigneeId: filters.counselorId },
              },
            },
          },
        },
      ],
    });
  }

  return { AND: and };
}

function buildApplicationWhere(
  filters: DirectorReportFilters,
  range: DateRange,
): Prisma.StudentApplicationWhereInput {
  const and: Prisma.StudentApplicationWhereInput[] = [
    {
      OR: [
        { applicationDate: range },
        { applicationDate: null, createdAt: range },
      ],
    },
    buildApplicationRelationWhere(filters),
  ];
  const visaWhere = buildVisaWhere(filters);
  const loanProfileWhere = buildLoanProfileWhere(filters);
  const linkedLoanWhere = buildLinkedLoanWhere(filters);

  if (filters.branchId) and.push({ student: { is: { branchId: filters.branchId } } });
  if (filters.source) and.push({ student: { is: { lead: { is: { source: { equals: filters.source, mode: "insensitive" } } } } } });
  if (filters.leadStatus) and.push({ student: { is: { lead: { is: { status: filters.leadStatus as Prisma.LeadWhereInput["status"] } } } } });
  if (Object.keys(visaWhere).length > 0) {
    and.push({ student: { is: { visaProfile: { is: visaWhere } } } });
  }

  if (Object.keys(loanProfileWhere).length > 0 || Object.keys(linkedLoanWhere).length > 0) {
    const loanAlternatives: Prisma.StudentWhereInput[] = [];

    if (Object.keys(loanProfileWhere).length > 0) {
      loanAlternatives.push({ loanProfile: { is: loanProfileWhere } });
    }

    if (!filters.nbfc && Object.keys(linkedLoanWhere).length > 0) {
      loanAlternatives.push({
        lead: { is: { loanApplication: { is: linkedLoanWhere } } },
      });
    }

    if (loanAlternatives.length > 0) {
      and.push({ student: { is: { OR: loanAlternatives } } });
    }
  }

  if (filters.search) {
    and.push({
      OR: [
        { student: { is: { studentName: { contains: filters.search, mode: "insensitive" } } } },
        { student: { is: { mobileNumber: { contains: filters.search, mode: "insensitive" } } } },
        { student: { is: { emailId: { contains: filters.search, mode: "insensitive" } } } },
        { student: { is: { lead: { is: { leadNumber: { contains: filters.search, mode: "insensitive" } } } } } },
        { universityName: { contains: filters.search, mode: "insensitive" } },
        { courseName: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (filters.counselorId) {
    and.push({
      student: {
        is: {
          OR: [
            { counselorId: filters.counselorId },
            { lead: { is: { createdById: filters.counselorId } } },
            { lead: { is: { convertedById: filters.counselorId } } },
            { lead: { is: { counselors: { some: { counselorId: filters.counselorId } } } } },
            { loanProfile: { is: { fintechAssigneeId: filters.counselorId } } },
            {
              lead: {
                is: {
                  loanApplication: {
                    is: { fintechAssigneeId: filters.counselorId },
                  },
                },
              },
            },
          ],
        },
      },
    });
  }

  return { AND: and };
}

async function getTargets(filters: DirectorReportFilters) {
  return db.counsellorIntakeTarget.findMany({
    where: {
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.counselorId && { counsellorId: filters.counselorId }),
      ...(filters.intakeId && { intakeId: filters.intakeId }),
    },
    select: {
      target: true,
      branchId: true,
      counsellorId: true,
      intakeId: true,
      branch: {
        select: { id: true, name: true },
      },
      counsellor: {
        select: { id: true, name: true },
      },
      intake: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { branch: { name: "asc" } },
      { counsellor: { name: "asc" } },
      { intake: { name: "asc" } },
    ],
  });
}

async function getLookups(filters: DirectorReportFilters): Promise<{
  intake: IntakeLookup | null;
  country: CountryLookup | null;
}> {
  const [intake, country] = await Promise.all([
    filters.intakeId
      ? db.intake.findUnique({
          where: { id: filters.intakeId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
    filters.countryId
      ? db.country.findUnique({
          where: { id: filters.countryId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  return { intake, country };
}

async function getFilterOptions(): Promise<DirectorReportFilterOptions> {
  const [
    branches,
    users,
    countries,
    intakes,
    universities,
    applicationStatuses,
    visaProfiles,
    loanProfiles,
    profileFintechUsers,
    loanApplicationStatuses,
    loanApplicationFintechUsers,
    leadSourcesMaster,
    leadSourcesUsed,
  ] = await Promise.all([
    db.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        branches: { select: { id: true } },
        role: { select: { name: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
    db.country.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.intake.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.university.findMany({
      select: { id: true, name: true, countryId: true },
      orderBy: { name: "asc" },
    }),
    db.studentApplication.findMany({
      distinct: ["status"],
      select: { status: true },
      orderBy: { status: "asc" },
    }),
    db.studentVisaProfile.findMany({
      select: { casStatus: true, visaStatus: true },
    }),
    db.studentLoanProfile.findMany({
      select: { loanStatus: true, nbfc: true },
    }),
    db.studentLoanProfile.findMany({
      where: { fintechAssigneeId: { not: null } },
      distinct: ["fintechAssigneeId"],
      select: {
        fintechAssignee: { select: { id: true, name: true } },
      },
    }),
    db.loanApplication.findMany({
      distinct: ["loanStatus"],
      select: { loanStatus: true },
      orderBy: { loanStatus: "asc" },
    }),
    db.loanApplication.findMany({
      where: { fintechAssigneeId: { not: null } },
      distinct: ["fintechAssigneeId"],
      select: {
        fintechAssignee: { select: { id: true, name: true } },
      },
    }),
    db.leadSource.findMany({
      where: { status: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    db.lead.findMany({
      where: { source: { not: null } },
      distinct: ["source"],
      select: { source: true },
    }),
  ]);

  const uniqueSorted = (values: Array<string | null | undefined>) =>
    Array.from(
      new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
    ).sort((a, b) => a.localeCompare(b));

  const fintechAssignees = Array.from(
    new Map(
      [...profileFintechUsers, ...loanApplicationFintechUsers]
        .map((item) => item.fintechAssignee)
        .filter(
          (item): item is { id: string; name: string } => Boolean(item),
        )
        .map((item) => [item.id, item] as const),
    ).values(),
  )
    .map((item) => ({ value: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    branches: branches.map((item) => ({ value: item.id, label: item.name })),
    users: users.map((item) => ({
      value: item.id,
      label: item.name,
      roleName: item.role?.name ?? "User",
      branchIds: item.branches.map((branch) => branch.id),
    })),
    countries: countries.map((item) => ({ value: item.id, label: item.name })),
    intakes: intakes.map((item) => ({ value: item.id, label: item.name })),
    universities: universities.map((item) => ({
      value: item.id,
      label: item.name,
      countryId: item.countryId,
    })),
    fintechAssignees,
    leadStatuses: ["draft", "new", "contacted", "qualified", "converted", "lost"],
    sources: uniqueSorted([
      ...leadSourcesMaster.map((item) => item.name),
      ...leadSourcesUsed.map((item) => item.source),
    ]),
    applicationStatuses: applicationStatuses.map((item) => String(item.status)),
    casStatuses: uniqueSorted(
      visaProfiles.map((item) => String(item.casStatus ?? "")),
    ),
    visaStatuses: uniqueSorted(
      visaProfiles.map((item) => String(item.visaStatus ?? "")),
    ),
    loanStatuses: uniqueSorted([
      ...loanProfiles.map((item) => item.loanStatus),
      ...loanApplicationStatuses.map((item) => item.loanStatus),
    ]),
    nbfcs: uniqueSorted(loanProfiles.map((item) => item.nbfc)),
  };
}

function buildUserDirectory(
  options: DirectorReportFilterOptions,
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
): UserDirectory {
  const users: UserDirectory = new Map(options.users.map((user) => [user.value, user.label]));

  for (const lead of leads) {
    if (lead.createdById) {
      users.set(
        lead.createdById,
        lead.createdBy?.name ?? users.get(lead.createdById) ?? "Created User",
      );
    }

    if (lead.convertedById) {
      users.set(
        lead.convertedById,
        lead.convertedBy?.name ??
          users.get(lead.convertedById) ??
          "Converted User",
      );
    }

    for (const assignment of lead.counselors) {
      users.set(assignment.counselorId, assignment.counselor?.name ?? users.get(assignment.counselorId) ?? "Assigned User");
    }
  }

  for (const student of students) {
    if (student.lead.createdById) {
      users.set(
        student.lead.createdById,
        student.lead.createdBy?.name ??
          users.get(student.lead.createdById) ??
          "Created User",
      );
    }

    if (student.lead.convertedById) {
      users.set(
        student.lead.convertedById,
        student.lead.convertedBy?.name ??
          users.get(student.lead.convertedById) ??
          "Converted User",
      );
    }

    if (student.lead.convertedById) {
      users.set(
        student.lead.convertedById,
        student.lead.convertedBy?.name ??
          users.get(student.lead.convertedById) ??
          "Converted User",
      );
    }

    if (student.counselorId) {
      users.set(student.counselorId, student.counselor?.name ?? users.get(student.counselorId) ?? "Student Counsellor");
    }

    for (const assignment of student.lead.counselors) {
      users.set(assignment.counselorId, assignment.counselor?.name ?? users.get(assignment.counselorId) ?? "Assigned User");
    }
  }

  for (const application of applications) {
    const student = application.student;

    if (student.lead.createdById) {
      users.set(
        student.lead.createdById,
        student.lead.createdBy?.name ??
          users.get(student.lead.createdById) ??
          "Created User",
      );
    }

    if (student.counselorId) {
      users.set(student.counselorId, student.counselor?.name ?? users.get(student.counselorId) ?? "Student Counsellor");
    }

    for (const assignment of student.lead.counselors) {
      users.set(assignment.counselorId, assignment.counselor?.name ?? users.get(assignment.counselorId) ?? "Assigned User");
    }
  }

  return users;
}

function buildPeriodRows(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  targets: Awaited<ReturnType<typeof getTargets>>,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  weeksForAverage = 1,
) {
  const current = collection();

  for (const lead of leads) {
    addLeadToCollection(current, lead, range, periodKey, periodLabel, users, filters, intake);
  }

  for (const student of students) {
    addStudentToCollection(current, student, range, periodKey, periodLabel, users, filters, intake);
  }

  for (const application of applications) {
    addApplicationToCollection(current, application, range, periodKey, periodLabel, users, filters, intake);
  }

  addTargetsToCollection(current, periodKey, periodLabel, targets, filters);

  return {
    rows: finalizeRows(current, weeksForAverage),
    details: current.details,
  };
}

function buildDailyRows(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  weekStart: Date,
) {
  const current = collection();

  for (let index = 0; index < 7; index += 1) {
    const day = addDays(weekStart, index);
    const range = { gte: day, lt: addDays(day, 1) };
    const key = dateKey(day);
    const label = dateLabel(day);

    for (const lead of leads) {
      addLeadToCollection(current, lead, range, key, label, users, filters, intake);
    }

    for (const student of students) {
      addStudentToCollection(current, student, range, key, label, users, filters, intake);
    }

    for (const application of applications) {
      addApplicationToCollection(current, application, range, key, label, users, filters, intake);
    }
  }

  return finalizeRows(current, 1);
}

function buildIntakeRows(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  targets: Awaited<ReturnType<typeof getTargets>>,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  intakeDirectory: IntakeDirectory,
  range: DateRange,
) {
  const current = collection();

  for (const lead of leads) {
    if (!inRange(lead.createdAt, range) || !leadMatchesIntake(lead, intake)) {
      continue;
    }

    const itemIntake = getLeadIntake(lead, intake, intakeDirectory);
    const usersForLead = getFinalLeadOwner(lead, users, filters);

    for (const user of usersForLead) {
      const row = getRow(
        current,
        itemIntake?.id ?? "not-set",
        itemIntake?.name ?? "Not Set",
        lead.branchId,
        lead.branch?.name ?? "Not Assigned",
        user.userId,
        user.userName,
        itemIntake,
      );

      row.totalWalkins += 1;
      row.allLeads += 1;
      row.leadsAdded += 1;
      row.activeLeads += isActiveLead(String(lead.status ?? "")) ? 1 : 0;
      row.qualifiedLeads += isQualifiedLead(String(lead.status ?? "")) ? 1 : 0;
      row.lostLeads += isLostLead(String(lead.status ?? "")) ? 1 : 0;
      pushLeadNumber(row, lead.leadNumber);
    }
  }

  for (const student of students) {
    if (!inRange(studentLifecycleDate(student), range) || !studentMatchesIntake(student, intake)) {
      continue;
    }

    const itemIntake = getStudentIntake(student, intake, intakeDirectory);
    const visaProfile = student.visaProfile;
    const loan = getStudentLoanMetrics(student);
    const studentOwners = getFinalStudentOwner(student, users, filters);

    for (const user of studentOwners) {
      const row = getRow(
        current,
        itemIntake?.id ?? "not-set",
        itemIntake?.name ?? "Not Set",
        student.branchId,
        student.branch?.name ?? "Not Assigned",
        user.userId,
        user.userName,
        itemIntake,
      );

      row.totalWalkins += 1;
      row.students += 1;
      row.achieved += 1;
      row.droppedStudents += isDroppedStudent(String(student.status ?? "")) ? 1 : 0;
      row.casReceived += isCasReceived(String(visaProfile?.casStatus ?? "")) ? 1 : 0;
      row.visaApproved += isVisaApproved(String(visaProfile?.visaStatus ?? "")) ? 1 : 0;
      pushLeadNumber(row, student.lead.leadNumber);
    }

    if (hasLoanActivity(loan)) {
      for (const user of getFinalLoanOwner(student, users, filters)) {
        const row = getRow(
          current,
          itemIntake?.id ?? "not-set",
          itemIntake?.name ?? "Not Set",
          student.branchId,
          student.branch?.name ?? "Not Assigned",
          user.userId,
          user.userName,
          itemIntake,
        );

        applyLoanMetrics(row, loan);
        pushLeadNumber(row, student.lead.leadNumber);
      }
    }
  }

  for (const application of applications) {
    addApplicationToCollection(
      current,
      application,
      range,
      application.intakeId ?? "not-set",
      application.intakeName ?? application.intake?.name ?? "Not Set",
      users,
      filters,
      intake,
      true,
    );
  }

  addTargetsToCollection(current, "", "", targets, filters, true);

  return finalizeRows(current, 1);
}


const BRANCH_TOTAL_USER_ID = "__branch_total__";
const GRAND_TOTAL_USER_ID = "__grand_total__";

function getBranchTotalRow(
  target: RowCollection,
  periodKey: string,
  periodLabel: string,
  branchId: string,
  branchName: string,
  intake?: IntakeLookup | null,
): MutableRow {
  return getRow(
    target,
    periodKey,
    periodLabel,
    branchId,
    branchName,
    BRANCH_TOTAL_USER_ID,
    "Branch Total",
    intake,
  );
}

function addLeadToBranchTotals(
  target: RowCollection,
  lead: DirectorLeadRecord,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  groupedIntake?: IntakeLookup | null,
) {
  if (!inRange(lead.createdAt, range) || !leadMatchesIntake(lead, intake)) {
    return;
  }

  if (filters.counselorId && getFinalLeadOwner(lead, users, filters).length === 0) {
    return;
  }

  const row = getBranchTotalRow(
    target,
    groupedIntake?.id ?? periodKey,
    groupedIntake?.name ?? periodLabel,
    lead.branchId,
    lead.branch?.name ?? "Not Assigned",
    groupedIntake,
  );

  row.totalWalkins += 1;
  row.leadsAdded += 1;
  row.allLeads += 1;
  row.activeLeads += isActiveLead(String(lead.status ?? "")) ? 1 : 0;
  row.qualifiedLeads += isQualifiedLead(String(lead.status ?? "")) ? 1 : 0;
  row.lostLeads += isLostLead(String(lead.status ?? "")) ? 1 : 0;
  pushLeadNumber(row, lead.leadNumber);
}

function addStudentToBranchTotals(
  target: RowCollection,
  student: DirectorStudentRecord,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  groupedIntake?: IntakeLookup | null,
) {
  if (!inRange(studentLifecycleDate(student), range) || !studentMatchesIntake(student, intake)) {
    return;
  }

  const includeStudentMetrics =
    !filters.counselorId ||
    getFinalStudentOwner(student, users, filters).length > 0;
  const includeLoanMetrics =
    !filters.counselorId ||
    getFinalLoanOwner(student, users, filters).length > 0;

  if (!includeStudentMetrics && !includeLoanMetrics) {
    return;
  }

  const visaProfile = student.visaProfile;
  const loan = getStudentLoanMetrics(student);
  const row = getBranchTotalRow(
    target,
    groupedIntake?.id ?? periodKey,
    groupedIntake?.name ?? periodLabel,
    student.branchId,
    student.branch?.name ?? "Not Assigned",
    groupedIntake,
  );

  if (includeStudentMetrics) {
    row.totalWalkins += 1;
    row.students += 1;
    row.achieved += 1;
    row.droppedStudents += isDroppedStudent(String(student.status ?? "")) ? 1 : 0;
    row.casReceived += isCasReceived(String(visaProfile?.casStatus ?? "")) ? 1 : 0;
    row.visaApproved += isVisaApproved(String(visaProfile?.visaStatus ?? "")) ? 1 : 0;
  }

  if (includeLoanMetrics && hasLoanActivity(loan)) {
    applyLoanMetrics(row, loan);
  }

  pushLeadNumber(row, student.lead.leadNumber);
}

function addApplicationToBranchTotals(
  target: RowCollection,
  application: DirectorApplicationRecord,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  groupedIntake?: IntakeLookup | null,
) {
  const applicationDate = application.applicationDate ?? application.createdAt;

  if (!inRange(applicationDate, range)) {
    return;
  }

  if (
    intake &&
    application.intakeId !== intake.id &&
    normalizeStatus(application.intakeName ?? application.intake?.name) !==
      normalizeStatus(intake.name)
  ) {
    return;
  }

  const student = application.student;

  if (
    filters.counselorId &&
    getFinalStudentOwner(student, users, filters).length === 0
  ) {
    return;
  }

  const row = getBranchTotalRow(
    target,
    groupedIntake?.id ?? periodKey,
    groupedIntake?.name ?? periodLabel,
    student.branchId,
    student.branch?.name ?? "Not Assigned",
    groupedIntake,
  );

  row.applications += 1;
  row.offers += isOfferStatus(String(application.offerStatus ?? "")) ? 1 : 0;
  pushLeadNumber(row, student.lead.leadNumber);
}

function addTargetsToBranchTotals(
  target: RowCollection,
  periodKey: string,
  periodLabel: string,
  targets: Awaited<ReturnType<typeof getTargets>>,
  filters: DirectorReportFilters,
  groupByIntake = false,
) {
  for (const item of targets) {
    if (filters.branchId && item.branchId !== filters.branchId) continue;
    if (filters.counselorId && item.counsellorId !== filters.counselorId) continue;
    if (filters.intakeId && item.intakeId !== filters.intakeId) continue;

    const groupedIntake = groupByIntake
      ? { id: item.intake.id, name: item.intake.name }
      : null;
    const row = getBranchTotalRow(
      target,
      groupedIntake?.id ?? periodKey,
      groupedIntake?.name ?? periodLabel,
      item.branch.id,
      item.branch.name,
      groupedIntake,
    );

    row.target += item.target;
  }
}

function createGrandTotalRow(
  rows: DirectorReportRow[],
  rowId: string,
  periodLabel: string,
): DirectorReportRow {
  const summary = summarizeRows(rows);
  const leadNumbers = Array.from(
    new Set(rows.flatMap((row) => row.leadNumbers)),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return {
    rowId,
    periodKey: GRAND_TOTAL_USER_ID,
    periodLabel,
    branchId: GRAND_TOTAL_USER_ID,
    branchName: "Grand Total",
    counselorId: GRAND_TOTAL_USER_ID,
    counselorName: "Grand Total",
    intakeId: null,
    intakeName: null,
    ...summary,
    leadNumbers,
    avgWeeklyWalkins: round(
      rows.reduce((total, row) => total + row.avgWeeklyWalkins, 0),
    ),
    avgWeeklyApplications: round(
      rows.reduce((total, row) => total + row.avgWeeklyApplications, 0),
    ),
    avgWeeklyLoanLogins: round(
      rows.reduce((total, row) => total + row.avgWeeklyLoanLogins, 0),
    ),
    avgWeeklyLoanApproved: round(
      rows.reduce((total, row) => total + row.avgWeeklyLoanApproved, 0),
    ),
    avgWeeklyLoanSanctioned: round(
      rows.reduce((total, row) => total + row.avgWeeklyLoanSanctioned, 0),
    ),
    avgWeeklyVisaApproved: round(
      rows.reduce((total, row) => total + row.avgWeeklyVisaApproved, 0),
    ),
  };
}

function tableTotals(
  branchRows: DirectorReportRow[],
  rowId: string,
  periodLabel: string,
): DirectorReportTableTotals {
  return {
    branchRows,
    grandTotal: createGrandTotalRow(branchRows, rowId, periodLabel),
  };
}

function buildBranchPeriodTotals(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  targets: Awaited<ReturnType<typeof getTargets>>,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  range: DateRange,
  periodKey: string,
  periodLabel: string,
  weeksForAverage = 1,
): DirectorReportTableTotals {
  const target = collection();

  for (const lead of leads) {
    addLeadToBranchTotals(target, lead, range, periodKey, periodLabel, users, filters, intake);
  }

  for (const student of students) {
    addStudentToBranchTotals(target, student, range, periodKey, periodLabel, users, filters, intake);
  }

  for (const application of applications) {
    addApplicationToBranchTotals(
      target,
      application,
      range,
      periodKey,
      periodLabel,
      users,
      filters,
      intake,
    );
  }

  addTargetsToBranchTotals(target, periodKey, periodLabel, targets, filters);
  const branchRows = finalizeRows(target, weeksForAverage);

  return tableTotals(branchRows, `grand:${periodKey}`, periodLabel);
}

function buildBranchDailyTotals(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  weekStart: Date,
): DirectorReportTableTotals {
  const target = collection();

  for (let index = 0; index < 7; index += 1) {
    const day = addDays(weekStart, index);
    const range = { gte: day, lt: addDays(day, 1) };
    const periodKey = dateKey(day);
    const periodLabel = dateLabel(day);

    for (const lead of leads) {
      addLeadToBranchTotals(
        target,
        lead,
        range,
        periodKey,
        periodLabel,
        users,
        filters,
        intake,
      );
    }

    for (const student of students) {
      addStudentToBranchTotals(
        target,
        student,
        range,
        periodKey,
        periodLabel,
        users,
        filters,
        intake,
      );
    }

    for (const application of applications) {
      addApplicationToBranchTotals(
        target,
        application,
        range,
        periodKey,
        periodLabel,
        users,
        filters,
        intake,
      );
    }
  }

  const branchRows = finalizeRows(target, 1);
  return tableTotals(branchRows, "grand:current-week", "Current Week");
}

function buildBranchIntakeTotals(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  targets: Awaited<ReturnType<typeof getTargets>>,
  users: UserDirectory,
  filters: DirectorReportFilters,
  intake: IntakeLookup | null,
  intakeDirectory: IntakeDirectory,
  range: DateRange,
): DirectorReportTableTotals {
  const target = collection();

  for (const lead of leads) {
    const groupedIntake = getLeadIntake(lead, intake, intakeDirectory);
    addLeadToBranchTotals(
      target,
      lead,
      range,
      groupedIntake?.id ?? "not-set",
      groupedIntake?.name ?? "Not Set",
      users,
      filters,
      intake,
      groupedIntake,
    );
  }

  for (const student of students) {
    const groupedIntake = getStudentIntake(student, intake, intakeDirectory);
    addStudentToBranchTotals(
      target,
      student,
      range,
      groupedIntake?.id ?? "not-set",
      groupedIntake?.name ?? "Not Set",
      users,
      filters,
      intake,
      groupedIntake,
    );
  }

  for (const application of applications) {
    const groupedIntake = getApplicationIntake(application, intake);
    addApplicationToBranchTotals(
      target,
      application,
      range,
      groupedIntake?.id ?? "not-set",
      groupedIntake?.name ?? "Not Set",
      users,
      filters,
      intake,
      groupedIntake,
    );
  }

  addTargetsToBranchTotals(target, "", "", targets, filters, true);
  const branchRows = finalizeRows(target, 1);

  return tableTotals(branchRows, "grand:intake-wise", "All Intakes");
}

function buildIntakeComparison(
  rows: DirectorReportRow[],
): DirectorReportIntakeComparisonRow[] {
  const grouped = new Map<
    string,
    {
      intakeId: string;
      intakeName: string;
      totalWalkins: number;
      students: number;
      applications: number;
      visaApproved: number;
      loanLogins: number;
      loanApproved: number;
      loanSanctioned: number;
    }
  >();

  for (const row of rows) {
    const intakeId = row.intakeId ?? "not-set";
    const intakeName = row.intakeName?.trim() || "Not Set";
    const current = grouped.get(intakeId) ?? {
      intakeId,
      intakeName,
      totalWalkins: 0,
      students: 0,
      applications: 0,
      visaApproved: 0,
      loanLogins: 0,
      loanApproved: 0,
      loanSanctioned: 0,
    };

    current.totalWalkins += row.totalWalkins;
    current.students += row.students;
    current.applications += row.applications;
    current.visaApproved += row.visaApproved;
    current.loanLogins += row.loanLogins;
    current.loanApproved += row.loanApproved;
    current.loanSanctioned += row.loanSanctioned;
    grouped.set(intakeId, current);
  }

  return Array.from(grouped.values())
    .map((item) => ({
      rowId: `intake:${item.intakeId}`,
      ...item,
      leadConversionPercentage: percentage(item.students, item.totalWalkins),
      applicationConversionPercentage: percentage(
        item.applications,
        item.students,
      ),
      visaConversionPercentage: percentage(item.visaApproved, item.students),
      loanConversionPercentage: percentage(
        item.loanApproved,
        item.loanLogins,
      ),
    }))
    .sort(
      (a, b) =>
        b.totalWalkins - a.totalWalkins ||
        a.intakeName.localeCompare(b.intakeName),
    );
}


function getEarliestActivityDate(
  leads: DirectorLeadRecord[],
  students: DirectorStudentRecord[],
  applications: DirectorApplicationRecord[],
  fallback: Date,
): Date {
  const timestamps = [
    ...leads.map((lead) => lead.createdAt.getTime()),
    ...students.map((student) => studentLifecycleDate(student).getTime()),
    ...applications.map((application) =>
      (application.applicationDate ?? application.createdAt).getTime(),
    ),
  ].filter((timestamp) => Number.isFinite(timestamp));

  return timestamps.length > 0
    ? new Date(Math.min(...timestamps))
    : addDays(fallback, -6);
}

function normalizeFilters(searchParams: URLSearchParams): DirectorReportFilters {
  const datePreset = clean(searchParams.get("datePreset"));
  const recordScope = clean(searchParams.get("recordScope"));
  const allowedDatePresets: DirectorReportFilters["datePreset"][] = [
    "all",
    "today",
    "yesterday",
    "last_7_days",
    "last_30_days",
    "this_week",
    "last_week",
    "this_month",
    "last_month",
    "this_quarter",
    "last_quarter",
    "this_year",
    "custom",
  ];

  return {
    search: clean(searchParams.get("search")),
    recordScope: ["all", "leads", "students"].includes(recordScope)
      ? (recordScope as DirectorReportFilters["recordScope"])
      : "all",
    branchId: clean(searchParams.get("branchId")),
    counselorId: clean(searchParams.get("counselorId")),
    leadStatus: clean(searchParams.get("leadStatus")),
    source: clean(searchParams.get("source")),
    countryId: clean(searchParams.get("countryId")),
    intakeId: clean(searchParams.get("intakeId")),
    universityId: clean(searchParams.get("universityId")),
    applicationStatus: clean(searchParams.get("applicationStatus")),
    casStatus: clean(searchParams.get("casStatus")),
    visaStatus: clean(searchParams.get("visaStatus")),
    loanStatus: clean(searchParams.get("loanStatus")),
    nbfc: clean(searchParams.get("nbfc")),
    fintechAssigneeId: clean(searchParams.get("fintechAssigneeId")),
    datePreset: allowedDatePresets.includes(datePreset as DirectorReportFilters["datePreset"])
      ? (datePreset as DirectorReportFilters["datePreset"])
      : "this_month",
    startDate: clean(searchParams.get("startDate")),
    endDate: clean(searchParams.get("endDate")),
  };
}

export function parseDirectorReportFilters(
  searchParams: URLSearchParams,
): DirectorReportFilters {
  return normalizeFilters(searchParams);
}

export async function getDirectorReport(
  filters: DirectorReportFilters,
): Promise<DirectorReportData> {
  const ranges = getRanges();
  const primaryRange = getPrimaryRange(filters, ranges);
  const queryRange = mergeRanges(
    ranges.allRange,
    primaryRange,
    ranges.currentWeekRange,
    ranges.previousWeekRange,
    ranges.currentMonthRange,
    ranges.previousMonthRange,
  );
  const [{ intake, country }, filterOptions] = await Promise.all([
    getLookups(filters),
    getFilterOptions(),
  ]);
  const includeLeads = shouldIncludeLeads(filters);
  const includeStudents = shouldIncludeStudents(filters);

  const [leads, students, applications, targets] = await Promise.all([
    includeLeads
      ? db.lead.findMany({
          where: buildLeadWhere(filters, queryRange, intake, country),
          select: directorLeadSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as DirectorLeadRecord[]),
    includeStudents
      ? db.student.findMany({
          where: buildStudentWhere(filters, queryRange, intake, country),
          select: directorStudentSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as DirectorStudentRecord[]),
    includeStudents
      ? db.studentApplication.findMany({
          where: buildApplicationWhere(filters, queryRange),
          select: directorApplicationSelect,
          orderBy: [{ applicationDate: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([] as DirectorApplicationRecord[]),
    getTargets(filters),
  ]);

  const users = buildUserDirectory(filterOptions, leads, students, applications);
  const intakeDirectory = buildIntakeDirectory(filterOptions);
  const allTimeWeeks = Math.max(
    1,
    Math.ceil(
      (ranges.allRange.lt.getTime() - getEarliestActivityDate(
        leads,
        students,
        applications,
        ranges.allRange.lt,
      ).getTime()) / 604_800_000,
    ),
  );
  const allTime = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.allRange,
    "all-time",
    "All Time",
    allTimeWeeks,
  );
  const today = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.todayRange,
    dateKey(ranges.today),
    "Today",
  );
  const currentWeek = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.currentWeekRange,
    dateKey(ranges.currentWeekStart),
    weekLabel(ranges.currentWeekStart),
  );
  const previousWeek = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.previousWeekRange,
    dateKey(ranges.previousWeekRange.gte),
    weekLabel(ranges.previousWeekRange.gte),
  );
  const currentMonth = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.currentMonthRange,
    monthKey(ranges.currentMonthStart),
    monthLabel(ranges.currentMonthStart),
    4,
  );
  const previousMonth = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.previousMonthRange,
    monthKey(ranges.previousMonthRange.gte),
    monthLabel(ranges.previousMonthRange.gte),
    4,
  );
  const primaryPeriod = buildPeriodRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    primaryRange,
    `${filters.datePreset}:${dateKey(primaryRange.gte)}`,
    getPrimaryPeriodLabel(filters, primaryRange),
    Math.max(
      1,
      Math.ceil(
        (primaryRange.lt.getTime() - primaryRange.gte.getTime()) / 604_800_000,
      ),
    ),
  );
  const primaryWeeks = Math.max(
    1,
    Math.ceil(
      (primaryRange.lt.getTime() - primaryRange.gte.getTime()) / 604_800_000,
    ),
  );
  const weeklyRows = buildDailyRows(
    leads,
    students,
    applications,
    users,
    filters,
    intake,
    ranges.currentWeekStart,
  );
  const intakeWiseRows = buildIntakeRows(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    intakeDirectory,
    primaryRange,
  );
  const allTimeTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.allRange,
    "all-time",
    "All Time",
    allTimeWeeks,
  );
  const todayTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.todayRange,
    dateKey(ranges.today),
    "Today",
  );
  const weeklyTotals = buildBranchDailyTotals(
    leads,
    students,
    applications,
    users,
    filters,
    intake,
    ranges.currentWeekStart,
  );
  const currentWeekTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.currentWeekRange,
    dateKey(ranges.currentWeekStart),
    weekLabel(ranges.currentWeekStart),
  );
  const previousWeekTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.previousWeekRange,
    dateKey(ranges.previousWeekRange.gte),
    weekLabel(ranges.previousWeekRange.gte),
  );
  const currentMonthTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.currentMonthRange,
    monthKey(ranges.currentMonthStart),
    monthLabel(ranges.currentMonthStart),
    4,
  );
  const previousMonthTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    ranges.previousMonthRange,
    monthKey(ranges.previousMonthRange.gte),
    monthLabel(ranges.previousMonthRange.gte),
    4,
  );
  const primaryTotals = buildBranchPeriodTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    primaryRange,
    `${filters.datePreset}:${dateKey(primaryRange.gte)}`,
    getPrimaryPeriodLabel(filters, primaryRange),
    primaryWeeks,
  );
  const intakeWiseTotals = buildBranchIntakeTotals(
    leads,
    students,
    applications,
    targets,
    users,
    filters,
    intake,
    intakeDirectory,
    primaryRange,
  );
  const weekSummary = currentWeekTotals.grandTotal;
  const previousWeekSummary = previousWeekTotals.grandTotal;
  const monthSummary = currentMonthTotals.grandTotal;
  const previousMonthSummary = previousMonthTotals.grandTotal;
  const leadDetails = [...today.details, ...primaryPeriod.details]
    .filter((detail, index, array) => array.findIndex((item) => item.rowId === detail.rowId) === index)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 250);

  return {
    generatedAt: new Date().toISOString(),
    filters,
    filterOptions,
    summary: summarizeRows(primaryTotals.branchRows),
    allTimeRows: allTime.rows,
    allTimeTotals,
    todayRows: today.rows,
    todayTotals,
    weeklyRows,
    weeklyTotals,
    currentMonthRows: currentMonth.rows,
    currentMonthTotals,
    intakeWiseRows,
    intakeWiseTotals,
    weeklyAverageRows: currentMonth.rows,
    weekComparison: compareSummaries(weekSummary, previousWeekSummary),
    monthComparison: compareSummaries(monthSummary, previousMonthSummary),
    intakeComparison: buildIntakeComparison(intakeWiseTotals.branchRows),
    leadDetails,
  };
}
