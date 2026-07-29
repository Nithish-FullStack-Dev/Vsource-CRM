import type { Prisma } from "@/generated/prisma/client";
import {
  emptyPerformanceMetrics,
  finalizePerformanceMetrics,
} from "@/lib/performance-report-calculations";
import {
  dateInReportRange,
  resolveReportDateRange,
  type ReportDateRange,
} from "@/lib/report-date-range";
import {
  getSharedReportFilterOptions,
  loadReportDataset,
  type CommonReportFilters,
  type ReportAccessScope,
  type ReportApplication,
  type ReportDataset,
  type ReportLead,
  type ReportMetricEvent,
  type ReportStudent,
} from "@/lib/report-data";
import {
  isLoanApproved,
  isLoanDisbursed,
  isReferenceSource,
  isSameDayApplication,
  isUniversityApplied,
  normalizeReportValue,
  resolveStudentConversionDate,
} from "@/lib/report-metric-rules";
import db from "@/lib/prisma";
import { resolveFinalLeadOwner, resolveFinalStudentOwner } from "@/lib/report-owner";
import type {
  PerformanceApplicationExportRow,
  PerformanceReportBranchPoint,
  PerformanceReportCountryPoint,
  PerformanceReportCounselorPoint,
  PerformanceReportData,
  PerformanceReportFilterOptions,
  PerformanceReportFilters,
  PerformanceReportMetricRow,
  PerformanceReportMonthlyPoint,
  PerformanceReportRow,
  PerformanceReportSourcePoint,
  PerformanceReportStatusPoint,
  ReportDatePreset,
  ReportRecordScope,
} from "@/types/performance-report";

export type PerformanceReportAccessScope = ReportAccessScope;

const ALL_ACCESS: PerformanceReportAccessScope = { kind: "all" };
const metricKeys = [
  "walkIns",
  "references",
  "activeWalkIns",
  "walkInDropLost",
  "studentDropInactive",
  "applications",
  "sameDayApplications",
  "oldWalkInApplications",
  "universityApplications",
  "offers",
  "casApplied",
  "casReceived",
  "visaApplied",
  "visaApproved",
  "loanApplications",
  "outsideLoan",
  "loanApproved",
  "loanDisbursed",
] as const;

const clean = (value: unknown) => String(value ?? "").trim();
const humanize = (value: unknown) =>
  clean(value)
    ? clean(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not Set";

function commonFilters(filters: PerformanceReportFilters): CommonReportFilters {
  return { ...filters };
}

function eventInRange(event: ReportMetricEvent, range: ReportDateRange | null) {
  return dateInReportRange(event.date, range);
}

function addEvent(target: PerformanceReportMetricRow, event: ReportMetricEvent) {
  for (const key of metricKeys) target[key] += event.values[key];
}

function metricFromEvents(events: ReportMetricEvent[]): PerformanceReportMetricRow {
  const metric = emptyPerformanceMetrics();
  for (const event of events) addEvent(metric, event);
  return finalizePerformanceMetrics(metric);
}

function monthKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildMonthlyVolume(events: ReportMetricEvent[]): PerformanceReportMonthlyPoint[] {
  const rows = new Map<string, PerformanceReportMonthlyPoint>();
  for (const event of events) {
    const key = monthKey(event.date);
    const row = rows.get(key) ?? {
      key,
      label: monthLabel(event.date),
      walkIns: 0,
      applications: 0,
      universityApplications: 0,
      loanApplications: 0,
      visaApproved: 0,
    };
    row.walkIns += event.values.walkIns;
    row.applications += event.values.applications;
    row.universityApplications += event.values.universityApplications;
    row.loanApplications += event.values.loanApplications;
    row.visaApproved += event.values.visaApproved;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function buildCountryDemand(events: ReportMetricEvent[]): PerformanceReportCountryPoint[] {
  const rows = new Map<string, PerformanceReportCountryPoint>();
  for (const event of events) {
    const country = event.countryName || "Not Set";
    const row = rows.get(country) ?? {
      country,
      walkIns: 0,
      applications: 0,
      universityApplications: 0,
    };
    row.walkIns += event.values.walkIns;
    row.applications += event.values.applications;
    row.universityApplications += event.values.universityApplications;
    rows.set(country, row);
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.universityApplications - a.universityApplications ||
      b.applications - a.applications ||
      a.country.localeCompare(b.country),
  );
}

function buildStatusBreakdown(values: unknown[]): PerformanceReportStatusPoint[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const status = humanize(value);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

function buildSourceBreakdown(
  leads: ReportLead[],
  students: ReportStudent[],
): PerformanceReportSourcePoint[] {
  const rows = new Map<string, PerformanceReportSourcePoint>();
  const add = (sourceValue: unknown, key: "walkIns" | "applications") => {
    const source = clean(sourceValue) || "Not Set";
    const row = rows.get(source) ?? { source, walkIns: 0, applications: 0, total: 0 };
    row[key] += 1;
    row.total += 1;
    rows.set(source, row);
  };
  leads.forEach((lead) => add(lead.source, "walkIns"));
  students.forEach((student) => add(student.lead.source, "applications"));
  return [...rows.values()].sort((a, b) => b.total - a.total || a.source.localeCompare(b.source));
}

type TargetMetrics = {
  totalTarget: number;
  targetAssignments: number;
  branchTargets: Map<string, number>;
  counselorTargets: Map<string, number>;
  branches: Map<string, string>;
  counselors: Map<
    string,
    { branchId: string; branch: string; counselorId: string; counselor: string; }
  >;
};

async function getTargets(
  filters: PerformanceReportFilters,
  access: PerformanceReportAccessScope,
): Promise<TargetMetrics> {
  const where: Prisma.CounsellorIntakeTargetWhereInput = {
    ...(filters.branchId && { branchId: filters.branchId }),
    ...(filters.intakeId && { intakeId: filters.intakeId }),
    ...(filters.counselorId && { counsellorId: filters.counselorId }),
    ...(access.kind === "branches" && { branchId: { in: access.branchIds } }),
    ...(access.kind === "user" && { counsellorId: access.userId }),
  };
  const rows = await db.counsellorIntakeTarget.findMany({
    where,
    select: {
      branchId: true,
      counsellorId: true,
      target: true,
      branch: { select: { name: true } },
      counsellor: { select: { name: true } },
    },
  });
  const branchTargets = new Map<string, number>();
  const counselorTargets = new Map<string, number>();
  const branches = new Map<string, string>();
  const counselors = new Map<
    string,
    { branchId: string; branch: string; counselorId: string; counselor: string; }
  >();
  for (const row of rows) {
    branchTargets.set(row.branchId, (branchTargets.get(row.branchId) ?? 0) + row.target);
    branches.set(row.branchId, row.branch.name);
    const key = `${row.branchId}:${row.counsellorId}`;
    counselorTargets.set(key, (counselorTargets.get(key) ?? 0) + row.target);
    counselors.set(key, {
      branchId: row.branchId,
      branch: row.branch.name,
      counselorId: row.counsellorId,
      counselor: row.counsellor.name,
    });
  }
  return {
    totalTarget: rows.reduce((sum, row) => sum + row.target, 0),
    targetAssignments: rows.length,
    branchTargets,
    counselorTargets,
    branches,
    counselors,
  };
}

function buildBranchPerformance(
  events: ReportMetricEvent[],
  targets: TargetMetrics,
): PerformanceReportBranchPoint[] {
  const rows = new Map<string, PerformanceReportBranchPoint>();
  for (const event of events) {
    const row = rows.get(event.branchId) ?? {
      branchId: event.branchId,
      branch: event.branchName,
      ...emptyPerformanceMetrics(),
    };
    addEvent(row, event);
    rows.set(event.branchId, row);
  }
  for (const [branchId, target] of targets.branchTargets) {
    const row =
      rows.get(branchId) ?? {
        branchId,
        branch: targets.branches.get(branchId) ?? "Not Assigned",
        ...emptyPerformanceMetrics(),
      };
    row.target = target;
    rows.set(branchId, row);
  }
  return [...rows.values()]
    .map((row) => {
      row.achieved = row.visaApproved;
      return finalizePerformanceMetrics(row);
    })
    .sort((a, b) => a.branch.localeCompare(b.branch));
}

function buildCounselorPerformance(
  events: ReportMetricEvent[],
  targets: TargetMetrics,
): PerformanceReportCounselorPoint[] {
  const rows = new Map<string, PerformanceReportCounselorPoint>();
  for (const event of events) {
    const key = `${event.branchId}:${event.ownerId}`;
    const row = rows.get(key) ?? {
      branchId: event.branchId,
      branch: event.branchName,
      counselorId: event.ownerId,
      counselor: event.ownerName,
      ...emptyPerformanceMetrics(),
    };
    addEvent(row, event);
    rows.set(key, row);
  }
  for (const [key, target] of targets.counselorTargets) {
    const person = targets.counselors.get(key);
    const row =
      rows.get(key) ?? {
        branchId: person?.branchId ?? "",
        branch: person?.branch ?? "Not Assigned",
        counselorId: person?.counselorId ?? key.split(":").at(-1) ?? "",
        counselor: person?.counselor ?? "Not Assigned",
        ...emptyPerformanceMetrics(),
      };
    row.target = target;
    rows.set(key, row);
  }
  return [...rows.values()]
    .map((row) => {
      row.achieved = row.visaApproved;
      return finalizePerformanceMetrics(row);
    })
    .sort(
      (a, b) => a.branch.localeCompare(b.branch) || a.counselor.localeCompare(b.counselor),
    );
}

function latestApplication(applications: ReportApplication[]) {
  return applications[0] ?? null;
}

function loanSnapshot(student: ReportStudent) {
  const loan = student.lead.loanApplication;
  const profile = student.loanProfile;
  const status = clean(loan?.loanStatus ?? profile?.loanStatus);
  return {
    status,
    applied: Boolean(student.lead.loanRequirement || loan),
    outside: !student.lead.loanRequirement,
    approved: Boolean(loan && isLoanApproved(loan.loanStatus, loan.sanctionedAmount)),
    disbursed: Boolean(
      loan
        ? isLoanDisbursed(loan.loanStatus, loan.disbursementStatus, loan.disbursedAmount)
        : profile?.disbursed,
    ),
    nbfc: clean(loan?.bankApplications[0]?.bank.name ?? profile?.nbfc),
    fintechAssigneeName: clean(loan?.fintechAssignee?.name ?? profile?.fintechAssignee?.name),
  };
}

function mapLeadRow(lead: ReportLead): PerformanceReportRow {
  const owner = resolveFinalLeadOwner(lead);
  const loan = lead.loanApplication;
  return {
    recordType: "lead",
    recordId: lead.id,
    leadId: lead.id,
    leadNumber: lead.leadNumber,
    studentId: null,
    studentName: clean(lead.studentName),
    emailId: clean(lead.emailId),
    mobileNumber: clean(lead.mobileNumber),
    branchId: lead.branchId,
    branchName: lead.branch.name,
    counselorId: owner.id || null,
    counselorName: owner.name,
    source: clean(lead.source),
    isReference: isReferenceSource(lead.source),
    countryName: clean(lead.preferredCountry),
    intakeName: clean(lead.preferredIntake),
    courseName: clean(lead.preferredCourse),
    lifecycleStatus: String(lead.status),
    currentStage: lead.isConverted ? "Converted" : "Walk-in",
    createdAt: lead.createdAt.toISOString(),
    convertedAt: lead.convertedAt?.toISOString() ?? null,
    applicationTiming: null,
    nextFollowup: lead.nextFollowup?.toISOString() ?? null,
    applicationsCount: 0,
    latestApplicationId: null,
    latestUniversityName: "",
    latestApplicationDate: null,
    latestApplicationStatus: "",
    latestOfferStatus: "",
    casStatus: "",
    visaStatus: "",
    loanStatus: clean(loan?.loanStatus),
    loanApplication: Boolean(lead.loanRequirement || loan),
    outsideLoan: !lead.loanRequirement,
    loanApproved: Boolean(loan && isLoanApproved(loan.loanStatus, loan.sanctionedAmount)),
    loanDisbursed: Boolean(
      loan && isLoanDisbursed(loan.loanStatus, loan.disbursementStatus, loan.disbursedAmount),
    ),
    nbfc: clean(loan?.bankApplications[0]?.bank.name),
    fintechAssigneeName: clean(loan?.fintechAssignee?.name),
  };
}

function mapStudentRow(
  student: ReportStudent,
  applications: ReportApplication[],
): PerformanceReportRow {
  const owner = resolveFinalStudentOwner(student);
  const latest = latestApplication(applications);
  const loan = loanSnapshot(student);
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
    branchName: student.branch.name,
    counselorId: owner.id || null,
    counselorName: owner.name,
    source: clean(student.lead.source),
    isReference: isReferenceSource(student.lead.source),
    countryName: clean(latest?.countryName ?? latest?.country?.name ?? student.lead.preferredCountry),
    intakeName: clean(latest?.intakeName ?? latest?.intake?.name ?? student.lead.preferredIntake),
    courseName: clean(latest?.courseName ?? latest?.course?.name ?? student.lead.preferredCourse),
    lifecycleStatus: String(student.status),
    currentStage: humanize(student.currentStage),
    createdAt: resolveStudentConversionDate(student).toISOString(),
    convertedAt: resolveStudentConversionDate(student).toISOString(),
    applicationTiming: isSameDayApplication(student) ? "same_day" : "old_walkin",
    nextFollowup: student.lead.nextFollowup?.toISOString() ?? null,
    applicationsCount: applications.filter((row) => isUniversityApplied(row.status)).length,
    latestApplicationId: latest?.id ?? null,
    latestUniversityName: clean(latest?.universityName ?? latest?.university?.name),
    latestApplicationDate: (latest?.applicationDate ?? latest?.createdAt)?.toISOString() ?? null,
    latestApplicationStatus: clean(latest?.status),
    latestOfferStatus: clean(latest?.offerStatus),
    casStatus: clean(student.visaProfile?.casStatus),
    visaStatus: clean(student.visaProfile?.visaStatus),
    loanStatus: loan.status,
    loanApplication: loan.applied,
    outsideLoan: loan.outside,
    loanApproved: loan.approved,
    loanDisbursed: loan.disbursed,
    nbfc: loan.nbfc,
    fintechAssigneeName: loan.fintechAssigneeName,
  };
}

function mapApplicationExport(
  application: ReportApplication,
  student: ReportStudent,
): PerformanceApplicationExportRow {
  const owner = resolveFinalStudentOwner(student);
  const loan = loanSnapshot(student);
  return {
    applicationId: application.id,
    studentId: student.id,
    leadNumber: student.lead.leadNumber,
    studentName: student.studentName,
    emailId: student.emailId,
    mobileNumber: student.mobileNumber,
    branchName: student.branch.name,
    counselorName: owner.name,
    source: clean(student.lead.source),
    countryName: clean(application.countryName ?? application.country?.name),
    universityName: clean(application.universityName ?? application.university?.name),
    courseName: clean(application.courseName ?? application.course?.name),
    intakeName: clean(application.intakeName ?? application.intake?.name),
    portal: clean(application.portal),
    applicationDate: (application.applicationDate ?? application.createdAt).toISOString(),
    applicationStatus: clean(application.status),
    offerStatus: clean(application.offerStatus),
    depositStatus: clean(student.visaProfile?.depositStatus),
    ihsPaidStatus: clean(student.visaProfile?.ihsPaidStatus),
    visaPaidStatus: clean(student.visaProfile?.visaPaidStatus),
    casStatus: clean(student.visaProfile?.casStatus),
    visaStatus: clean(student.visaProfile?.visaStatus),
    fintechAssigneeName: loan.fintechAssigneeName,
    nbfc: loan.nbfc,
    loanStatus: loan.status,
    pfStatus: clean(student.loanProfile?.pfStatus),
    disbursed: loan.disbursed,
  };
}

function filteredRecords(dataset: ReportDataset, range: ReportDateRange | null) {
  const leads = dataset.leads.filter((lead) => dateInReportRange(lead.createdAt, range));
  const students = dataset.students.filter((student) =>
    dateInReportRange(resolveStudentConversionDate(student), range),
  );
  const applications = dataset.applications.filter((application) =>
    dateInReportRange(application.applicationDate ?? application.createdAt, range),
  );
  return { leads, students, applications };
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
  const datePreset = clean(searchParams.get("datePreset")) as ReportDatePreset;
  const recordScope = clean(searchParams.get("recordScope")) as ReportRecordScope;
  return {
    search: clean(searchParams.get("search")),
    recordScope: scopes.includes(recordScope) ? recordScope : "all",
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
    datePreset: presets.includes(datePreset) ? datePreset : "all",
    startDate: clean(searchParams.get("startDate")),
    endDate: clean(searchParams.get("endDate")),
  };
}

function positiveInteger(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export function parsePerformanceReportPagination(searchParams: URLSearchParams) {
  return {
    page: positiveInteger(searchParams.get("page"), 1, 100_000),
    limit: positiveInteger(searchParams.get("limit"), 20, 100),
  };
}

export async function getPerformanceReport(
  filters: PerformanceReportFilters,
  page: number,
  limit: number,
  includeApplicationRows = false,
  access: PerformanceReportAccessScope = ALL_ACCESS,
): Promise<PerformanceReportData> {
  const [dataset, targets] = await Promise.all([
    loadReportDataset(commonFilters(filters), access),
    getTargets(filters, access),
  ]);
  const range = resolveReportDateRange(filters.datePreset, filters.startDate, filters.endDate);
  const events = dataset.events.filter((event) => eventInRange(event, range));
  const records = filteredRecords(dataset, range);
  const studentApplications = new Map<string, ReportApplication[]>();
  for (const application of records.applications) {
    const list = studentApplications.get(application.studentId) ?? [];
    list.push(application);
    studentApplications.set(application.studentId, list);
  }

  const allRows = [
    ...records.leads.map(mapLeadRow),
    ...records.students.map((student) =>
      mapStudentRow(student, studentApplications.get(student.id) ?? []),
    ),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const baseSummary = metricFromEvents(events);
  baseSummary.target = targets.totalTarget;
  baseSummary.achieved = baseSummary.visaApproved;
  finalizePerformanceMetrics(baseSummary);

  const studentMap = new Map(dataset.students.map((student) => [student.id, student]));
  const applicationRows = includeApplicationRows
    ? records.applications.flatMap((application) => {
      const student = studentMap.get(application.studentId);
      return student ? [mapApplicationExport(application, student)] : [];
    })
    : undefined;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      ...baseSummary,
      totalPipelineRecords: records.leads.length + records.students.length,
      totalLeads: records.leads.length,
      totalStudents: records.students.length,
      totalApplications: records.applications.filter((row) => isUniversityApplied(row.status)).length,
      targetAssignments: targets.targetAssignments,
    },
    monthlyVolume: buildMonthlyVolume(events),
    countryDemand: buildCountryDemand(events),
    leadStatusBreakdown: buildStatusBreakdown(records.leads.map((lead) => lead.status)),
    leadSourceBreakdown: buildSourceBreakdown(records.leads, records.students),
    applicationStatusBreakdown: buildStatusBreakdown(records.applications.map((row) => row.status)),
    visaStatusBreakdown: buildStatusBreakdown(records.students.map((row) => row.visaProfile?.visaStatus)),
    loanStatusBreakdown: buildStatusBreakdown(
      dataset.loans
        .filter((row) =>
          dateInReportRange(row.enquiryDate ?? row.createdAt, range),
        )
        .map((row) => row.loanStatus),
    ),
    branchPerformance: buildBranchPerformance(events, targets),
    counselorPerformance: buildCounselorPerformance(events, targets),
    rows: allRows.slice(start, start + limit),
    ...(applicationRows && { applicationRows }),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

export function getPerformanceReportForExport(
  filters: PerformanceReportFilters,
  access: PerformanceReportAccessScope = ALL_ACCESS,
) {
  return getPerformanceReport(filters, 1, Number.MAX_SAFE_INTEGER, true, access);
}

export async function getPerformanceReportFilterOptions(
  access: PerformanceReportAccessScope = ALL_ACCESS,
): Promise<PerformanceReportFilterOptions> {
  const options = await getSharedReportFilterOptions(access);
  return {
    access: { kind: access.kind },
    branches: options.branches,
    counselors: options.users.map((user) => ({
      value: user.value,
      label: user.label,
      branchIds: user.branchIds,
      roleName: user.roleName,
    })),
    countries: options.countries,
    intakes: options.intakes,
    universities: options.universities.map((item) => ({
      value: item.value,
      label: item.label,
      countryId: item.countryId ?? "",
    })),
    fintechAssignees: options.fintechAssignees,
    leadStatuses: options.leadStatuses,
    leadSources: options.sources,
    applicationStatuses: options.applicationStatuses,
    casStatuses: options.casStatuses,
    visaStatuses: options.visaStatuses,
    loanStatuses: options.loanStatuses,
    nbfcs: options.nbfcs,
  };
}
