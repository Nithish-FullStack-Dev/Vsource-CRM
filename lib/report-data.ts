import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import {
  resolveFinalLeadOwner,
  resolveFinalLoanOwner,
  resolveFinalStudentOwner,
  type ReportOwnerPerson,
} from "@/lib/report-owner";
import {
  isCasApplied,
  isCasReceived,
  isStudentDropInactive,
  isWalkInDropLost,
  isLoanApproved,
  isLoanDisbursed,
  isOfferReceived,
  isOldWalkInApplication,
  isReferenceSource,
  isSameDayApplication,
  isUniversityApplied,
  isVisaApplied,
  isVisaApproved,
  normalizeReportValue,
  resolveStudentConversionDate,
  toReportNumber,
} from "@/lib/report-metric-rules";

const personSelect = { id: true, name: true } as const;
const assignmentSelect = {
  counselorId: true,
  assignedAt: true,
  isPrimary: true,
  counselor: { select: personSelect },
} as const;

const loanSnapshotSelect = {
  id: true,
  loanStatus: true,
  fintechAssigneeId: true,
  fintechAssignee: { select: personSelect },
  requiredLoanAmount: true,
  sanctionedAmount: true,
  disbursedAmount: true,
  sanctionDate: true,
  disbursementStatus: true,
  disbursementDate: true,
  depositStatus: true,
  bankApplications: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { bank: { select: { name: true } } },
  },
} as const;

export const reportLeadSelect = {
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
  isConverted: true,
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
  counselors: { orderBy: { assignedAt: "desc" }, select: assignmentSelect },
  loanApplication: { select: loanSnapshotSelect },
} satisfies Prisma.LeadSelect;

export const reportStudentSelect = {
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
  lead: { select: reportLeadSelect },
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
      disbursedDate: true,
      fintechAssignee: { select: personSelect },
    },
  },
} satisfies Prisma.StudentSelect;

export const reportApplicationSelect = {
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

export const reportLoanSelect = {
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
  requiredLoanAmount: true,
  sanctionedAmount: true,
  disbursedAmount: true,
  sanctionDate: true,
  disbursementStatus: true,
  disbursementDate: true,
  depositStatus: true,
  createdAt: true,
  branch: { select: { id: true, name: true } },
  counselor: { select: personSelect },
  fintechAssignee: { select: personSelect },
  createdBy: { select: personSelect },
  bankApplications: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { bank: { select: { name: true } } },
  },
  lead: {
    select: {
      id: true,
      leadNumber: true,
      source: true,
      loanRequirement: true,
      createdById: true,
      convertedById: true,
      convertedAt: true,
      createdAt: true,
      createdBy: { select: personSelect },
      convertedBy: { select: personSelect },
      counselors: { orderBy: { assignedAt: "desc" }, select: assignmentSelect },
      student: {
        select: {
          id: true,
          counselorId: true,
          counselor: { select: personSelect },
        },
      },
    },
  },
} satisfies Prisma.LoanApplicationSelect;

export type ReportLead = Prisma.LeadGetPayload<{ select: typeof reportLeadSelect; }>;
export type ReportStudent = Prisma.StudentGetPayload<{ select: typeof reportStudentSelect; }>;
export type ReportApplication = Prisma.StudentApplicationGetPayload<{
  select: typeof reportApplicationSelect;
}>;
export type ReportLoan = Prisma.LoanApplicationGetPayload<{ select: typeof reportLoanSelect; }>;

export type ReportAccessScope =
  | { kind: "all"; }
  | { kind: "branches"; branchIds: string[]; }
  | { kind: "user"; userId: string; userName: string; };

export type CommonReportFilters = {
  search: string;
  recordScope: "all" | "leads" | "students";
  branchId: string;
  counselorId: string;
  leadStatus: string;
  leadSource: string;
  countryId: string;
  intakeId: string;
  universityId: string;
  applicationStatus: string;
  casStatus: string;
  visaStatus: string;
  loanStatus: string;
  nbfc: string;
  fintechAssigneeId: string;
};

export type ReportMetricValues = {
  walkIns: number;
  references: number;
  activeWalkIns: number;
  walkInDropLost: number;
  studentDropInactive: number;
  applications: number;
  sameDayApplications: number;
  oldWalkInApplications: number;
  universityApplications: number;
  offers: number;
  depositPaid: number;
  casApplied: number;
  casReceived: number;
  visaApplied: number;
  visaApproved: number;
  loanApplications: number;
  outsideLoan: number;
  loanApproved: number;
  loanDisbursed: number;
  appliedAmount: number;
  sanctionedAmount: number;
  disbursedAmount: number;
};

export type ReportMetricEvent = {
  eventId: string;
  eventType: "lead" | "student" | "university_application" | "loan";
  date: Date;
  branchId: string;
  branchName: string;
  ownerId: string;
  ownerName: string;
  leadId: string;
  leadNumber: string;
  source: string;
  countryName: string;
  intakeId: string;
  intakeName: string;
  values: ReportMetricValues;
};

export type ReportDataset = {
  leads: ReportLead[];
  students: ReportStudent[];
  applications: ReportApplication[];
  loans: ReportLoan[];
  events: ReportMetricEvent[];
  applicationsByStudent: Map<string, ReportApplication[]>;
};

type Lookup = { countryName: string; intakeName: string; };

const emptyValues = (): ReportMetricValues => ({
  walkIns: 0,
  references: 0,
  activeWalkIns: 0,
  walkInDropLost: 0,
  studentDropInactive: 0,
  applications: 0,
  sameDayApplications: 0,
  oldWalkInApplications: 0,
  universityApplications: 0,
  offers: 0,
  depositPaid: 0,
  casApplied: 0,
  casReceived: 0,
  visaApplied: 0,
  visaApproved: 0,
  loanApplications: 0,
  outsideLoan: 0,
  loanApproved: 0,
  loanDisbursed: 0,
  appliedAmount: 0,
  sanctionedAmount: 0,
  disbursedAmount: 0,
});

const clean = (value: unknown) => String(value ?? "").trim();
const includes = (value: unknown, search: string) =>
  normalizeReportValue(value).includes(normalizeReportValue(search));

function ownerIdFilter(filters: CommonReportFilters, access: ReportAccessScope) {
  return access.kind === "user" ? access.userId : filters.counselorId;
}

function ownerMatches(owner: ReportOwnerPerson, ownerId: string): boolean {
  return !ownerId || owner.id === ownerId;
}

function leadOwner(lead: ReportLead) {
  return resolveFinalLeadOwner(lead);
}

function studentOwner(student: ReportStudent) {
  return resolveFinalStudentOwner(student);
}

function loanOwner(loan: ReportLoan) {
  return resolveFinalLoanOwner({
    fintechAssigneeId: loan.fintechAssigneeId,
    fintechAssignee: loan.fintechAssignee,
    counselorId: loan.counselorId,
    counselor: loan.counselor,
    createdById: loan.createdById,
    createdBy: loan.createdBy,
    lead: loan.lead,
  });
}

function branchWhere(access: ReportAccessScope, branchId: string) {
  const allowed = access.kind === "branches" ? access.branchIds : [];
  if (branchId && allowed.length && !allowed.includes(branchId)) {
    return { id: "__forbidden__" };
  }
  if (branchId) return { id: branchId };
  if (allowed.length) return { id: { in: allowed } };
  return undefined;
}

async function getLookup(filters: CommonReportFilters): Promise<Lookup> {
  const [country, intake] = await Promise.all([
    filters.countryId
      ? db.country.findUnique({ where: { id: filters.countryId }, select: { name: true } })
      : null,
    filters.intakeId
      ? db.intake.findUnique({ where: { id: filters.intakeId }, select: { name: true } })
      : null,
  ]);
  return { countryName: country?.name ?? "", intakeName: intake?.name ?? "" };
}

function groupApplications(rows: ReportApplication[]) {
  const map = new Map<string, ReportApplication[]>();
  for (const row of rows) {
    const current = map.get(row.studentId) ?? [];
    current.push(row);
    map.set(row.studentId, current);
  }
  for (const rowsForStudent of map.values()) {
    rowsForStudent.sort(
      (a, b) =>
        (b.applicationDate ?? b.createdAt).getTime() -
        (a.applicationDate ?? a.createdAt).getTime(),
    );
  }
  return map;
}

function matchingApplication(
  application: ReportApplication,
  filters: CommonReportFilters,
): boolean {
  if (filters.countryId && application.countryId !== filters.countryId) return false;
  if (filters.intakeId && application.intakeId !== filters.intakeId) return false;
  if (filters.universityId && application.universityId !== filters.universityId) return false;
  if (
    filters.applicationStatus &&
    normalizeReportValue(application.status) !== normalizeReportValue(filters.applicationStatus)
  ) return false;
  return true;
}

function matchesSearch(values: unknown[], search: string): boolean {
  return !search || values.some((value) => includes(value, search));
}

function matchesLead(
  lead: ReportLead,
  filters: CommonReportFilters,
  lookup: Lookup,
): boolean {
  if (filters.leadStatus && normalizeReportValue(lead.status) !== normalizeReportValue(filters.leadStatus)) return false;
  if (filters.leadSource && normalizeReportValue(lead.source) !== normalizeReportValue(filters.leadSource)) return false;
  if (lookup.countryName && !includes(lead.preferredCountry, lookup.countryName)) return false;
  if (lookup.intakeName && !includes(lead.preferredIntake, lookup.intakeName)) return false;
  return matchesSearch(
    [lead.leadNumber, lead.studentName, lead.mobileNumber, lead.emailId, lead.preferredCountry, lead.preferredIntake, lead.preferredCourse],
    filters.search,
  );
}

function matchesStudent(
  student: ReportStudent,
  applications: ReportApplication[],
  filters: CommonReportFilters,
  lookup: Lookup,
): boolean {
  if (filters.leadStatus && normalizeReportValue(student.lead.status) !== normalizeReportValue(filters.leadStatus)) return false;
  if (filters.leadSource && normalizeReportValue(student.lead.source) !== normalizeReportValue(filters.leadSource)) return false;
  if (filters.casStatus && normalizeReportValue(student.visaProfile?.casStatus) !== normalizeReportValue(filters.casStatus)) return false;
  if (filters.visaStatus && normalizeReportValue(student.visaProfile?.visaStatus) !== normalizeReportValue(filters.visaStatus)) return false;

  const loanStatus = student.lead.loanApplication?.loanStatus ?? student.loanProfile?.loanStatus;
  const fintechId = student.lead.loanApplication?.fintechAssigneeId ?? student.loanProfile?.fintechAssigneeId;
  const nbfc = student.lead.loanApplication?.bankApplications[0]?.bank.name ?? student.loanProfile?.nbfc;
  if (filters.loanStatus && normalizeReportValue(loanStatus) !== normalizeReportValue(filters.loanStatus)) return false;
  if (filters.fintechAssigneeId && fintechId !== filters.fintechAssigneeId) return false;
  if (filters.nbfc && normalizeReportValue(nbfc) !== normalizeReportValue(filters.nbfc)) return false;

  const needsApplicationMatch = Boolean(
    filters.countryId || filters.intakeId || filters.universityId || filters.applicationStatus,
  );
  if (needsApplicationMatch && !applications.some((row) => matchingApplication(row, filters))) {
    const leadFallback =
      !filters.universityId &&
      !filters.applicationStatus &&
      (!lookup.countryName || includes(student.lead.preferredCountry, lookup.countryName)) &&
      (!lookup.intakeName || includes(student.lead.preferredIntake, lookup.intakeName));
    if (!leadFallback) return false;
  }

  return matchesSearch(
    [student.lead.leadNumber, student.studentName, student.mobileNumber, student.emailId, student.lead.preferredCountry, student.lead.preferredIntake, student.lead.preferredCourse, ...applications.flatMap((row) => [row.universityName, row.courseName])],
    filters.search,
  );
}

function matchesLoan(loan: ReportLoan, filters: CommonReportFilters): boolean {
  if (filters.loanStatus && normalizeReportValue(loan.loanStatus) !== normalizeReportValue(filters.loanStatus)) return false;
  if (filters.fintechAssigneeId && loan.fintechAssigneeId !== filters.fintechAssigneeId) return false;
  const nbfc = loan.bankApplications[0]?.bank.name ?? "";
  if (filters.nbfc && normalizeReportValue(nbfc) !== normalizeReportValue(filters.nbfc)) return false;
  return matchesSearch(
    [loan.applicationId, loan.fullName, loan.mobile, loan.email, loan.lead?.leadNumber, nbfc],
    filters.search,
  );
}

function eventBase(
  eventId: string,
  eventType: ReportMetricEvent["eventType"],
  date: Date,
  branchId: string,
  branchName: string,
  owner: ReportOwnerPerson,
  leadId: string,
  leadNumber: string,
  source: string,
  countryName: string,
  intakeId: string,
  intakeName: string,
): Omit<ReportMetricEvent, "values"> {
  return {
    eventId,
    eventType,
    date,
    branchId,
    branchName,
    ownerId: owner.id,
    ownerName: owner.name,
    leadId,
    leadNumber,
    source,
    countryName,
    intakeId,
    intakeName,
  };
}

function buildEvents(
  leads: ReportLead[],
  students: ReportStudent[],
  applications: ReportApplication[],
  loans: ReportLoan[],
  applicationsByStudent: Map<string, ReportApplication[]>,
  recordScope: CommonReportFilters["recordScope"],
): ReportMetricEvent[] {
  const events: ReportMetricEvent[] = [];
  const studentById = new Map(students.map((student) => [student.id, student]));

  for (const lead of leads) {
    const values = emptyValues();
    values.walkIns = 1;
    values.references = isReferenceSource(lead.source) ? 1 : 0;
    values.activeWalkIns =
      !lead.isConverted && !isWalkInDropLost(lead.status) ? 1 : 0;
    values.walkInDropLost = isWalkInDropLost(lead.status) ? 1 : 0;
    values.loanApplications = lead.loanRequirement && !lead.loanApplication ? 1 : 0;
    values.outsideLoan = lead.loanRequirement ? 0 : 1;
    events.push({
      ...eventBase(
        `lead:${lead.id}`,
        "lead",
        lead.createdAt,
        lead.branchId,
        lead.branch.name,
        leadOwner(lead),
        lead.id,
        lead.leadNumber,
        clean(lead.source),
        clean(lead.preferredCountry),
        "",
        clean(lead.preferredIntake),
      ),
      values,
    });
  }

  for (const student of students) {
    const values = emptyValues();
    values.applications = 1;
    values.sameDayApplications = isSameDayApplication(student) ? 1 : 0;
    values.oldWalkInApplications = isOldWalkInApplication(student) ? 1 : 0;
    values.studentDropInactive = isStudentDropInactive(student.status) ? 1 : 0;
    values.depositPaid = normalizeReportValue(student.visaProfile?.depositStatus) === "paid" ? 1 : 0;
    values.casApplied = isCasApplied(student.visaProfile?.casStatus) ? 1 : 0;
    values.casReceived = isCasReceived(student.visaProfile?.casStatus) ? 1 : 0;
    values.visaApplied = isVisaApplied(student.visaProfile?.visaStatus) ? 1 : 0;
    values.visaApproved = isVisaApproved(student.visaProfile?.visaStatus) ? 1 : 0;
    if (recordScope === "students") {
      values.loanApplications =
        student.lead.loanRequirement && !student.lead.loanApplication ? 1 : 0;
      values.outsideLoan = student.lead.loanRequirement ? 0 : 1;
    }
    const firstApplication = applicationsByStudent.get(student.id)?.[0];
    events.push({
      ...eventBase(
        `student:${student.id}`,
        "student",
        resolveStudentConversionDate(student),
        student.branchId,
        student.branch.name,
        studentOwner(student),
        student.lead.id,
        student.lead.leadNumber,
        clean(student.lead.source),
        clean(firstApplication?.countryName ?? firstApplication?.country?.name ?? student.lead.preferredCountry),
        clean(firstApplication?.intakeId),
        clean(firstApplication?.intakeName ?? firstApplication?.intake?.name ?? student.lead.preferredIntake),
      ),
      values,
    });
  }

  for (const application of applications) {
    if (!isUniversityApplied(application.status)) continue;
    const student = studentById.get(application.studentId);
    if (!student) continue;
    const values = emptyValues();
    values.universityApplications = 1;
    values.offers = isOfferReceived(application.offerStatus) ? 1 : 0;
    events.push({
      ...eventBase(
        `application:${application.id}`,
        "university_application",
        application.applicationDate ?? application.createdAt,
        student.branchId,
        student.branch.name,
        studentOwner(student),
        student.lead.id,
        student.lead.leadNumber,
        clean(student.lead.source),
        clean(application.countryName ?? application.country?.name),
        clean(application.intakeId),
        clean(application.intakeName ?? application.intake?.name),
      ),
      values,
    });
  }

  for (const loan of loans) {
    const values = emptyValues();
    values.loanApplications = 1;
    values.loanApproved = isLoanApproved(loan.loanStatus, loan.sanctionedAmount) ? 1 : 0;
    values.loanDisbursed = isLoanDisbursed(loan.loanStatus, loan.disbursementStatus, loan.disbursedAmount) ? 1 : 0;
    values.appliedAmount = toReportNumber(loan.requiredLoanAmount);
    values.sanctionedAmount = toReportNumber(loan.sanctionedAmount);
    values.disbursedAmount = toReportNumber(loan.disbursedAmount);
    events.push({
      ...eventBase(
        `loan:${loan.id}`,
        "loan",
        loan.enquiryDate ?? loan.createdAt,
        loan.branchId,
        loan.branch.name,
        loanOwner(loan),
        clean(loan.leadId),
        clean(loan.lead?.leadNumber ?? loan.applicationId),
        clean(loan.lead?.source),
        "",
        "",
        "",
      ),
      values,
    });
  }

  return events;
}

export async function loadReportDataset(
  filters: CommonReportFilters,
  access: ReportAccessScope = { kind: "all" },
): Promise<ReportDataset> {
  const lookup = await getLookup(filters);
  const branch = branchWhere(access, filters.branchId);
  const baseLeadWhere: Prisma.LeadWhereInput = {
    leadType: "study_abroad",
    ...(branch && { branch }),
  };
  const baseStudentWhere: Prisma.StudentWhereInput = {
    ...(branch && { branch }),
    lead: { leadType: "study_abroad" },
  };
  const baseLoanWhere: Prisma.LoanApplicationWhereInput = {
    ...(branch && { branch }),
  };

  const [leadCandidates, studentCandidates, applicationCandidates, loanCandidates] = await Promise.all([
    filters.recordScope !== "students"
      ? db.lead.findMany({ where: baseLeadWhere, select: reportLeadSelect, orderBy: { createdAt: "desc" } })
      : Promise.resolve([] as ReportLead[]),
    filters.recordScope !== "leads"
      ? db.student.findMany({ where: baseStudentWhere, select: reportStudentSelect, orderBy: { createdAt: "desc" } })
      : Promise.resolve([] as ReportStudent[]),
    filters.recordScope !== "leads"
      ? db.studentApplication.findMany({
        where: branch ? { student: { branch } } : undefined,
        select: reportApplicationSelect,
        orderBy: [{ applicationDate: "desc" }, { createdAt: "desc" }],
      })
      : Promise.resolve([] as ReportApplication[]),
    db.loanApplication.findMany({ where: baseLoanWhere, select: reportLoanSelect, orderBy: { createdAt: "desc" } }),
  ]);

  const candidateApplicationsByStudent = groupApplications(applicationCandidates);
  const requiredOwnerId = ownerIdFilter(filters, access);
  const matchedLeads = leadCandidates.filter((lead) =>
    matchesLead(lead, filters, lookup),
  );
  const matchedStudents = studentCandidates.filter((student) =>
    matchesStudent(
      student,
      candidateApplicationsByStudent.get(student.id) ?? [],
      filters,
      lookup,
    ),
  );
  const leads = matchedLeads.filter((lead) =>
    ownerMatches(leadOwner(lead), requiredOwnerId),
  );
  const students = matchedStudents.filter((student) =>
    ownerMatches(studentOwner(student), requiredOwnerId),
  );
  const studentIds = new Set(students.map((student) => student.id));
  const applications = applicationCandidates.filter(
    (application) =>
      studentIds.has(application.studentId) &&
      matchingApplication(application, filters),
  );

  const matchedLeadIds = new Set(matchedLeads.map((lead) => lead.id));
  const matchedStudentLeadIds = new Set(
    matchedStudents.map((student) => student.leadId),
  );
  const hasAcademicContext = Boolean(
    filters.leadStatus ||
    filters.leadSource ||
    filters.countryId ||
    filters.intakeId ||
    filters.universityId ||
    filters.applicationStatus ||
    filters.casStatus ||
    filters.visaStatus,
  );
  const loanMatchesScope = (loan: ReportLoan) => {
    if (filters.recordScope === "leads") {
      return Boolean(loan.leadId && matchedLeadIds.has(loan.leadId));
    }
    if (filters.recordScope === "students") {
      return Boolean(
        loan.leadId &&
        loan.lead?.student &&
        matchedStudentLeadIds.has(loan.leadId),
      );
    }
    return (
      !hasAcademicContext ||
      Boolean(
        loan.leadId &&
        (matchedLeadIds.has(loan.leadId) ||
          matchedStudentLeadIds.has(loan.leadId)),
      )
    );
  };
  const loans = loanCandidates.filter(
    (loan) =>
      loanMatchesScope(loan) &&
      matchesLoan(loan, filters) &&
      ownerMatches(loanOwner(loan), requiredOwnerId),
  );
  const applicationsByStudent = groupApplications(applications);

  return {
    leads,
    students,
    applications,
    loans,
    events: buildEvents(
      leads,
      students,
      applications,
      loans,
      applicationsByStudent,
      filters.recordScope,
    ),
    applicationsByStudent,
  };
}

export async function getSharedReportFilterOptions(access: ReportAccessScope = { kind: "all" }) {
  const branch = branchWhere(access, "");
  const userWhere: Prisma.UserWhereInput =
    access.kind === "user"
      ? { id: access.userId }
      : access.kind === "branches"
        ? { branches: { some: { id: { in: access.branchIds } } } }
        : {};

  const [branches, users, countries, intakes, universities, fintechAssignees, sources, loanStatuses, nbfcs] = await Promise.all([
    db.branch.findMany({ where: branch, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({
      where: userWhere,
      select: { id: true, name: true, role: { select: { name: true } }, branches: { select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    db.country.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.intake.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.university.findMany({ select: { id: true, name: true, countryId: true }, orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { ...userWhere, OR: [{ role: { name: { contains: "FINTECH", mode: "insensitive" } } }, { loanApplicationsFintech: { some: {} } }] },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.lead.findMany({ where: { leadType: "study_abroad", ...(branch && { branch }) }, distinct: ["source"], select: { source: true } }),
    db.loanApplication.findMany({ where: branch ? { branch } : undefined, distinct: ["loanStatus"], select: { loanStatus: true } }),
    db.studentLoanProfile.findMany({ distinct: ["nbfc"], select: { nbfc: true } }),
  ]);

  return {
    branches: branches.map(({ id, name }) => ({ value: id, label: name })),
    users: users.map((user) => ({ value: user.id, label: user.name, roleName: user.role.name, branchIds: user.branches.map((item) => item.id) })),
    countries: countries.map(({ id, name }) => ({ value: id, label: name })),
    intakes: intakes.map(({ id, name }) => ({ value: id, label: name })),
    universities: universities.map(({ id, name, countryId }) => ({ value: id, label: name, countryId })),
    fintechAssignees: fintechAssignees.map(({ id, name }) => ({ value: id, label: name })),
    leadStatuses: ["NEW", "VISA_APPLICATION", "DROP"],
    sources: sources.map((item) => clean(item.source)).filter(Boolean).sort(),
    applicationStatuses: ["on_hold", "applied", "drop"],
    casStatuses: ["APPLIED", "RECEIVED", "PENDING"],
    visaStatuses: ["APPROVED", "REJECTED", "DECISION_PENDING"],
    loanStatuses: loanStatuses.map((item) => clean(item.loanStatus)).filter(Boolean).sort(),
    nbfcs: nbfcs.map((item) => clean(item.nbfc)).filter(Boolean).sort(),
  };
}
