import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import type {
  PerformanceApplicationExportRow,
  PerformanceReportBranchPoint,
  PerformanceReportCountryPoint,
  PerformanceReportCounselorPoint,
  PerformanceReportData,
  PerformanceReportFilterOptions,
  PerformanceReportFilters,
  PerformanceReportMonthlyPoint,
  PerformanceReportRow,
  PerformanceReportSourcePoint,
  PerformanceReportStatusPoint,
  ReportDatePreset,
  ReportRecordScope,
} from "@/types/performance-report";

const personSelect = { id: true, name: true } as const;
const loanSnapshotSelect = {
  id: true,
  loanStatus: true,
  fintechAssignee: { select: personSelect },
  bankApplications: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { bank: { select: { name: true } } },
  },
  sanction: { select: { id: true } },
} as const;

const performanceLeadSelect = {
  id: true,
  leadNumber: true,
  studentName: true,
  mobileNumber: true,
  emailId: true,
  source: true,
  branchId: true,
  createdById: true,
  convertedById: true,
  convertedAt: true,
  preferredCountry: true,
  preferredIntake: true,
  preferredCourse: true,
  status: true,
  loanRequirement: true,
  nextFollowup: true,
  createdAt: true,
  branch: { select: { id: true, name: true } },
  createdBy: { select: personSelect },
  convertedBy: { select: personSelect },
  counselors: {
    orderBy: { assignedAt: "desc" },
    select: {
      counselorId: true,
      assignedAt: true,
      counselor: { select: personSelect },
    },
  },
  loanApplication: { select: loanSnapshotSelect },
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
  branch: { select: { id: true, name: true } },
  counselor: { select: personSelect },
  lead: {
    select: {
      id: true,
      leadNumber: true,
      source: true,
      preferredCountry: true,
      preferredIntake: true,
      preferredCourse: true,
      status: true,
      loanRequirement: true,
      createdAt: true,
      createdById: true,
      convertedById: true,
      convertedAt: true,
      nextFollowup: true,
      createdBy: { select: personSelect },
      convertedBy: { select: personSelect },
      counselors: {
        orderBy: { assignedAt: "desc" },
        select: {
          counselorId: true,
          assignedAt: true,
          counselor: { select: personSelect },
        },
      },
      loanApplication: { select: loanSnapshotSelect },
    },
  },
  visaProfile: {
    select: {
      depositStatus: true,
      ihsPaidStatus: true,
      visaPaidStatus: true,
      casStatus: true,
      visaStatus: true,
      visaDecisionDate: true,
    },
  },
  loanProfile: {
    select: {
      fintechAssigneeId: true,
      nbfc: true,
      loanStatus: true,
      pfStatus: true,
      disbursed: true,
      fintechAssignee: { select: personSelect },
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
  country: { select: { id: true, name: true } },
  university: { select: { id: true, name: true } },
  course: { select: { id: true, name: true } },
  intake: { select: { id: true, name: true } },
} satisfies Prisma.StudentApplicationSelect;

const performanceLoanSelect = {
  id: true,
  leadId: true,
  applicationId: true,
  fullName: true,
  mobile: true,
  email: true,
  branchId: true,
  counselorId: true,
  fintechAssigneeId: true,
  createdById: true,
  loanStatus: true,
  enquiryDate: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { id: true, name: true } },
  counselor: { select: personSelect },
  fintechAssignee: { select: personSelect },
  createdBy: { select: personSelect },
  sanction: { select: { id: true } },
  bankApplications: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { bank: { select: { name: true } } },
  },
  lead: {
    select: {
      createdById: true,
      convertedById: true,
      convertedAt: true,
      createdBy: { select: personSelect },
      convertedBy: { select: personSelect },
      counselors: {
        orderBy: { assignedAt: "desc" },
        select: {
          counselorId: true,
          assignedAt: true,
          counselor: { select: personSelect },
        },
      },
      student: {
        select: {
          counselorId: true,
          counselor: { select: personSelect },
        },
      },
    },
  },
} satisfies Prisma.LoanApplicationSelect;

type LeadRecord = Prisma.LeadGetPayload<{
  select: typeof performanceLeadSelect;
}>;
type StudentRecord = Prisma.StudentGetPayload<{
  select: typeof performanceStudentSelect;
}>;
type ApplicationRecord = Prisma.StudentApplicationGetPayload<{
  select: typeof performanceApplicationSelect;
}>;
type LoanRecord = Prisma.LoanApplicationGetPayload<{
  select: typeof performanceLoanSelect;
}>;
type LoanMetric = {
  id: string;
  branchId: string;
  branch: string;
  owner: Person | null;
  date: Date;
  status: string;
  approved: boolean;
};
type Person = { id: string; name: string };
type DateRange = { gte?: Date; lt?: Date };
type FilterLookup = { countryName: string; intakeName: string };
type LeadOwnerRecord = {
  createdById: string | null;
  convertedById: string | null;
  convertedAt: Date | null;
  createdBy: Person | null;
  convertedBy: Person | null;
  counselors: Array<{
    counselorId: string;
    assignedAt: Date;
    counselor: Person;
  }>;
};
type TargetStudent = {
  branchId: string;
  counselorId: string | null;
  counselor: Person | null;
  lead: LeadOwnerRecord;
};
type MetricAccumulator = {
  totalWalkins: number;
  leads: number;
  qualifiedLeads: number;
  lostLeads: number;
  students: number;
  droppedStudents: number;
  loanLogins: number;
  loanApproved: number;
  applicationConversions: number;
  visaConversions: number;
  applications: number;
  offers: number;
  casReceived: number;
  visaApproved: number;
};
type BranchAccumulator = MetricAccumulator & {
  branchId: string;
  branch: string;
};
type CounselorAccumulator = BranchAccumulator & {
  counselorId: string;
  counselor: string;
};
type PerformancePerson = {
  branchId: string;
  branch: string;
  counselorId: string;
  counselor: string;
};
type TargetMetrics = {
  totalTarget: number;
  totalAchieved: number;
  totalLeadsCreated: number;
  targetAssignments: number;
  branchTargets: ReadonlyMap<string, number>;
  branchAchievements: ReadonlyMap<string, number>;
  branchLeadsCreated: ReadonlyMap<string, number>;
  counselorTargets: ReadonlyMap<string, number>;
  counselorAchievements: ReadonlyMap<string, number>;
  counselorLeadsCreated: ReadonlyMap<string, number>;
  performancePeople: ReadonlyMap<string, PerformancePerson>;
  targetBranches: ReadonlyMap<string, string>;
};

export type PerformanceReportAccessScope =
  | { kind: "all" }
  | { kind: "branches"; branchIds: string[] }
  | { kind: "user"; userId: string; userName: string };

const ALL_ACCESS: PerformanceReportAccessScope = { kind: "all" };
const STUDY_ABROAD = "study_abroad";
const CONVERTED = "converted";
const LOST = new Set(["lost", "closed_lost", "lead_lost"]);
const DROPPED = new Set(["drop", "dropped", "student_dropped"]);
const APPROVED_LOANS = new Set([
  "approved",
  "sanctioned",
  "disbursed",
  "deposit_received",
]);

const clean = (value: string | null) => value?.trim() ?? "";
const normalize = (value: string | null | undefined) =>
  value
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_") ?? "";
const humanize = (value: string) =>
  value
    ? value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not Set";
const isLost = (value: string | null | undefined) => LOST.has(normalize(value));
const isDropped = (value: string | null | undefined) =>
  DROPPED.has(normalize(value));
const isVisaApproved = (value: string | null | undefined) =>
  ["approved", "visa_approved"].includes(normalize(value));
const isCasReceived = (value: string | null | undefined) =>
  ["received", "cas_received", "issued"].includes(normalize(value));
const isOffer = (value: string | null | undefined) => {
  const status = normalize(value);
  return (
    Boolean(status) &&
    !["none", "not_received", "pending", "rejected", "not_applicable"].includes(
      status,
    )
  );
};
const isLoanApproved = (
  loan: Pick<LoanRecord, "loanStatus" | "sanction"> | null | undefined,
) =>
  Boolean(
    loan && (APPROVED_LOANS.has(normalize(loan.loanStatus)) || loan.sanction),
  );
const metricAccumulator = (): MetricAccumulator => ({
  totalWalkins: 0,
  leads: 0,
  qualifiedLeads: 0,
  lostLeads: 0,
  students: 0,
  droppedStudents: 0,
  loanLogins: 0,
  loanApproved: 0,
  applicationConversions: 0,
  visaConversions: 0,
  applications: 0,
  offers: 0,
  casReceived: 0,
  visaApproved: 0,
});
const metricKey = (branchId: string, counselorId: string) =>
  `${branchId}:${counselorId}`;
const percentage = (value: number, total: number) =>
  total ? Number(((value / total) * 100).toFixed(1)) : 0;

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max: number,
) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
}

function indiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getDateRange(
  preset: ReportDatePreset,
  customStart: string,
  customEnd: string,
  now = new Date(),
): DateRange | null {
  const today = indiaDate(now);
  const month = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const quarter = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      Math.floor(today.getUTCMonth() / 3) * 3,
      1,
    ),
  );
  const parse = (value: string) => {
    const date = value ? new Date(`${value}T00:00:00.000Z`) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  };

  if (preset === "today") return { gte: today, lt: addDays(today, 1) };
  if (preset === "yesterday") return { gte: addDays(today, -1), lt: today };
  if (preset === "last_7_days")
    return { gte: addDays(today, -6), lt: addDays(today, 1) };
  if (preset === "last_30_days")
    return { gte: addDays(today, -29), lt: addDays(today, 1) };
  if (preset === "this_month") return { gte: month, lt: addDays(today, 1) };
  if (preset === "last_month") {
    return {
      gte: new Date(
        Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1),
      ),
      lt: month,
    };
  }
  if (preset === "this_quarter") return { gte: quarter, lt: addDays(today, 1) };
  if (preset === "last_quarter") {
    return {
      gte: new Date(
        Date.UTC(quarter.getUTCFullYear(), quarter.getUTCMonth() - 3, 1),
      ),
      lt: quarter,
    };
  }
  if (preset === "this_year") {
    return {
      gte: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)),
      lt: addDays(today, 1),
    };
  }
  if (preset !== "custom") return null;

  const first = parse(customStart);
  const second = parse(customEnd);
  if (!first && !second) return null;
  const start = first && second && first > second ? second : first;
  const end = first && second && first > second ? first : second;
  return { ...(start && { gte: start }), ...(end && { lt: addDays(end, 1) }) };
}

function currentLeadOwner(lead: LeadOwnerRecord): Person | null {
  const assignment = lead.counselors[0];
  const conversion =
    lead.convertedById && lead.convertedBy && lead.convertedAt
      ? { owner: lead.convertedBy, at: lead.convertedAt }
      : null;

  if (assignment && conversion) {
    return assignment.assignedAt > conversion.at
      ? assignment.counselor
      : conversion.owner;
  }
  return assignment?.counselor ?? conversion?.owner ?? lead.createdBy ?? null;
}

function currentStudentOwner(
  student: StudentRecord | TargetStudent,
): Person | null {
  return (
    currentLeadOwner(student.lead) ??
    (student.counselorId
      ? (student.counselor ?? { id: student.counselorId, name: "Not Assigned" })
      : null)
  );
}

function currentLoanOwner(loan: LoanRecord): Person | null {
  if (loan.lead) {
    return (
      currentLeadOwner(loan.lead) ??
      (loan.lead.student?.counselorId
        ? (loan.lead.student.counselor ?? {
            id: loan.lead.student.counselorId,
            name: "Not Assigned",
          })
        : null) ??
      loan.fintechAssignee ??
      loan.counselor ??
      loan.createdBy ??
      null
    );
  }
  return loan.fintechAssignee ?? loan.counselor ?? loan.createdBy ?? null;
}

const ownerFilterId = (
  filters: PerformanceReportFilters,
  access: PerformanceReportAccessScope,
) => (access.kind === "user" ? access.userId : filters.counselorId || null);
const belongsToOwner = (owner: Person | null, ownerId: string | null) =>
  !ownerId || owner?.id === ownerId;

function leadAccessWhere(
  access: PerformanceReportAccessScope,
): Prisma.LeadWhereInput | null {
  if (access.kind === "branches") return { branchId: { in: access.branchIds } };
  if (access.kind === "user") {
    return {
      OR: [
        { createdById: access.userId },
        { convertedById: access.userId },
        { counselors: { some: { counselorId: access.userId } } },
        { student: { is: { counselorId: access.userId } } },
      ],
    };
  }
  return null;
}

function studentAccessWhere(
  access: PerformanceReportAccessScope,
): Prisma.StudentWhereInput | null {
  if (access.kind === "branches") return { branchId: { in: access.branchIds } };
  if (access.kind === "user") {
    return {
      OR: [
        { counselorId: access.userId },
        {
          lead: {
            is: {
              OR: [
                { createdById: access.userId },
                { convertedById: access.userId },
                { counselors: { some: { counselorId: access.userId } } },
              ],
            },
          },
        },
      ],
    };
  }
  return null;
}

function loanAccessWhere(
  access: PerformanceReportAccessScope,
): Prisma.LoanApplicationWhereInput | null {
  if (access.kind === "branches") return { branchId: { in: access.branchIds } };
  if (access.kind === "user") {
    return {
      OR: [
        { counselorId: access.userId },
        { fintechAssigneeId: access.userId },
        { createdById: access.userId },
        {
          lead: {
            is: {
              OR: [
                { createdById: access.userId },
                { convertedById: access.userId },
                { counselors: { some: { counselorId: access.userId } } },
                { student: { is: { counselorId: access.userId } } },
              ],
            },
          },
        },
      ],
    };
  }
  return null;
}

function applicationWhere(
  filters: PerformanceReportFilters,
): Prisma.StudentApplicationWhereInput {
  return {
    ...(filters.countryId && { countryId: filters.countryId }),
    ...(filters.intakeId && { intakeId: filters.intakeId }),
    ...(filters.universityId && { universityId: filters.universityId }),
    ...(filters.applicationStatus && {
      status:
        filters.applicationStatus as Prisma.StudentApplicationWhereInput["status"],
    }),
  };
}

function loanStatusFilter(
  filters: PerformanceReportFilters,
): Prisma.LoanApplicationWhereInput {
  return {
    ...(filters.loanStatus && {
      loanStatus: { equals: filters.loanStatus, mode: "insensitive" },
    }),
    ...(filters.fintechAssigneeId && {
      fintechAssigneeId: filters.fintechAssigneeId,
    }),
    ...(filters.nbfc && {
      bankApplications: {
        some: { bank: { name: { equals: filters.nbfc, mode: "insensitive" } } },
      },
    }),
  };
}

function hasStudentOnlyFilters(filters: PerformanceReportFilters) {
  return Boolean(
    filters.universityId ||
    filters.applicationStatus ||
    filters.casStatus ||
    filters.visaStatus,
  );
}

function includeLeads(filters: PerformanceReportFilters) {
  return !(
    filters.recordScope === "students" ||
    filters.leadStatus === CONVERTED ||
    hasStudentOnlyFilters(filters)
  );
}

function includeStudents(filters: PerformanceReportFilters) {
  return !(
    filters.recordScope === "leads" ||
    (filters.leadStatus && filters.leadStatus !== CONVERTED)
  );
}

function buildLeadWhere(
  filters: PerformanceReportFilters,
  lookup: FilterLookup,
  access: PerformanceReportAccessScope,
): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];
  const where: Prisma.LeadWhereInput = {
    leadType: STUDY_ABROAD as Prisma.LeadWhereInput["leadType"],
    isConverted: false,
    student: { is: null },
  };

  if (filters.search) {
    where.OR = [
      { leadNumber: { contains: filters.search, mode: "insensitive" } },
      { studentName: { contains: filters.search, mode: "insensitive" } },
      { emailId: { contains: filters.search, mode: "insensitive" } },
      { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      { preferredCountry: { contains: filters.search, mode: "insensitive" } },
      { preferredCourse: { contains: filters.search, mode: "insensitive" } },
      {
        loanApplication: {
          is: {
            applicationId: { contains: filters.search, mode: "insensitive" },
          },
        },
      },
    ];
  }
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.leadStatus) {
    where.status = filters.leadStatus as Prisma.LeadWhereInput["status"];
  }
  if (filters.leadSource) {
    where.source = { equals: filters.leadSource, mode: "insensitive" };
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
  if (filters.counselorId && access.kind !== "user") {
    and.push({
      OR: [
        { createdById: filters.counselorId },
        { convertedById: filters.counselorId },
        { counselors: { some: { counselorId: filters.counselorId } } },
      ],
    });
  }
  if (filters.loanStatus || filters.nbfc || filters.fintechAssigneeId) {
    and.push({ loanApplication: { is: loanStatusFilter(filters) } });
  }
  const range = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  if (range) where.createdAt = range;
  const accessWhere = leadAccessWhere(access);
  if (accessWhere) and.push(accessWhere);
  if (and.length) where.AND = and;
  return where;
}

function buildStudentWhere(
  filters: PerformanceReportFilters,
  access: PerformanceReportAccessScope,
): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [];
  const where: Prisma.StudentWhereInput = {};
  const appWhere = applicationWhere(filters);

  if (filters.search) {
    where.OR = [
      { studentName: { contains: filters.search, mode: "insensitive" } },
      { emailId: { contains: filters.search, mode: "insensitive" } },
      { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      {
        lead: {
          is: { leadNumber: { contains: filters.search, mode: "insensitive" } },
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
              { courseName: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      },
      {
        lead: {
          is: {
            loanApplication: {
              is: {
                applicationId: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      },
    ];
  }
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.counselorId && access.kind !== "user") {
    and.push({
      OR: [
        { counselorId: filters.counselorId },
        {
          lead: {
            is: {
              OR: [
                { createdById: filters.counselorId },
                { convertedById: filters.counselorId },
                { counselors: { some: { counselorId: filters.counselorId } } },
              ],
            },
          },
        },
      ],
    });
  }
  if (filters.leadSource || filters.leadStatus === CONVERTED) {
    and.push({
      lead: {
        is: {
          ...(filters.leadSource && {
            source: { equals: filters.leadSource, mode: "insensitive" },
          }),
          ...(filters.leadStatus === CONVERTED && {
            status: CONVERTED as Prisma.LeadWhereInput["status"],
          }),
        },
      },
    });
  }
  if (Object.keys(appWhere).length) where.applications = { some: appWhere };
  if (filters.casStatus || filters.visaStatus) {
    where.visaProfile = {
      is: {
        ...(filters.casStatus && {
          casStatus:
            filters.casStatus as Prisma.StudentVisaProfileWhereInput["casStatus"],
        }),
        ...(filters.visaStatus && {
          visaStatus:
            filters.visaStatus as Prisma.StudentVisaProfileWhereInput["visaStatus"],
        }),
      },
    };
  }
  if (filters.loanStatus || filters.nbfc || filters.fintechAssigneeId) {
    const legacy: Prisma.StudentLoanProfileWhereInput = {
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
    and.push({
      OR: [
        { loanProfile: { is: legacy } },
        {
          lead: { is: { loanApplication: { is: loanStatusFilter(filters) } } },
        },
      ],
    });
  }
  const range = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  if (range) {
    and.push({
      OR: [
        { lead: { is: { convertedAt: range } } },
        {
          AND: [{ lead: { is: { convertedAt: null } } }, { createdAt: range }],
        },
      ],
    });
  }
  const accessWhere = studentAccessWhere(access);
  if (accessWhere) and.push(accessWhere);
  if (and.length) where.AND = and;
  return where;
}

function buildLoanWhere(
  filters: PerformanceReportFilters,
  access: PerformanceReportAccessScope,
): Prisma.LoanApplicationWhereInput {
  const and: Prisma.LoanApplicationWhereInput[] = [];
  const where: Prisma.LoanApplicationWhereInput = loanStatusFilter(filters);

  if (filters.search) {
    where.OR = [
      { applicationId: { contains: filters.search, mode: "insensitive" } },
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { mobile: { contains: filters.search, mode: "insensitive" } },
      {
        lead: {
          is: { leadNumber: { contains: filters.search, mode: "insensitive" } },
        },
      },
    ];
  }
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.counselorId && access.kind !== "user") {
    and.push({
      OR: [
        { counselorId: filters.counselorId },
        { fintechAssigneeId: filters.counselorId },
        { createdById: filters.counselorId },
        {
          lead: {
            is: {
              OR: [
                { createdById: filters.counselorId },
                { convertedById: filters.counselorId },
                { counselors: { some: { counselorId: filters.counselorId } } },
                { student: { is: { counselorId: filters.counselorId } } },
              ],
            },
          },
        },
      ],
    });
  }
  const range = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  if (range) {
    and.push({
      OR: [
        { enquiryDate: range },
        { AND: [{ enquiryDate: null }, { createdAt: range }] },
      ],
    });
  }
  const accessWhere = loanAccessWhere(access);
  if (accessWhere) and.push(accessWhere);
  if (and.length) where.AND = and;
  return where;
}

function buildPendingLoanLeadWhere(
  filters: PerformanceReportFilters,
  lookup: FilterLookup,
  access: PerformanceReportAccessScope,
): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];
  const where: Prisma.LeadWhereInput = {
    leadType: STUDY_ABROAD as Prisma.LeadWhereInput["leadType"],
    loanRequirement: true,
    loanApplication: { is: null },
  };

  if (filters.loanStatus && normalize(filters.loanStatus) !== "new_enquiry") {
    where.id = "__no_pending_loan_login__";
  }
  if (filters.nbfc || filters.fintechAssigneeId) {
    where.id = "__no_pending_loan_login__";
  }
  if (filters.search) {
    where.OR = [
      { leadNumber: { contains: filters.search, mode: "insensitive" } },
      { studentName: { contains: filters.search, mode: "insensitive" } },
      { emailId: { contains: filters.search, mode: "insensitive" } },
      { mobileNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.leadSource) {
    where.source = { equals: filters.leadSource, mode: "insensitive" };
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
  if (filters.counselorId && access.kind !== "user") {
    and.push({
      OR: [
        { createdById: filters.counselorId },
        { convertedById: filters.counselorId },
        { counselors: { some: { counselorId: filters.counselorId } } },
        { student: { is: { counselorId: filters.counselorId } } },
      ],
    });
  }
  const range = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  if (range) where.createdAt = range;
  const accessWhere = leadAccessWhere(access);
  if (accessWhere) and.push(accessWhere);
  if (and.length) where.AND = and;
  return where;
}

function buildLoanMetrics(
  loans: LoanRecord[],
  pendingLeads: LeadRecord[],
  ownerId: string | null,
): LoanMetric[] {
  return [
    ...loans.map((loan) => ({
      id: loan.id,
      branchId: loan.branchId,
      branch: loan.branch.name,
      owner: currentLoanOwner(loan),
      date: loan.enquiryDate ?? loan.createdAt,
      status: loan.loanStatus,
      approved: isLoanApproved(loan),
    })),
    ...pendingLeads.map((lead) => ({
      id: `pending:${lead.id}`,
      branchId: lead.branchId,
      branch: lead.branch?.name ?? "Not Assigned",
      owner: currentLeadOwner(lead),
      date: lead.createdAt,
      status: "New Enquiry",
      approved: false,
    })),
  ].filter((loan) => belongsToOwner(loan.owner, ownerId));
}

function groupApplications(applications: ApplicationRecord[]) {
  const map = new Map<string, ApplicationRecord[]>();
  for (const application of applications) {
    const rows = map.get(application.studentId) ?? [];
    rows.push(application);
    map.set(application.studentId, rows);
  }
  for (const [studentId, rows] of map) {
    rows.sort(
      (a, b) =>
        (b.applicationDate ?? b.createdAt).getTime() -
        (a.applicationDate ?? a.createdAt).getTime(),
    );
    map.set(studentId, rows);
  }
  return map;
}

const applicationCountry = (row: ApplicationRecord) =>
  row.countryName ?? row.country?.name ?? "Not Set";
const applicationUniversity = (row: ApplicationRecord) =>
  row.universityName ?? row.university?.name ?? "Not Set";
const applicationCourse = (row: ApplicationRecord) =>
  row.courseName ?? row.course?.name ?? "Not Set";
const applicationIntake = (row: ApplicationRecord) =>
  row.intakeName ?? row.intake?.name ?? "Not Set";
const snapshotNbfc = (
  snapshot:
    LeadRecord["loanApplication"] | StudentRecord["lead"]["loanApplication"],
) => snapshot?.bankApplications[0]?.bank.name ?? "";

function mapLeadRow(lead: LeadRecord): PerformanceReportRow {
  const owner = currentLeadOwner(lead);
  const loan = lead.loanApplication;
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
    counselorId: owner?.id ?? null,
    counselorName: owner?.name ?? "Not Assigned",
    source: lead.source ?? "Not Set",
    countryName: lead.preferredCountry ?? "Not Set",
    intakeName: lead.preferredIntake ?? "Not Set",
    courseName: lead.preferredCourse ?? "Not Set",
    lifecycleStatus: String(lead.status ?? ""),
    currentStage: "walk_in",
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
    loanStatus: loan?.loanStatus ?? (lead.loanRequirement ? "New Enquiry" : ""),
    loanLogin: lead.loanRequirement || Boolean(loan),
    loanApproved: Boolean(loan && isLoanApproved(loan)),
    nbfc: snapshotNbfc(loan),
    fintechAssigneeName: loan?.fintechAssignee?.name ?? "Not Assigned",
  };
}

function mapStudentRow(
  student: StudentRecord,
  applications: ApplicationRecord[],
): PerformanceReportRow {
  const owner = currentStudentOwner(student);
  const latest = applications[0] ?? null;
  const loan = student.lead.loanApplication;
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
    counselorId: owner?.id ?? null,
    counselorName: owner?.name ?? "Not Assigned",
    source: student.lead.source ?? "Not Set",
    countryName: latest
      ? applicationCountry(latest)
      : (student.lead.preferredCountry ?? "Not Set"),
    intakeName: latest
      ? applicationIntake(latest)
      : (student.lead.preferredIntake ?? "Not Set"),
    courseName: latest
      ? applicationCourse(latest)
      : (student.lead.preferredCourse ?? "Not Set"),
    lifecycleStatus: String(student.status ?? ""),
    currentStage: String(student.currentStage ?? ""),
    createdAt: student.createdAt.toISOString(),
    convertedAt:
      student.lead.convertedAt?.toISOString() ??
      student.createdAt.toISOString(),
    nextFollowup: student.lead.nextFollowup?.toISOString() ?? null,
    applicationsCount: applications.length,
    latestApplicationId: latest?.id ?? null,
    latestUniversityName: latest
      ? applicationUniversity(latest)
      : "Not Applied",
    latestApplicationDate: latest?.applicationDate?.toISOString() ?? null,
    latestApplicationStatus: latest ? String(latest.status ?? "") : "",
    latestOfferStatus: latest ? String(latest.offerStatus ?? "") : "",
    casStatus: student.visaProfile?.casStatus ?? "",
    visaStatus: student.visaProfile?.visaStatus ?? "",
    loanStatus:
      loan?.loanStatus ??
      student.loanProfile?.loanStatus ??
      (student.lead.loanRequirement ? "New Enquiry" : ""),
    loanLogin:
      student.lead.loanRequirement ||
      Boolean(loan) ||
      Boolean(student.loanProfile),
    loanApproved: Boolean(loan && isLoanApproved(loan)),
    nbfc: snapshotNbfc(loan) || student.loanProfile?.nbfc || "",
    fintechAssigneeName:
      loan?.fintechAssignee?.name ??
      student.loanProfile?.fintechAssignee?.name ??
      "Not Assigned",
  };
}

function mapApplicationExport(
  application: ApplicationRecord,
  student: StudentRecord,
): PerformanceApplicationExportRow {
  const owner = currentStudentOwner(student);
  const loan = student.lead.loanApplication;
  return {
    applicationId: application.id,
    studentId: student.id,
    leadNumber: student.lead.leadNumber,
    studentName: student.studentName,
    emailId: student.emailId,
    mobileNumber: student.mobileNumber,
    branchName: student.branch?.name ?? "Not Assigned",
    counselorName: owner?.name ?? "Not Assigned",
    source: student.lead.source ?? "Not Set",
    countryName: applicationCountry(application),
    universityName: applicationUniversity(application),
    courseName: applicationCourse(application),
    intakeName: applicationIntake(application),
    portal: application.portal ?? "",
    applicationDate: application.applicationDate?.toISOString() ?? null,
    applicationStatus: String(application.status ?? ""),
    offerStatus: String(application.offerStatus ?? ""),
    depositStatus: student.visaProfile?.depositStatus ?? "",
    ihsPaidStatus: student.visaProfile?.ihsPaidStatus ?? "",
    visaPaidStatus: student.visaProfile?.visaPaidStatus ?? "",
    casStatus: student.visaProfile?.casStatus ?? "",
    visaStatus: student.visaProfile?.visaStatus ?? "",
    fintechAssigneeName:
      loan?.fintechAssignee?.name ??
      student.loanProfile?.fintechAssignee?.name ??
      "Not Assigned",
    nbfc: snapshotNbfc(loan) || student.loanProfile?.nbfc || "",
    loanStatus: loan?.loanStatus ?? student.loanProfile?.loanStatus ?? "",
    pfStatus: student.loanProfile?.pfStatus ?? "",
    disbursed: student.loanProfile?.disbursed ?? false,
  };
}

const monthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

function buildMonthlyVolume(
  leads: LeadRecord[],
  students: StudentRecord[],
  applications: ApplicationRecord[],
  loans: LoanMetric[],
): PerformanceReportMonthlyPoint[] {
  const map = new Map<string, PerformanceReportMonthlyPoint>();
  const ensure = (date: Date) => {
    const key = monthKey(date);
    const row = map.get(key) ?? {
      key,
      label: monthLabel(date),
      leads: 0,
      students: 0,
      applications: 0,
      loanLogins: 0,
      loanApproved: 0,
      visaConversions: 0,
    };
    map.set(key, row);
    return row;
  };
  leads.forEach((lead) => (ensure(lead.createdAt).leads += 1));
  students.forEach((student) => {
    ensure(student.lead.convertedAt ?? student.createdAt).students += 1;
    if (isVisaApproved(student.visaProfile?.visaStatus)) {
      ensure(
        student.visaProfile?.visaDecisionDate ?? student.createdAt,
      ).visaConversions += 1;
    }
  });
  applications.forEach(
    (application) =>
      (ensure(
        application.applicationDate ?? application.createdAt,
      ).applications += 1),
  );
  loans.forEach((loan) => {
    const row = ensure(loan.date);
    row.loanLogins += 1;
    row.loanApproved += loan.approved ? 1 : 0;
  });
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function buildCountryDemand(
  leads: LeadRecord[],
  students: StudentRecord[],
  applicationsByStudent: Map<string, ApplicationRecord[]>,
): PerformanceReportCountryPoint[] {
  const map = new Map<string, PerformanceReportCountryPoint>();
  const ensure = (country: string) => {
    const row = map.get(country) ?? {
      country,
      leads: 0,
      students: 0,
      applications: 0,
    };
    map.set(country, row);
    return row;
  };
  leads.forEach((lead) => ensure(lead.preferredCountry ?? "Not Set").leads++);
  students.forEach((student) => {
    const applications = applicationsByStudent.get(student.id) ?? [];
    const country = applications[0]
      ? applicationCountry(applications[0])
      : (student.lead.preferredCountry ?? "Not Set");
    ensure(country).students++;
    applications.forEach(
      (application) => ensure(applicationCountry(application)).applications++,
    );
  });
  return [...map.values()].sort(
    (a, b) =>
      b.leads +
      b.students +
      b.applications -
      (a.leads + a.students + a.applications),
  );
}

function buildLeadStatusBreakdown(
  leads: LeadRecord[],
  students: StudentRecord[],
): PerformanceReportStatusPoint[] {
  return buildStatusBreakdown([
    ...leads.map((lead) => String(lead.status ?? "")),
    ...students.map(() => CONVERTED),
  ]);
}

function buildLeadSourceBreakdown(
  leads: LeadRecord[],
  students: StudentRecord[],
): PerformanceReportSourcePoint[] {
  const map = new Map<string, { leads: number; students: number }>();
  const ensure = (source: string) => {
    const row = map.get(source) ?? { leads: 0, students: 0 };
    map.set(source, row);
    return row;
  };
  leads.forEach((lead) => ensure(lead.source ?? "Not Set").leads++);
  students.forEach(
    (student) => ensure(student.lead.source ?? "Not Set").students++,
  );
  return [...map]
    .map(([source, row]) => ({
      source,
      ...row,
      total: row.leads + row.students,
    }))
    .sort((a, b) => b.total - a.total);
}

function buildStatusBreakdown(
  values: string[],
): PerformanceReportStatusPoint[] {
  const map = new Map<string, number>();
  values.forEach((value) => {
    const status = humanize(value);
    map.set(status, (map.get(status) ?? 0) + 1);
  });
  return [...map]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function metricResult<T extends MetricAccumulator>(
  row: T,
  target: number,
  achieved: number,
  leadsCreated: number,
) {
  const applicationConversionRate = percentage(
    row.applicationConversions,
    row.totalWalkins,
  );
  const visaConversionRate = percentage(
    row.visaConversions,
    row.applicationConversions,
  );
  return {
    ...row,
    leadsCreated,
    target,
    achieved,
    targetCompletionPercentage: percentage(achieved, target),
    applicationConversionRate,
    visaConversionRate,
    conversionRate: applicationConversionRate,
  };
}

function buildBranchPerformance(
  leads: LeadRecord[],
  students: StudentRecord[],
  applications: ApplicationRecord[],
  loans: LoanMetric[],
  targets: TargetMetrics,
): PerformanceReportBranchPoint[] {
  const map = new Map<string, BranchAccumulator>();
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const ensure = (branchId: string, branch: string) => {
    const row = map.get(branchId) ?? {
      branchId,
      branch,
      ...metricAccumulator(),
    };
    map.set(branchId, row);
    return row;
  };
  targets.targetBranches.forEach((branch, branchId) =>
    ensure(branchId, branch),
  );
  leads.forEach((lead) => {
    const row = ensure(lead.branchId, lead.branch?.name ?? "Not Assigned");
    row.totalWalkins++;
    row.leads++;
    row.qualifiedLeads +=
      normalize(String(lead.status)) === "qualified" ? 1 : 0;
    row.lostLeads += isLost(String(lead.status)) ? 1 : 0;
  });
  students.forEach((student) => {
    const row = ensure(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    );
    row.totalWalkins++;
    row.students++;
    row.applicationConversions++;
    row.droppedStudents += isDropped(String(student.status)) ? 1 : 0;
    row.casReceived += isCasReceived(student.visaProfile?.casStatus) ? 1 : 0;
    row.visaApproved += isVisaApproved(student.visaProfile?.visaStatus) ? 1 : 0;
    row.visaConversions += isVisaApproved(student.visaProfile?.visaStatus)
      ? 1
      : 0;
  });
  applications.forEach((application) => {
    const student = studentMap.get(application.studentId);
    if (!student) return;
    const row = ensure(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    );
    row.applications++;
    row.offers += isOffer(String(application.offerStatus)) ? 1 : 0;
  });
  loans.forEach((loan) => {
    const row = ensure(loan.branchId, loan.branch);
    row.loanLogins++;
    row.loanApproved += loan.approved ? 1 : 0;
  });
  return [...map.values()]
    .map((row) =>
      metricResult(
        row,
        targets.branchTargets.get(row.branchId) ?? 0,
        targets.branchAchievements.get(row.branchId) ?? 0,
        targets.branchLeadsCreated.get(row.branchId) ?? 0,
      ),
    )
    .sort((a, b) => a.branch.localeCompare(b.branch));
}

function buildCounselorPerformance(
  leads: LeadRecord[],
  students: StudentRecord[],
  applications: ApplicationRecord[],
  loans: LoanMetric[],
  targets: TargetMetrics,
): PerformanceReportCounselorPoint[] {
  const map = new Map<string, CounselorAccumulator>();
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const ensure = (branchId: string, branch: string, owner: Person | null) => {
    const counselorId = owner?.id ?? "unassigned";
    const counselor = owner?.name ?? "Unassigned";
    const key = metricKey(branchId, counselorId);
    const row = map.get(key) ?? {
      branchId,
      branch,
      counselorId,
      counselor,
      ...metricAccumulator(),
    };
    map.set(key, row);
    return row;
  };
  targets.performancePeople.forEach((person) =>
    ensure(person.branchId, person.branch, {
      id: person.counselorId,
      name: person.counselor,
    }),
  );
  leads.forEach((lead) => {
    const row = ensure(
      lead.branchId,
      lead.branch?.name ?? "Not Assigned",
      currentLeadOwner(lead),
    );
    row.totalWalkins++;
    row.leads++;
    row.qualifiedLeads +=
      normalize(String(lead.status)) === "qualified" ? 1 : 0;
    row.lostLeads += isLost(String(lead.status)) ? 1 : 0;
  });
  students.forEach((student) => {
    const row = ensure(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
      currentStudentOwner(student),
    );
    row.totalWalkins++;
    row.students++;
    row.applicationConversions++;
    row.droppedStudents += isDropped(String(student.status)) ? 1 : 0;
    row.casReceived += isCasReceived(student.visaProfile?.casStatus) ? 1 : 0;
    row.visaApproved += isVisaApproved(student.visaProfile?.visaStatus) ? 1 : 0;
    row.visaConversions += isVisaApproved(student.visaProfile?.visaStatus)
      ? 1
      : 0;
  });
  applications.forEach((application) => {
    const student = studentMap.get(application.studentId);
    if (!student) return;
    const row = ensure(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
      currentStudentOwner(student),
    );
    row.applications++;
    row.offers += isOffer(String(application.offerStatus)) ? 1 : 0;
  });
  loans.forEach((loan) => {
    const row = ensure(loan.branchId, loan.branch, loan.owner);
    row.loanLogins++;
    row.loanApproved += loan.approved ? 1 : 0;
  });
  return [...map.values()]
    .map((row) => {
      const key = metricKey(row.branchId, row.counselorId);
      return metricResult(
        row,
        targets.counselorTargets.get(key) ?? 0,
        targets.counselorAchievements.get(key) ?? 0,
        targets.counselorLeadsCreated.get(key) ?? 0,
      );
    })
    .sort(
      (a, b) =>
        a.branch.localeCompare(b.branch) ||
        a.counselor.localeCompare(b.counselor),
    );
}

function buildSummary(
  leads: LeadRecord[],
  students: StudentRecord[],
  applications: ApplicationRecord[],
  loans: LoanMetric[],
  targets: TargetMetrics,
) {
  const totalWalkins = leads.length + students.length;
  const visaConversions = students.filter((student) =>
    isVisaApproved(student.visaProfile?.visaStatus),
  ).length;
  const applicationConversionRate = percentage(students.length, totalWalkins);
  return {
    totalPipelineRecords: totalWalkins,
    totalLeads: leads.length,
    totalStudents: students.length,
    totalApplications: applications.length,
    qualifiedLeads: leads.filter(
      (lead) => normalize(String(lead.status)) === "qualified",
    ).length,
    lostLeads: leads.filter((lead) => isLost(String(lead.status))).length,
    droppedStudents: students.filter((student) =>
      isDropped(String(student.status)),
    ).length,
    totalTarget: targets.totalTarget,
    totalAchieved: targets.totalAchieved,
    totalLeadsCreated: targets.totalLeadsCreated,
    targetAssignments: targets.targetAssignments,
    targetCompletionPercentage: percentage(
      targets.totalAchieved,
      targets.totalTarget,
    ),
    applicationConversions: students.length,
    visaConversions,
    applicationConversionRate,
    visaConversionRate: percentage(visaConversions, students.length),
    conversionRate: applicationConversionRate,
    offerApplications: applications.filter((application) =>
      isOffer(String(application.offerStatus)),
    ).length,
    casReceivedStudents: students.filter((student) =>
      isCasReceived(student.visaProfile?.casStatus),
    ).length,
    visaApprovedStudents: visaConversions,
    loanLogins: loans.length,
    loanApproved: loans.filter((loan) => loan.approved).length,
  };
}

async function getLookup(
  filters: PerformanceReportFilters,
): Promise<FilterLookup> {
  const [country, intake] = await Promise.all([
    filters.countryId
      ? db.country.findUnique({
          where: { id: filters.countryId },
          select: { name: true },
        })
      : null,
    filters.intakeId
      ? db.intake.findUnique({
          where: { id: filters.intakeId },
          select: { name: true },
        })
      : null,
  ]);
  return { countryName: country?.name ?? "", intakeName: intake?.name ?? "" };
}

async function getTargetMetrics(
  filters: PerformanceReportFilters,
  lookup: FilterLookup,
  access: PerformanceReportAccessScope,
): Promise<TargetMetrics> {
  const targetAnd: Prisma.CounsellorIntakeTargetWhereInput[] = [];
  const studentAnd: Prisma.StudentWhereInput[] = [
    { visaProfile: { is: { visaStatus: "APPROVED" } } },
  ];
  if (filters.visaStatus && !isVisaApproved(filters.visaStatus)) {
    studentAnd.push({ id: "__no_target_achievement_for_visa_filter__" });
  }
  const leadAnd: Prisma.LeadWhereInput[] = [];
  const ownerId = ownerFilterId(filters, access);
  const range = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );

  if (filters.branchId) {
    targetAnd.push({ branchId: filters.branchId });
    studentAnd.push({ branchId: filters.branchId });
    leadAnd.push({ branchId: filters.branchId });
  }
  if (ownerId) {
    targetAnd.push({ counsellorId: ownerId });
  }
  if (filters.intakeId) targetAnd.push({ intakeId: filters.intakeId });

  const appWhere = applicationWhere(filters);
  if (Object.keys(appWhere).length)
    studentAnd.push({ applications: { some: appWhere } });
  if (range) {
    studentAnd.push({
      visaProfile: { is: { visaStatus: "APPROVED", visaDecisionDate: range } },
    });
    leadAnd.push({ createdAt: range });
  }
  if (lookup.intakeName) {
    leadAnd.push({
      preferredIntake: { contains: lookup.intakeName, mode: "insensitive" },
    });
  }
  const studentAccess = studentAccessWhere(access);
  const leadAccess = leadAccessWhere(access);
  if (studentAccess) studentAnd.push(studentAccess);
  if (leadAccess) leadAnd.push(leadAccess);
  if (access.kind === "branches")
    targetAnd.push({ branchId: { in: access.branchIds } });

  const [targets, studentCandidates, leadCandidates] = await Promise.all([
    db.counsellorIntakeTarget.findMany({
      where: targetAnd.length ? { AND: targetAnd } : undefined,
      select: {
        branchId: true,
        counsellorId: true,
        target: true,
        branch: { select: { name: true } },
        counsellor: { select: { name: true } },
      },
    }),
    includeStudents(filters)
      ? db.student.findMany({
          where: { AND: studentAnd },
          select: {
            branchId: true,
            counselorId: true,
            counselor: { select: personSelect },
            lead: {
              select: {
                createdById: true,
                convertedById: true,
                convertedAt: true,
                createdBy: { select: personSelect },
                convertedBy: { select: personSelect },
                counselors: {
                  orderBy: { assignedAt: "desc" },
                  select: {
                    counselorId: true,
                    assignedAt: true,
                    counselor: { select: personSelect },
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([] as TargetStudent[]),
    db.lead.findMany({
      where: {
        leadType: STUDY_ABROAD as Prisma.LeadWhereInput["leadType"],
        ...(leadAnd.length && { AND: leadAnd }),
      },
      select: {
        branchId: true,
        createdById: true,
        convertedById: true,
        convertedAt: true,
        createdBy: { select: personSelect },
        convertedBy: { select: personSelect },
        counselors: {
          orderBy: { assignedAt: "desc" },
          select: {
            counselorId: true,
            assignedAt: true,
            counselor: { select: personSelect },
          },
        },
      },
    }),
  ]);

  const achievements = studentCandidates
    .map((student) => ({
      branchId: student.branchId,
      owner: currentStudentOwner(student),
    }))
    .filter((row) => belongsToOwner(row.owner, ownerId));
  const createdLeads = leadCandidates
    .map((lead) => ({ branchId: lead.branchId, owner: currentLeadOwner(lead) }))
    .filter((row) => belongsToOwner(row.owner, ownerId));
  const branchIds = [
    ...new Set([
      ...targets.map((row) => row.branchId),
      ...achievements.map((row) => row.branchId),
      ...createdLeads.map((row) => row.branchId),
    ]),
  ];
  const branches = branchIds.length
    ? await db.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      })
    : [];
  const branchNames = new Map(
    branches.map((branch) => [branch.id, branch.name]),
  );
  const branchTargets = new Map<string, number>();
  const branchAchievements = new Map<string, number>();
  const branchLeadsCreated = new Map<string, number>();
  const counselorTargets = new Map<string, number>();
  const counselorAchievements = new Map<string, number>();
  const counselorLeadsCreated = new Map<string, number>();
  const performancePeople = new Map<string, PerformancePerson>();
  const targetBranches = new Map<string, string>();
  const ensurePerson = (branchId: string, owner: Person) => {
    const key = metricKey(branchId, owner.id);
    performancePeople.set(key, {
      branchId,
      branch: branchNames.get(branchId) ?? "Not Assigned",
      counselorId: owner.id,
      counselor: owner.name,
    });
    return key;
  };
  const increment = (map: Map<string, number>, key: string, amount = 1) =>
    map.set(key, (map.get(key) ?? 0) + amount);

  targets.forEach((row) => {
    const owner = { id: row.counsellorId, name: row.counsellor.name };
    const key = ensurePerson(row.branchId, owner);
    targetBranches.set(row.branchId, row.branch.name);
    increment(branchTargets, row.branchId, row.target);
    increment(counselorTargets, key, row.target);
  });
  achievements.forEach((row) => {
    increment(branchAchievements, row.branchId);
    if (row.owner)
      increment(counselorAchievements, ensurePerson(row.branchId, row.owner));
  });
  createdLeads.forEach((row) => {
    increment(branchLeadsCreated, row.branchId);
    if (row.owner)
      increment(counselorLeadsCreated, ensurePerson(row.branchId, row.owner));
  });

  return {
    totalTarget: targets.reduce((sum, row) => sum + row.target, 0),
    totalAchieved: achievements.length,
    totalLeadsCreated: createdLeads.length,
    targetAssignments: targets.length,
    branchTargets,
    branchAchievements,
    branchLeadsCreated,
    counselorTargets,
    counselorAchievements,
    counselorLeadsCreated,
    performancePeople,
    targetBranches,
  };
}

export function parsePerformanceReportFilters(
  searchParams: URLSearchParams,
): PerformanceReportFilters {
  const presets: ReportDatePreset[] = [
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
  const scopes: ReportRecordScope[] = ["all", "leads", "students"];
  const preset = clean(searchParams.get("datePreset"));
  const scope = clean(searchParams.get("recordScope"));
  return {
    search: clean(searchParams.get("search")),
    recordScope: scopes.includes(scope as ReportRecordScope)
      ? (scope as ReportRecordScope)
      : "all",
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
    datePreset: presets.includes(preset as ReportDatePreset)
      ? (preset as ReportDatePreset)
      : "all",
    startDate: clean(searchParams.get("startDate")),
    endDate: clean(searchParams.get("endDate")),
  };
}

export function parsePerformanceReportPagination(
  searchParams: URLSearchParams,
) {
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
  access: PerformanceReportAccessScope = ALL_ACCESS,
): Promise<PerformanceReportData> {
  const lookup = await getLookup(filters);
  const [
    leadCandidates,
    studentCandidates,
    loanCandidates,
    pendingLoanLeadCandidates,
    targets,
  ] = await Promise.all([
    includeLeads(filters)
      ? db.lead.findMany({
          where: buildLeadWhere(filters, lookup, access),
          select: performanceLeadSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as LeadRecord[]),
    includeStudents(filters)
      ? db.student.findMany({
          where: buildStudentWhere(filters, access),
          select: performanceStudentSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as StudentRecord[]),
    db.loanApplication.findMany({
      where: buildLoanWhere(filters, access),
      select: performanceLoanSelect,
      orderBy: { createdAt: "desc" },
    }),
    db.lead.findMany({
      where: buildPendingLoanLeadWhere(filters, lookup, access),
      select: performanceLeadSelect,
      orderBy: { createdAt: "desc" },
    }),
    getTargetMetrics(filters, lookup, access),
  ]);
  const ownerId = ownerFilterId(filters, access);
  const leads = leadCandidates.filter((lead) =>
    belongsToOwner(currentLeadOwner(lead), ownerId),
  );
  const students = studentCandidates.filter((student) =>
    belongsToOwner(currentStudentOwner(student), ownerId),
  );
  const loans = buildLoanMetrics(
    loanCandidates,
    pendingLoanLeadCandidates,
    ownerId,
  );
  const studentIds = students.map((student) => student.id);
  const applications = studentIds.length
    ? await db.studentApplication.findMany({
        where: { ...applicationWhere(filters), studentId: { in: studentIds } },
        select: performanceApplicationSelect,
        orderBy: [{ applicationDate: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const applicationsByStudent = groupApplications(applications);
  const allRows = [
    ...leads.map(mapLeadRow),
    ...students.map((student) =>
      mapStudentRow(student, applicationsByStudent.get(student.id) ?? []),
    ),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const applicationRows = includeApplicationRows
    ? applications.flatMap((application) => {
        const student = studentMap.get(application.studentId);
        return student ? [mapApplicationExport(application, student)] : [];
      })
    : undefined;

  return {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(leads, students, applications, loans, targets),
    monthlyVolume: buildMonthlyVolume(leads, students, applications, loans),
    countryDemand: buildCountryDemand(leads, students, applicationsByStudent),
    leadStatusBreakdown: buildLeadStatusBreakdown(leads, students),
    leadSourceBreakdown: buildLeadSourceBreakdown(leads, students),
    applicationStatusBreakdown: buildStatusBreakdown(
      applications.map((application) => String(application.status ?? "")),
    ),
    visaStatusBreakdown: buildStatusBreakdown(
      students.map((student) => String(student.visaProfile?.visaStatus ?? "")),
    ),
    loanStatusBreakdown: buildStatusBreakdown(loans.map((loan) => loan.status)),
    branchPerformance: buildBranchPerformance(
      leads,
      students,
      applications,
      loans,
      targets,
    ),
    counselorPerformance: buildCounselorPerformance(
      leads,
      students,
      applications,
      loans,
      targets,
    ),
    rows: allRows.slice(start, start + limit),
    ...(applicationRows && { applicationRows }),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

export function getPerformanceReportForExport(
  filters: PerformanceReportFilters,
  access: PerformanceReportAccessScope = ALL_ACCESS,
) {
  return getPerformanceReport(
    filters,
    1,
    Number.MAX_SAFE_INTEGER,
    true,
    access,
  );
}

export async function getPerformanceReportFilterOptions(
  access: PerformanceReportAccessScope = ALL_ACCESS,
): Promise<PerformanceReportFilterOptions> {
  const branchWhere: Prisma.BranchWhereInput =
    access.kind === "branches"
      ? { id: { in: access.branchIds } }
      : access.kind === "user"
        ? { users: { some: { id: access.userId } } }
        : {};
  const userWhere: Prisma.UserWhereInput =
    access.kind === "user"
      ? { id: access.userId }
      : access.kind === "branches"
        ? { branches: { some: { id: { in: access.branchIds } } } }
        : {};
  const scopedLeadWhere = leadAccessWhere(access);
  const scopedStudentWhere = studentAccessWhere(access);
  const scopedLoanWhere = loanAccessWhere(access);

  const [
    branches,
    users,
    countries,
    intakes,
    universities,
    applicationStatuses,
    visaProfiles,
    studentLoans,
    loanApplications,
    loanBanks,
    leadSourcesMaster,
    leadSourcesUsed,
  ] = await Promise.all([
    db.branch.findMany({
      where: branchWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        role: { select: { name: true } },
        branches: { select: { id: true } },
      },
      orderBy: { name: "asc" },
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
      where: scopedStudentWhere
        ? { student: { is: scopedStudentWhere } }
        : undefined,
      distinct: ["status"],
      select: { status: true },
      orderBy: { status: "asc" },
    }),
    db.studentVisaProfile.findMany({
      where: scopedStudentWhere
        ? { student: { is: scopedStudentWhere } }
        : undefined,
      select: { casStatus: true, visaStatus: true },
    }),
    db.studentLoanProfile.findMany({
      where: scopedStudentWhere
        ? { student: { is: scopedStudentWhere } }
        : undefined,
      select: {
        loanStatus: true,
        nbfc: true,
        fintechAssignee: { select: personSelect },
      },
    }),
    db.loanApplication.findMany({
      where: scopedLoanWhere ?? undefined,
      select: {
        loanStatus: true,
        fintechAssignee: { select: personSelect },
      },
    }),
    db.loanBankApplication.findMany({
      where: scopedLoanWhere
        ? { application: { is: scopedLoanWhere } }
        : undefined,
      distinct: ["bankId"],
      select: { bank: { select: { name: true } } },
    }),
    db.leadSource.findMany({
      where: { status: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    db.lead.findMany({
      where: {
        AND: [
          { source: { not: null } },
          ...(scopedLeadWhere ? [scopedLeadWhere] : []),
        ],
      },
      distinct: ["source"],
      select: { source: true },
    }),
  ]);
  const unique = (values: Array<string | null | undefined>) =>
    [
      ...new Set(
        values.map((value) => value?.trim()).filter(Boolean) as string[],
      ),
    ].sort((a, b) => a.localeCompare(b));
  const fintech = new Map<string, string>();
  const allowedUserIds = new Set(users.map((user) => user.id));
  studentLoans.forEach((loan) => {
    if (loan.fintechAssignee && allowedUserIds.has(loan.fintechAssignee.id)) {
      fintech.set(loan.fintechAssignee.id, loan.fintechAssignee.name);
    }
  });
  loanApplications.forEach((loan) => {
    if (loan.fintechAssignee && allowedUserIds.has(loan.fintechAssignee.id)) {
      fintech.set(loan.fintechAssignee.id, loan.fintechAssignee.name);
    }
  });
  users.forEach((user) => {
    if (access.kind === "user" && user.id === access.userId)
      fintech.set(user.id, user.name);
  });

  return {
    access: { kind: access.kind },
    branches: branches.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
    counselors: users.map((user) => ({
      value: user.id,
      label: `${user.name} (${user.role.name})`,
      roleName: user.role.name,
      branchIds: user.branches.map((branch) => branch.id),
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
    fintechAssignees: [...fintech]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    leadStatuses: [
      "draft",
      "new",
      "contacted",
      "qualified",
      "converted",
      "lost",
    ],
    leadSources: unique([
      ...leadSourcesMaster.map((source) => source.name),
      ...leadSourcesUsed.map((lead) => lead.source),
    ]),
    applicationStatuses: applicationStatuses.map((row) => String(row.status)),
    casStatuses: unique(visaProfiles.map((row) => String(row.casStatus))),
    visaStatuses: unique(visaProfiles.map((row) => String(row.visaStatus))),
    loanStatuses: unique([
      ...studentLoans.map((row) => row.loanStatus),
      ...loanApplications.map((row) => row.loanStatus),
    ]),
    nbfcs: unique([
      ...studentLoans.map((row) => row.nbfc),
      ...loanBanks.map((row) => row.bank.name),
    ]),
  };
}
