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
  createdById: true,
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
  createdBy: {
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
      createdById: true,
      createdBy: {
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

type PerformanceOwner = {
  id: string;
  name: string;
};

type LeadOwnershipRecord = {
  createdById: string | null;
  createdBy: PerformanceOwner | null;
  counselors: Array<{
    counselorId: string;
    isPrimary: boolean;
    assignedAt: Date;
    counselor: PerformanceOwner;
  }>;
};

type TargetLeadOwnershipRecord = LeadOwnershipRecord & {
  branchId: string;
  student: {
    counselorId: string | null;
    counselor: PerformanceOwner | null;
  } | null;
};

type TargetStudentOwnershipRecord = {
  branchId: string;
  counselorId: string | null;
  counselor: PerformanceOwner | null;
  lead: LeadOwnershipRecord;
};

export type PerformanceReportAccessScope =
  | { kind: "all" }
  | { kind: "branches"; branchIds: string[] }
  | { kind: "user"; userId: string; userName: string };

type MetricAccumulator = {
  totalWalkins: number;
  leads: number;
  qualifiedLeads: number;
  lostLeads: number;
  students: number;
  droppedStudents: number;
  applications: number;
  offers: number;
  casReceived: number;
  visaApproved: number;
};

type BranchAccumulator = MetricAccumulator & {
  branchId: string;
  branch: string;
};

type CounselorAccumulator = MetricAccumulator & {
  branchId: string;
  branch: string;
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

const STUDY_ABROAD_LEAD_TYPE = "study_abroad";
const CONVERTED_LEAD_STATUS = "converted";
const COUNSELLOR_ROLE_NAMES = ["Counsellor", "Counselor"];
const LOST_LEAD_STATUSES = new Set(["lost", "closed_lost", "lead_lost"]);
const DROPPED_STUDENT_STATUSES = new Set([
  "drop",
  "dropped",
  "student_dropped",
]);
const FULL_PERFORMANCE_ACCESS: PerformanceReportAccessScope = { kind: "all" };

function metricAccumulator(): MetricAccumulator {
  return {
    totalWalkins: 0,
    leads: 0,
    qualifiedLeads: 0,
    lostLeads: 0,
    students: 0,
    droppedStudents: 0,
    applications: 0,
    offers: 0,
    casReceived: 0,
    visaApproved: 0,
  };
}

function counselorMetricKey(branchId: string, counselorId: string): string {
  return `${branchId}:${counselorId}`;
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

  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
}

function normalizeStatus(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

function humanizeStatus(value: string): string {
  return value
    ? value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "Not Set";
}

function isLostLead(value: string | null | undefined): boolean {
  return LOST_LEAD_STATUSES.has(normalizeStatus(value));
}

function isDroppedStudent(value: string | null | undefined): boolean {
  return DROPPED_STUDENT_STATUSES.has(normalizeStatus(value));
}

function isOfferStatus(value: string | null | undefined): boolean {
  const normalized = normalizeStatus(value);

  return Boolean(normalized) &&
    !["none", "not_received", "pending", "rejected", "not_applicable"].includes(
      normalized,
    );
}

function isCasReceived(value: string | null | undefined): boolean {
  return ["received", "cas_received", "issued"].includes(
    normalizeStatus(value),
  );
}

function isVisaApproved(value: string | null | undefined): boolean {
  return ["approved", "visa_approved"].includes(normalizeStatus(value));
}

function buildLeadAccessWhere(
  accessScope: PerformanceReportAccessScope,
): Prisma.LeadWhereInput | null {
  if (accessScope.kind === "branches") {
    return { branchId: { in: accessScope.branchIds } };
  }

  if (accessScope.kind === "user") {
    return {
      OR: [
        { createdById: accessScope.userId },
        { counselors: { some: { counselorId: accessScope.userId } } },
      ],
    };
  }

  return null;
}

function buildStudentAccessWhere(
  accessScope: PerformanceReportAccessScope,
): Prisma.StudentWhereInput | null {
  if (accessScope.kind === "branches") {
    return { branchId: { in: accessScope.branchIds } };
  }

  if (accessScope.kind === "user") {
    return {
      OR: [
        { counselorId: accessScope.userId },
        {
          lead: {
            is: {
              OR: [
                { createdById: accessScope.userId },
                { counselors: { some: { counselorId: accessScope.userId } } },
              ],
            },
          },
        },
      ],
    };
  }

  return null;
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
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      Math.floor(date.getUTCMonth() / 3) * 3,
      1,
    ),
  );
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

  if (preset === "today") {
    return { gte: today, lt: addDays(today, 1) };
  }

  if (preset === "yesterday") {
    return { gte: addDays(today, -1), lt: today };
  }

  if (preset === "last_7_days") {
    return { gte: addDays(today, -6), lt: addDays(today, 1) };
  }

  if (preset === "last_30_days") {
    return { gte: addDays(today, -29), lt: addDays(today, 1) };
  }

  if (preset === "this_month") {
    return { gte: startOfMonth(today), lt: addDays(today, 1) };
  }

  if (preset === "last_month") {
    const thisMonth = startOfMonth(today);
    return {
      gte: new Date(
        Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - 1, 1),
      ),
      lt: thisMonth,
    };
  }

  if (preset === "this_quarter") {
    return { gte: startOfQuarter(today), lt: addDays(today, 1) };
  }

  if (preset === "last_quarter") {
    const thisQuarter = startOfQuarter(today);
    return {
      gte: new Date(
        Date.UTC(
          thisQuarter.getUTCFullYear(),
          thisQuarter.getUTCMonth() - 3,
          1,
        ),
      ),
      lt: thisQuarter,
    };
  }

  if (preset === "this_year") {
    return {
      gte: new Date(Date.UTC(today.getUTCFullYear(), 0, 1)),
      lt: addDays(today, 1),
    };
  }

  if (preset !== "custom") {
    return null;
  }

  const first = parseDateOnly(customStartDate);
  const second = parseDateOnly(customEndDate);

  if (!first && !second) {
    return null;
  }

  const start = first && second && first > second ? second : first;
  const end = first && second && first > second ? first : second;

  return {
    ...(start && { gte: start }),
    ...(end && { lt: addDays(end, 1) }),
  };
}

function getCurrentAssignmentOwner(
  lead: LeadOwnershipRecord,
): PerformanceOwner | null {
  const assignment =
    lead.counselors.find((item) => item.isPrimary) ??
    lead.counselors[0] ??
    null;

  return assignment
    ? { id: assignment.counselorId, name: assignment.counselor.name }
    : null;
}

function getCurrentLeadOwner(
  lead: LeadOwnershipRecord,
): PerformanceOwner | null {
  return (
    getCurrentAssignmentOwner(lead) ??
    (lead.createdById
      ? {
          id: lead.createdById,
          name: lead.createdBy?.name ?? "Not Assigned",
        }
      : null)
  );
}

function getCurrentStudentOwner(
  student: PerformanceStudentRecord | TargetStudentOwnershipRecord,
): PerformanceOwner | null {
  return (
    getCurrentAssignmentOwner(student.lead) ??
    (student.counselorId
      ? {
          id: student.counselorId,
          name: student.counselor?.name ?? "Not Assigned",
        }
      : null) ??
    getCurrentLeadOwner(student.lead)
  );
}

function getCurrentTargetLeadOwner(
  lead: TargetLeadOwnershipRecord,
): PerformanceOwner | null {
  return (
    getCurrentAssignmentOwner(lead) ??
    (lead.student?.counselorId
      ? {
          id: lead.student.counselorId,
          name: lead.student.counselor?.name ?? "Not Assigned",
        }
      : null) ??
    getCurrentLeadOwner(lead)
  );
}

function getOwnerFilterId(
  filters: PerformanceReportFilters,
  accessScope: PerformanceReportAccessScope,
): string | null {
  return accessScope.kind === "user"
    ? accessScope.userId
    : filters.counselorId || null;
}

function belongsToOwner(
  owner: PerformanceOwner | null,
  ownerId: string | null,
): boolean {
  return !ownerId || owner?.id === ownerId;
}

function getApplicationCountry(application: PerformanceApplicationRecord) {
  return application.countryName ?? application.country?.name ?? "Not Set";
}

function getApplicationUniversity(application: PerformanceApplicationRecord) {
  return application.universityName ?? application.university?.name ?? "Not Set";
}

function getApplicationCourse(application: PerformanceApplicationRecord) {
  return application.courseName ?? application.course?.name ?? "Not Set";
}

function getApplicationIntake(application: PerformanceApplicationRecord) {
  return application.intakeName ?? application.intake?.name ?? "Not Set";
}

function groupApplicationsByStudent(
  applications: PerformanceApplicationRecord[],
): Map<string, PerformanceApplicationRecord[]> {
  const grouped = new Map<string, PerformanceApplicationRecord[]>();

  for (const application of applications) {
    const rows = grouped.get(application.studentId) ?? [];
    rows.push(application);
    grouped.set(application.studentId, rows);
  }

  for (const [studentId, rows] of grouped) {
    grouped.set(
      studentId,
      rows.sort(
        (a, b) =>
          (b.applicationDate ?? b.createdAt).getTime() -
          (a.applicationDate ?? a.createdAt).getTime(),
      ),
    );
  }

  return grouped;
}

function mapLeadToRow(
  lead: PerformanceLeadRecord,
): PerformanceReportRow {
  const owner = getCurrentLeadOwner(lead);

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
  applications: PerformanceApplicationRecord[],
): PerformanceReportRow {
  const latestApplication = applications[0] ?? null;
  const owner = getCurrentStudentOwner(student);

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
      student.lead.convertedAt?.toISOString() ?? student.createdAt.toISOString(),
    nextFollowup: student.lead.nextFollowup?.toISOString() ?? null,
    applicationsCount: applications.length,
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
    casStatus: student.visaProfile?.casStatus ?? "",
    visaStatus: student.visaProfile?.visaStatus ?? "",
    loanStatus: student.loanProfile?.loanStatus ?? "",
    nbfc: student.loanProfile?.nbfc ?? "",
    fintechAssigneeName:
      student.loanProfile?.fintechAssignee?.name ?? "Not Assigned",
  };
}

function mapApplicationToExportRow(
  application: PerformanceApplicationRecord,
  student: PerformanceStudentRecord,
): PerformanceApplicationExportRow {
  const owner = getCurrentStudentOwner(student);

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
    countryName: getApplicationCountry(application),
    universityName: getApplicationUniversity(application),
    courseName: getApplicationCourse(application),
    intakeName: getApplicationIntake(application),
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
      student.loanProfile?.fintechAssignee?.name ?? "Not Assigned",
    nbfc: student.loanProfile?.nbfc ?? "",
    loanStatus: student.loanProfile?.loanStatus ?? "",
    pfStatus: student.loanProfile?.pfStatus ?? "",
    disbursed: student.loanProfile?.disbursed ?? false,
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
    const point = map.get(key) ?? {
      key,
      label: monthLabel(date),
      leads: 0,
      students: 0,
      applications: 0,
    };
    map.set(key, point);
    return point;
  };

  leads.forEach((lead) => {
    ensurePoint(lead.createdAt).leads += 1;
  });
  students.forEach((student) => {
    ensurePoint(student.lead.convertedAt ?? student.createdAt).students += 1;
  });
  applications.forEach((application) => {
    ensurePoint(application.applicationDate ?? application.createdAt).applications +=
      1;
  });

  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);
}

function buildCountryDemand(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applicationsByStudent: Map<string, PerformanceApplicationRecord[]>,
): PerformanceReportCountryPoint[] {
  const map = new Map<string, PerformanceReportCountryPoint>();
  const ensureCountry = (country: string) => {
    const key = country || "Not Set";
    const point = map.get(key) ?? {
      country: key,
      leads: 0,
      students: 0,
      applications: 0,
    };
    map.set(key, point);
    return point;
  };

  leads.forEach((lead) => {
    ensureCountry(lead.preferredCountry ?? "Not Set").leads += 1;
  });

  students.forEach((student) => {
    const applications = applicationsByStudent.get(student.id) ?? [];
    const countries = new Set(
      applications.map(getApplicationCountry).filter((country) => country),
    );

    if (countries.size === 0) {
      countries.add(student.lead.preferredCountry ?? "Not Set");
    }

    countries.forEach((country) => {
      ensureCountry(country).students += 1;
    });

    applications.forEach((application) => {
      ensureCountry(getApplicationCountry(application)).applications += 1;
    });
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      b.leads + b.students + b.applications -
      (a.leads + a.students + a.applications),
  );
}

function buildLeadStatusBreakdown(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
): PerformanceReportStatusPoint[] {
  const map = new Map<string, number>();

  leads.forEach((lead) => {
    const status = humanizeStatus(String(lead.status ?? ""));
    map.set(status, (map.get(status) ?? 0) + 1);
  });

  if (students.length > 0) {
    map.set("Converted", (map.get("Converted") ?? 0) + students.length);
  }

  return Array.from(map, ([status, count]) => ({ status, count })).sort(
    (a, b) => b.count - a.count,
  );
}

function buildLeadSourceBreakdown(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
): PerformanceReportSourcePoint[] {
  const map = new Map<string, { leads: number; students: number }>();
  const ensureSource = (source: string) => {
    const key = source || "Not Set";
    const point = map.get(key) ?? { leads: 0, students: 0 };
    map.set(key, point);
    return point;
  };

  leads.forEach((lead) => {
    ensureSource(lead.source ?? "Not Set").leads += 1;
  });
  students.forEach((student) => {
    ensureSource(student.lead.source ?? "Not Set").students += 1;
  });

  return Array.from(map, ([source, value]) => ({
    source,
    leads: value.leads,
    students: value.students,
    total: value.leads + value.students,
  })).sort((a, b) => b.total - a.total);
}

function buildStatusBreakdown(values: string[]): PerformanceReportStatusPoint[] {
  const map = new Map<string, number>();

  values.forEach((value) => {
    const status = humanizeStatus(value);
    map.set(status, (map.get(status) ?? 0) + 1);
  });

  return Array.from(map, ([status, count]) => ({ status, count })).sort(
    (a, b) => b.count - a.count,
  );
}

function buildBranchPerformance(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applications: PerformanceApplicationRecord[],
  targetMetrics: TargetMetrics,
): PerformanceReportBranchPoint[] {
  const map = new Map<string, BranchAccumulator>();
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const ensureBranch = (branchId: string, branch: string) => {
    const row = map.get(branchId) ?? {
      branchId,
      branch,
      ...metricAccumulator(),
    };
    map.set(branchId, row);
    return row;
  };

  targetMetrics.targetBranches.forEach((branch, branchId) => {
    ensureBranch(branchId, branch);
  });

  leads.forEach((lead) => {
    const row = ensureBranch(lead.branchId, lead.branch?.name ?? "Not Assigned");
    row.leads += 1;
    row.totalWalkins += 1;
    row.qualifiedLeads += normalizeStatus(String(lead.status)) === "qualified" ? 1 : 0;
    row.lostLeads += isLostLead(String(lead.status)) ? 1 : 0;
  });

  students.forEach((student) => {
    const row = ensureBranch(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    );
    row.students += 1;
    row.totalWalkins += 1;
    row.droppedStudents += isDroppedStudent(String(student.status)) ? 1 : 0;
    row.casReceived += isCasReceived(student.visaProfile?.casStatus) ? 1 : 0;
    row.visaApproved += isVisaApproved(student.visaProfile?.visaStatus) ? 1 : 0;
  });

  applications.forEach((application) => {
    const student = studentsById.get(application.studentId);
    if (!student) {
      return;
    }
    const row = ensureBranch(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
    );
    row.applications += 1;
    row.offers += isOfferStatus(String(application.offerStatus)) ? 1 : 0;
  });

  return Array.from(map.values())
    .map((row) => {
      const target = targetMetrics.branchTargets.get(row.branchId) ?? 0;
      const achieved = targetMetrics.branchAchievements.get(row.branchId) ?? 0;

      return {
        ...row,
        leadsCreated:
          targetMetrics.branchLeadsCreated.get(row.branchId) ?? 0,
        target,
        achieved,
        targetCompletionPercentage:
          target > 0 ? Number(((achieved / target) * 100).toFixed(1)) : 0,
        conversionRate:
          row.totalWalkins > 0
            ? Number(((row.students / row.totalWalkins) * 100).toFixed(1))
            : 0,
      };
    })
    .sort((a, b) => a.branch.localeCompare(b.branch));
}

function buildCounselorPerformance(
  leads: PerformanceLeadRecord[],
  students: PerformanceStudentRecord[],
  applications: PerformanceApplicationRecord[],
  targetMetrics: TargetMetrics,
  accessScope: PerformanceReportAccessScope,
): PerformanceReportCounselorPoint[] {
  const map = new Map<string, CounselorAccumulator>();
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const ensureCounselor = (
    branchId: string,
    branch: string,
    counselorId: string,
    counselor: string,
  ) => {
    const key = counselorMetricKey(branchId, counselorId);
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

  targetMetrics.performancePeople.forEach((person) => {
    ensureCounselor(
      person.branchId,
      person.branch,
      person.counselorId,
      person.counselor,
    );
  });

  leads.forEach((lead) => {
    const owner = getCurrentLeadOwner(lead);
    const counselorId = owner?.id ?? "unassigned";
    const counselor = owner?.name ?? "Unassigned";
    const row = ensureCounselor(
      lead.branchId,
      lead.branch?.name ?? "Not Assigned",
      counselorId,
      counselor,
    );
    row.leads += 1;
    row.totalWalkins += 1;
    row.qualifiedLeads += normalizeStatus(String(lead.status)) === "qualified" ? 1 : 0;
    row.lostLeads += isLostLead(String(lead.status)) ? 1 : 0;
  });

  students.forEach((student) => {
    const owner = getCurrentStudentOwner(student);
    const counselorId = owner?.id ?? "unassigned";
    const counselor = owner?.name ?? "Unassigned";
    const row = ensureCounselor(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
      counselorId,
      counselor,
    );
    row.students += 1;
    row.totalWalkins += 1;
    row.droppedStudents += isDroppedStudent(String(student.status)) ? 1 : 0;
    row.casReceived += isCasReceived(student.visaProfile?.casStatus) ? 1 : 0;
    row.visaApproved += isVisaApproved(student.visaProfile?.visaStatus) ? 1 : 0;
  });

  applications.forEach((application) => {
    const student = studentsById.get(application.studentId);
    if (!student) {
      return;
    }
    const owner = getCurrentStudentOwner(student);
    const counselorId = owner?.id ?? "unassigned";
    const counselor = owner?.name ?? "Unassigned";
    const row = ensureCounselor(
      student.branchId,
      student.branch?.name ?? "Not Assigned",
      counselorId,
      counselor,
    );
    row.applications += 1;
    row.offers += isOfferStatus(String(application.offerStatus)) ? 1 : 0;
  });

  return Array.from(map.values())
    .map((row) => {
      const key = counselorMetricKey(row.branchId, row.counselorId);
      const target = targetMetrics.counselorTargets.get(key) ?? 0;
      const achieved = targetMetrics.counselorAchievements.get(key) ?? 0;

      return {
        ...row,
        leadsCreated: targetMetrics.counselorLeadsCreated.get(key) ?? 0,
        target,
        achieved,
        targetCompletionPercentage:
          target > 0 ? Number(((achieved / target) * 100).toFixed(1)) : 0,
        conversionRate:
          row.totalWalkins > 0
            ? Number(((row.students / row.totalWalkins) * 100).toFixed(1))
            : 0,
      };
    })
    .sort(
      (a, b) =>
        a.branch.localeCompare(b.branch) ||
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
    targetAssignments: targetMetrics.targetAssignments,
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
      totalPipelineRecords > 0
        ? Number(((students.length / totalPipelineRecords) * 100).toFixed(1))
        : 0,
    offerApplications: applications.filter((application) =>
      isOfferStatus(String(application.offerStatus)),
    ).length,
    casReceivedStudents: students.filter((student) =>
      isCasReceived(student.visaProfile?.casStatus),
    ).length,
    visaApprovedStudents: students.filter((student) =>
      isVisaApproved(student.visaProfile?.visaStatus),
    ).length,
  };
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
  return !(
    filters.recordScope === "students" ||
    filters.leadStatus === CONVERTED_LEAD_STATUS ||
    hasStudentOnlyApplicationFilters(filters) ||
    hasComplianceFilters(filters)
  );
}

function shouldIncludeStudents(filters: PerformanceReportFilters): boolean {
  return !(
    filters.recordScope === "leads" ||
    (filters.leadStatus && filters.leadStatus !== CONVERTED_LEAD_STATUS)
  );
}

function buildApplicationWhere(
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

function buildLeadWhere(
  filters: PerformanceReportFilters,
  lookup: FilterLookup,
  accessScope: PerformanceReportAccessScope,
): Prisma.LeadWhereInput {
  const andConditions: Prisma.LeadWhereInput[] = [];
  const where: Prisma.LeadWhereInput = {
    leadType: STUDY_ABROAD_LEAD_TYPE as Prisma.LeadWhereInput["leadType"],
    isConverted: false,
    student: { is: null },
  };

  if (filters.search) {
    where.OR = [
      { leadNumber: { contains: filters.search, mode: "insensitive" } },
      { studentName: { contains: filters.search, mode: "insensitive" } },
      { emailId: { contains: filters.search, mode: "insensitive" } },
      { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      {
        preferredCountry: { contains: filters.search, mode: "insensitive" },
      },
      { preferredCourse: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  if (filters.counselorId && accessScope.kind !== "user") {
    andConditions.push({
      OR: [
        { createdById: filters.counselorId },
        { counselors: { some: { counselorId: filters.counselorId } } },
      ],
    });
  }

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

function buildStudentWhere(
  filters: PerformanceReportFilters,
  accessScope: PerformanceReportAccessScope,
): Prisma.StudentWhereInput {
  const andConditions: Prisma.StudentWhereInput[] = [];
  const where: Prisma.StudentWhereInput = {};
  const leadWhere: Prisma.LeadWhereInput = {};
  const applicationWhere = buildApplicationWhere(filters);
  const visaProfileWhere: Prisma.StudentVisaProfileWhereInput = {};
  const loanProfileWhere: Prisma.StudentLoanProfileWhereInput = {};

  if (filters.search) {
    where.OR = [
      { studentName: { contains: filters.search, mode: "insensitive" } },
      { emailId: { contains: filters.search, mode: "insensitive" } },
      { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      {
        lead: {
          is: {
            leadNumber: { contains: filters.search, mode: "insensitive" },
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
    andConditions.push({
      OR: [
        { counselorId: filters.counselorId },
        {
          lead: {
            is: {
              OR: [
                { createdById: filters.counselorId },
                {
                  counselors: {
                    some: { counselorId: filters.counselorId },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  if (filters.leadSource) {
    leadWhere.source = { equals: filters.leadSource, mode: "insensitive" };
  }
  if (filters.leadStatus === CONVERTED_LEAD_STATUS) {
    leadWhere.status = CONVERTED_LEAD_STATUS as Prisma.LeadWhereInput["status"];
  }
  if (Object.keys(leadWhere).length > 0) {
    where.lead = { is: leadWhere };
  }

  if (Object.keys(applicationWhere).length > 0) {
    where.applications = { some: applicationWhere };
  }

  if (filters.casStatus) {
    visaProfileWhere.casStatus =
      filters.casStatus as Prisma.StudentVisaProfileWhereInput["casStatus"];
  }
  if (filters.visaStatus) {
    visaProfileWhere.visaStatus =
      filters.visaStatus as Prisma.StudentVisaProfileWhereInput["visaStatus"];
  }
  if (Object.keys(visaProfileWhere).length > 0) {
    where.visaProfile = { is: visaProfileWhere };
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
    where.loanProfile = { is: loanProfileWhere };
  }

  const dateRange = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );
  if (dateRange) {
    andConditions.push({
      OR: [
        { lead: { is: { convertedAt: dateRange } } },
        {
          AND: [
            { lead: { is: { convertedAt: null } } },
            { createdAt: dateRange },
          ],
        },
      ],
    });
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
          where: { id: filters.countryId },
          select: { name: true },
        })
      : Promise.resolve(null),
    filters.intakeId
      ? db.intake.findUnique({
          where: { id: filters.intakeId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    countryName: country?.name ?? "",
    intakeName: intake?.name ?? "",
  };
}

async function getTargetMetrics(
  filters: PerformanceReportFilters,
  lookup: FilterLookup,
  accessScope: PerformanceReportAccessScope,
): Promise<TargetMetrics> {
  const targetConditions: Prisma.CounsellorIntakeTargetWhereInput[] = [];
  const achievementConditions: Prisma.StudentWhereInput[] = [];
  const leadConditions: Prisma.LeadWhereInput[] = [];
  const ownerId = getOwnerFilterId(filters, accessScope);
  const dateRange = getDateRange(
    filters.datePreset,
    filters.startDate,
    filters.endDate,
  );

  if (filters.branchId) {
    targetConditions.push({ branchId: filters.branchId });
    achievementConditions.push({ branchId: filters.branchId });
    leadConditions.push({ branchId: filters.branchId });
  }

  if (ownerId) {
    targetConditions.push({ counsellorId: ownerId });
    achievementConditions.push({
      OR: [
        { counselorId: ownerId },
        { lead: { is: { createdById: ownerId } } },
        {
          lead: {
            is: {
              counselors: { some: { counselorId: ownerId } },
            },
          },
        },
      ],
    });
    leadConditions.push({
      OR: [
        { createdById: ownerId },
        { counselors: { some: { counselorId: ownerId } } },
        { student: { is: { counselorId: ownerId } } },
      ],
    });
  }

  if (filters.intakeId) {
    targetConditions.push({ intakeId: filters.intakeId });
    achievementConditions.push({
      applications: { some: { intakeId: filters.intakeId } },
    });
  }

  if (dateRange) {
    achievementConditions.push({
      OR: [
        { lead: { is: { convertedAt: dateRange } } },
        {
          AND: [
            { lead: { is: { convertedAt: null } } },
            { createdAt: dateRange },
          ],
        },
      ],
    });
    leadConditions.push({ createdAt: dateRange });
  }

  if (lookup.intakeName) {
    leadConditions.push({
      preferredIntake: { contains: lookup.intakeName, mode: "insensitive" },
    });
  }

  if (accessScope.kind === "branches") {
    targetConditions.push({ branchId: { in: accessScope.branchIds } });
    achievementConditions.push({ branchId: { in: accessScope.branchIds } });
    leadConditions.push({ branchId: { in: accessScope.branchIds } });
  }

  const [targets, achievementCandidates, leadCandidates] = await Promise.all([
    db.counsellorIntakeTarget.findMany({
      where:
        targetConditions.length > 0 ? { AND: targetConditions } : undefined,
      select: {
        branchId: true,
        counsellorId: true,
        target: true,
        branch: { select: { name: true } },
        counsellor: { select: { name: true } },
      },
    }),
    shouldIncludeStudents(filters)
      ? db.student.findMany({
          where:
            achievementConditions.length > 0
              ? { AND: achievementConditions }
              : undefined,
          select: {
            branchId: true,
            counselorId: true,
            counselor: { select: { id: true, name: true } },
            lead: {
              select: {
                createdById: true,
                createdBy: { select: { id: true, name: true } },
                counselors: {
                  orderBy: [
                    { isPrimary: "desc" },
                    { assignedAt: "desc" },
                  ],
                  select: {
                    counselorId: true,
                    isPrimary: true,
                    assignedAt: true,
                    counselor: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([] as TargetStudentOwnershipRecord[]),
    db.lead.findMany({
      where: {
        leadType: STUDY_ABROAD_LEAD_TYPE as Prisma.LeadWhereInput["leadType"],
        ...(leadConditions.length > 0 && { AND: leadConditions }),
      },
      select: {
        branchId: true,
        createdById: true,
        createdBy: { select: { id: true, name: true } },
        counselors: {
          orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
          select: {
            counselorId: true,
            isPrimary: true,
            assignedAt: true,
            counselor: { select: { id: true, name: true } },
          },
        },
        student: {
          select: {
            counselorId: true,
            counselor: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  const achievements = achievementCandidates
    .map((student) => ({
      branchId: student.branchId,
      owner: getCurrentStudentOwner(student),
    }))
    .filter((row) => belongsToOwner(row.owner, ownerId));
  const createdLeads = leadCandidates
    .map((lead) => ({
      branchId: lead.branchId,
      owner: getCurrentTargetLeadOwner(lead),
    }))
    .filter((row) => belongsToOwner(row.owner, ownerId));
  const branchIds = Array.from(
    new Set([
      ...targets.map((row) => row.branchId),
      ...achievements.map((row) => row.branchId),
      ...createdLeads.map((row) => row.branchId),
    ]),
  );
  const branches = branchIds.length
    ? await db.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true },
      })
    : [];
  const branchNames = new Map(branches.map((row) => [row.id, row.name]));
  const branchTargets = new Map<string, number>();
  const branchAchievements = new Map<string, number>();
  const branchLeadsCreated = new Map<string, number>();
  const counselorTargets = new Map<string, number>();
  const counselorAchievements = new Map<string, number>();
  const counselorLeadsCreated = new Map<string, number>();
  const performancePeople = new Map<string, PerformancePerson>();
  const targetBranches = new Map<string, string>();

  const ensurePerson = (
    branchId: string,
    counselorId: string,
    counselor: string,
  ) => {
    const key = counselorMetricKey(branchId, counselorId);
    performancePeople.set(key, {
      branchId,
      branch: branchNames.get(branchId) ?? "Not Assigned",
      counselorId,
      counselor,
    });
    return key;
  };

  targets.forEach((row) => {
    const key = ensurePerson(
      row.branchId,
      row.counsellorId,
      row.counsellor.name,
    );
    targetBranches.set(row.branchId, row.branch.name);
    branchTargets.set(
      row.branchId,
      (branchTargets.get(row.branchId) ?? 0) + row.target,
    );
    counselorTargets.set(key, (counselorTargets.get(key) ?? 0) + row.target);
  });

  achievements.forEach((row) => {
    branchAchievements.set(
      row.branchId,
      (branchAchievements.get(row.branchId) ?? 0) + 1,
    );
    if (row.owner) {
      const key = ensurePerson(row.branchId, row.owner.id, row.owner.name);
      counselorAchievements.set(
        key,
        (counselorAchievements.get(key) ?? 0) + 1,
      );
    }
  });

  createdLeads.forEach((row) => {
    branchLeadsCreated.set(
      row.branchId,
      (branchLeadsCreated.get(row.branchId) ?? 0) + 1,
    );
    if (row.owner) {
      const key = ensurePerson(row.branchId, row.owner.id, row.owner.name);
      counselorLeadsCreated.set(
        key,
        (counselorLeadsCreated.get(key) ?? 0) + 1,
      );
    }
  });

  return {
    totalTarget: targets.reduce((total, row) => total + row.target, 0),
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

  return {
    search: clean(searchParams.get("search")),
    recordScope: allowedScopes.includes(requestedScope as ReportRecordScope)
      ? (requestedScope as ReportRecordScope)
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
    datePreset: allowedPresets.includes(requestedPreset as ReportDatePreset)
      ? (requestedPreset as ReportDatePreset)
      : "all",
    startDate: clean(searchParams.get("startDate")),
    endDate: clean(searchParams.get("endDate")),
  };
}

export function parsePerformanceReportPagination(searchParams: URLSearchParams) {
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
  const [leadCandidates, studentCandidates, targetMetrics] = await Promise.all([
    shouldIncludeLeads(filters)
      ? db.lead.findMany({
          where: buildLeadWhere(filters, lookup, accessScope),
          select: performanceLeadSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as PerformanceLeadRecord[]),
    shouldIncludeStudents(filters)
      ? db.student.findMany({
          where: buildStudentWhere(filters, accessScope),
          select: performanceStudentSelect,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as PerformanceStudentRecord[]),
    getTargetMetrics(filters, lookup, accessScope),
  ]);
  const ownerId = getOwnerFilterId(filters, accessScope);
  const leads = leadCandidates.filter((lead) =>
    belongsToOwner(getCurrentLeadOwner(lead), ownerId),
  );
  const students = studentCandidates.filter((student) =>
    belongsToOwner(getCurrentStudentOwner(student), ownerId),
  );
  const studentIds = students.map((student) => student.id);
  const applications = studentIds.length
    ? await db.studentApplication.findMany({
        where: {
          ...buildApplicationWhere(filters),
          studentId: { in: studentIds },
        },
        select: performanceApplicationSelect,
        orderBy: [{ applicationDate: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const applicationsByStudent = groupApplicationsByStudent(applications);
  const allRows = [
    ...leads.map(mapLeadToRow),
    ...students.map((student) =>
      mapStudentToRow(
        student,
        applicationsByStudent.get(student.id) ?? [],
      ),
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
        return student
          ? [mapApplicationToExportRow(application, student)]
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
      students.map((student) => String(student.visaProfile?.visaStatus ?? "")),
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
      accessScope,
    ),
    rows: allRows.slice(start, start + limit),
    ...(applicationRows && { applicationRows }),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

export function getPerformanceReportForExport(
  filters: PerformanceReportFilters,
  accessScope: PerformanceReportAccessScope = FULL_PERFORMANCE_ACCESS,
) {
  return getPerformanceReport(
    filters,
    1,
    Number.MAX_SAFE_INTEGER,
    true,
    accessScope,
  );
}

export async function getPerformanceReportFilterOptions(
  accessScope: PerformanceReportAccessScope = FULL_PERFORMANCE_ACCESS,
): Promise<PerformanceReportFilterOptions> {
  const branchWhere: Prisma.BranchWhereInput =
    accessScope.kind === "branches"
      ? { id: { in: accessScope.branchIds } }
      : accessScope.kind === "user"
        ? { users: { some: { id: accessScope.userId } } }
        : {};
  const counselorWhere: Prisma.UserWhereInput =
    accessScope.kind === "user"
      ? { id: accessScope.userId }
      : {
          role: {
            is: {
              name: {
                in: COUNSELLOR_ROLE_NAMES,
                mode: "insensitive",
              },
            },
          },
          ...(accessScope.kind === "branches" && {
            branches: { some: { id: { in: accessScope.branchIds } } },
          }),
        };
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
      where: branchWhere,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // db.user.findMany({
    //   where: counselorWhere,
    //   select: {
    //     id: true,
    //     name: true,
    //     branches: { select: { id: true } },
    //   },
    //   orderBy: { name: "asc" },
    // }),
    db.user.findMany({
  select: {
    id: true,
    name: true,
    role: {
      select: {
        name: true,
      },
    },
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

  return {
    access: { kind: accessScope.kind },
    branches: branches.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
counselors: counselors.map((user) => ({
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
    fintechAssignees: fintechProfiles
      .map((profile) => profile.fintechAssignee)
      .filter(
        (assignee): assignee is { id: string; name: string } =>
          Boolean(assignee),
      )
      .map((assignee) => ({ value: assignee.id, label: assignee.name }))
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
    applicationStatuses: applicationStatuses.map((row) => String(row.status)),
    casStatuses: uniqueSorted(visaProfiles.map((row) => String(row.casStatus))),
    visaStatuses: uniqueSorted(
      visaProfiles.map((row) => String(row.visaStatus)),
    ),
    loanStatuses: uniqueSorted(loanProfiles.map((row) => row.loanStatus)),
    nbfcs: uniqueSorted(loanProfiles.map((row) => row.nbfc)),
  };
}
