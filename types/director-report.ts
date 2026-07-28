export type DirectorReportDatePreset = "all" | "today" | "yesterday" | "last_7_days" | "last_30_days" | "this_week" | "last_week" | "this_month" | "last_month" | "this_quarter" | "last_quarter" | "this_year" | "custom";
export type DirectorReportRecordScope = "all" | "leads" | "students";
export type DirectorReportFilters = {
    search: string;
    recordScope: DirectorReportRecordScope;
    branchId: string;
    counselorId: string;
    leadStatus: string;
    source: string;
    countryId: string;
    intakeId: string;
    universityId: string;
    applicationStatus: string;
    casStatus: string;
    visaStatus: string;
    loanStatus: string;
    nbfc: string;
    fintechAssigneeId: string;
    datePreset: DirectorReportDatePreset;
    startDate: string;
    endDate: string;
};
export type DirectorReportFilterOption = {
    value: string;
    label: string;
    branchIds?: string[];
    countryId?: string | null;
    roleName?: string;
};
export type DirectorReportFilterOptions = {
    branches: DirectorReportFilterOption[];
    users: DirectorReportFilterOption[];
    countries: DirectorReportFilterOption[];
    intakes: DirectorReportFilterOption[];
    universities: DirectorReportFilterOption[];
    fintechAssignees: DirectorReportFilterOption[];
    leadStatuses: string[];
    sources: string[];
    applicationStatuses: string[];
    casStatuses: string[];
    visaStatuses: string[];
    loanStatuses: string[];
    nbfcs: string[];
};
export type DirectorReportSummary = {
    walkIns: number;
    references: number;
    applications: number;
    sameDayApplications: number;
    oldWalkInApplications: number;
    universityApplications: number;
    offers: number;
    dropHoldDif: number;
    loanApplications: number;
    outsideLoan: number;
    loanApproved: number;
    loanDisbursed: number;
    depositPaid: number;
    casApplied: number;
    casReceived: number;
    visaApplied: number;
    visaApproved: number;
    target: number;
    achieved: number;
    appliedAmount: number;
    sanctionedAmount: number;
    disbursedAmount: number;
    leadToStudentConversionPercentage: number;
    universityApplicationConversionPercentage: number;
    visaConversionPercentage: number;
    loanConversionPercentage: number;
    targetCompletionPercentage: number;
};
export type DirectorReportRow = DirectorReportSummary & {
    rowId: string;
    periodKey: string;
    periodLabel: string;
    branchId: string;
    branchName: string;
    counselorId: string;
    counselorName: string;
    intakeId?: string | null;
    intakeName?: string | null;
    leadNumbers: string[];
    avgWeeklyWalkIns: number;
    avgWeeklyApplications: number;
    avgWeeklyUniversityApplications: number;
    avgWeeklyLoanApplications: number;
    avgWeeklyLoanApproved: number;
    avgWeeklyVisaApproved: number;
};
export type DirectorReportTableTotals = {
    branchRows: DirectorReportRow[];
    grandTotal: DirectorReportRow;
};
export type DirectorReportComparisonRow = {
    rowId: string;
    metric: string;
    current: number;
    previous: number;
    difference: number;
    changePercentage: number;
    valueType: "number" | "percentage" | "currency";
};
export type DirectorReportIntakeComparisonRow = {
    rowId: string;
    intakeId: string;
    intakeName: string;
    walkIns: number;
    applications: number;
    universityApplications: number;
    visaApproved: number;
    loanApplications: number;
    outsideLoan: number;
    loanApproved: number;
    leadConversionPercentage: number;
    universityApplicationConversionPercentage: number;
    visaConversionPercentage: number;
    loanConversionPercentage: number;
};
export type DirectorReportLeadDetail = {
    rowId: string;
    leadId: string;
    leadNumber: string;
    branchName: string;
    counselorId: string;
    counselorName: string;
    studentName: string;
    mobileNumber: string;
    source: string;
    preferredCountry: string;
    preferredIntake: string;
    status: string;
    attribution: string;
    createdAt: string;
};
export type DirectorReportData = {
    generatedAt: string;
    filters: DirectorReportFilters;
    filterOptions: DirectorReportFilterOptions;
    summary: DirectorReportSummary;
    allTimeRows: DirectorReportRow[];
    allTimeTotals: DirectorReportTableTotals;
    todayRows: DirectorReportRow[];
    todayTotals: DirectorReportTableTotals;
    weeklyRows: DirectorReportRow[];
    weeklyTotals: DirectorReportTableTotals;
    currentMonthRows: DirectorReportRow[];
    currentMonthTotals: DirectorReportTableTotals;
    intakeWiseRows: DirectorReportRow[];
    intakeWiseTotals: DirectorReportTableTotals;
    weeklyAverageRows: DirectorReportRow[];
    weekComparison: DirectorReportComparisonRow[];
    monthComparison: DirectorReportComparisonRow[];
    intakeComparison: DirectorReportIntakeComparisonRow[];
    leadDetails: DirectorReportLeadDetail[];
};
export const DEFAULT_DIRECTOR_REPORT_FILTERS: DirectorReportFilters = {
    search: "",
    recordScope: "all",
    branchId: "",
    counselorId: "",
    leadStatus: "",
    source: "",
    countryId: "",
    intakeId: "",
    universityId: "",
    applicationStatus: "",
    casStatus: "",
    visaStatus: "",
    loanStatus: "",
    nbfc: "",
    fintechAssigneeId: "",
    datePreset: "this_month",
    startDate: "",
    endDate: "",
};