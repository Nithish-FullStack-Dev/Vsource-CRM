export type ReportDatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "custom";

export type ReportRecordScope = "all" | "leads" | "students";

export type PerformanceReportFilters = {
  search: string;
  recordScope: ReportRecordScope;
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
  datePreset: ReportDatePreset;
  startDate: string;
  endDate: string;
};

export const DEFAULT_PERFORMANCE_REPORT_FILTERS: PerformanceReportFilters = {
  search: "",
  recordScope: "all",
  branchId: "",
  counselorId: "",
  leadStatus: "",
  leadSource: "",
  countryId: "",
  intakeId: "",
  universityId: "",
  applicationStatus: "",
  casStatus: "",
  visaStatus: "",
  loanStatus: "",
  nbfc: "",
  fintechAssigneeId: "",
  datePreset: "all",
  startDate: "",
  endDate: "",
};

export type ReportOption = {
  value: string;
  label: string;
};

export type CounselorReportOption = ReportOption & {
  branchIds: string[];
};

export type UniversityReportOption = ReportOption & {
  countryId: string;
};

export type PerformanceReportAccessKind = "all" | "branches" | "user";

export type PerformanceReportFilterOptions = {
  access: {
    kind: PerformanceReportAccessKind;
  };
  branches: ReportOption[];
  counselors: CounselorReportOption[];
  countries: ReportOption[];
  intakes: ReportOption[];
  universities: UniversityReportOption[];
  fintechAssignees: ReportOption[];
  leadStatuses: string[];
  leadSources: string[];
  applicationStatuses: string[];
  casStatuses: string[];
  visaStatuses: string[];
  loanStatuses: string[];
  nbfcs: string[];
};

export type PerformanceReportSummary = {
  totalPipelineRecords: number;
  totalLeads: number;
  totalStudents: number;
  totalApplications: number;
  qualifiedLeads: number;
  lostLeads: number;
  droppedStudents: number;
  totalTarget: number;
  totalAchieved: number;
  totalLeadsCreated: number;
  targetAssignments: number;
  targetCompletionPercentage: number;
  conversionRate: number;
  offerApplications: number;
  casReceivedStudents: number;
  visaApprovedStudents: number;
};

export type PerformanceReportMonthlyPoint = {
  key: string;
  label: string;
  leads: number;
  students: number;
  applications: number;
};

export type PerformanceReportCountryPoint = {
  country: string;
  leads: number;
  students: number;
  applications: number;
};

export type PerformanceReportStatusPoint = {
  status: string;
  count: number;
};

export type PerformanceReportSourcePoint = {
  source: string;
  leads: number;
  students: number;
  total: number;
};

export type PerformanceReportMetricRow = {
  totalWalkins: number;
  leadsCreated: number;
  leads: number;
  qualifiedLeads: number;
  lostLeads: number;
  students: number;
  droppedStudents: number;
  target: number;
  achieved: number;
  targetCompletionPercentage: number;
  applications: number;
  offers: number;
  conversionRate: number;
  casReceived: number;
  visaApproved: number;
};

export type PerformanceReportBranchPoint = PerformanceReportMetricRow & {
  branchId: string;
  branch: string;
};

export type PerformanceReportCounselorPoint = PerformanceReportMetricRow & {
  branchId: string;
  branch: string;
  counselorId: string;
  counselor: string;
};

export type PerformanceRecordType = "lead" | "student";

export type PerformanceReportRow = {
  recordType: PerformanceRecordType;
  recordId: string;
  leadId: string;
  leadNumber: string;
  studentId: string | null;
  studentName: string;
  emailId: string;
  mobileNumber: string;
  branchId: string;
  branchName: string;
  counselorId: string | null;
  counselorName: string;
  source: string;
  countryName: string;
  intakeName: string;
  courseName: string;
  lifecycleStatus: string;
  currentStage: string;
  createdAt: string;
  convertedAt: string | null;
  nextFollowup: string | null;
  applicationsCount: number;
  latestApplicationId: string | null;
  latestUniversityName: string;
  latestApplicationDate: string | null;
  latestApplicationStatus: string;
  latestOfferStatus: string;
  casStatus: string;
  visaStatus: string;
  loanStatus: string;
  nbfc: string;
  fintechAssigneeName: string;
};

export type PerformanceApplicationExportRow = {
  applicationId: string;
  studentId: string;
  leadNumber: string;
  studentName: string;
  emailId: string;
  mobileNumber: string;
  branchName: string;
  counselorName: string;
  source: string;
  countryName: string;
  universityName: string;
  courseName: string;
  intakeName: string;
  portal: string;
  applicationDate: string | null;
  applicationStatus: string;
  offerStatus: string;
  depositStatus: string;
  ihsPaidStatus: string;
  visaPaidStatus: string;
  casStatus: string;
  visaStatus: string;
  fintechAssigneeName: string;
  nbfc: string;
  loanStatus: string;
  pfStatus: string;
  disbursed: boolean;
};

export type PerformanceReportData = {
  generatedAt: string;
  summary: PerformanceReportSummary;
  monthlyVolume: PerformanceReportMonthlyPoint[];
  countryDemand: PerformanceReportCountryPoint[];
  leadStatusBreakdown: PerformanceReportStatusPoint[];
  leadSourceBreakdown: PerformanceReportSourcePoint[];
  applicationStatusBreakdown: PerformanceReportStatusPoint[];
  visaStatusBreakdown: PerformanceReportStatusPoint[];
  loanStatusBreakdown: PerformanceReportStatusPoint[];
  branchPerformance: PerformanceReportBranchPoint[];
  counselorPerformance: PerformanceReportCounselorPoint[];
  rows: PerformanceReportRow[];
  applicationRows?: PerformanceApplicationExportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};
