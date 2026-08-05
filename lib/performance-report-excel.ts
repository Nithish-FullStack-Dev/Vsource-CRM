import ExcelJS from "exceljs";
import {
  calculatePerformanceTotals,
  groupCounselorPerformance,
} from "@/lib/performance-report-calculations";
import type {
  PerformanceReportData,
  PerformanceReportFilters,
  PerformanceReportMetricRow,
} from "@/types/performance-report";

const HEADER_FILL = "FF9F1239";
const HEADER_TEXT = "FFFFFFFF";
const SUBTLE_FILL = "FFF8FAFC";
const TOTAL_FILL = "FFF1F5F9";
const BORDER_COLOR = "FFE2E8F0";

const humanize = (value: string) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "All";

const formatDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
};

function styleHeader(row: ExcelJS.Row) {
  row.height = 25;
  row.font = { bold: true, color: { argb: HEADER_TEXT } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

function styleWorksheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: BORDER_COLOR } },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    if (rowNumber > 1 && rowNumber % 2 === 0 && !row.font?.bold) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBTLE_FILL } };
    }
  });
  styleHeader(sheet.getRow(1));
  if (sheet.columnCount && sheet.rowCount) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    };
  }
}

function metricValues(row: PerformanceReportMetricRow) {
  return {
    walkIns: row.walkIns,
    references: row.references,
    activeWalkIns: row.activeWalkIns,
    walkInDropLost: row.walkInDropLost,
    studentDropInactive: row.studentDropInactive,
    applications: row.applications,
    sameDayApplications: row.sameDayApplications,
    oldWalkInApplications: row.oldWalkInApplications,
    universityApplications: row.universityApplications,
    offers: row.offers,
    casApplied: row.casApplied,
    casReceived: row.casReceived,
    visaApplied: row.visaApplied,
    visaApproved: row.visaApproved,
    loanApplications: row.loanApplications,
    outsideLoan: row.outsideLoan,
    loanApproved: row.loanApproved,
    loanDisbursed: row.loanDisbursed,
    target: row.target,
    achieved: row.achieved,
    leadConversion: `${row.leadToStudentConversionPercentage}%`,
    universityConversion: `${row.universityApplicationConversionPercentage}%`,
    visaConversion: `${row.visaConversionPercentage}%`,
    loanConversion: `${row.loanConversionPercentage}%`,
    targetCompletion: `${row.targetCompletionPercentage}%`,
  };
}

const metricColumns: Partial<ExcelJS.Column>[] = [
  { header: "Walk-ins", key: "walkIns", width: 12 },
  { header: "Reference", key: "references", width: 12 },
  { header: "Active Walk-ins", key: "activeWalkIns", width: 14 },
  { header: "Walk-in Drop / Lost", key: "walkInDropLost", width: 18 },
  { header: "Application Drop / Inactive", key: "studentDropInactive", width: 21 },
  { header: "Applications", key: "applications", width: 13 },
  { header: "Same Day Apps", key: "sameDayApplications", width: 15 },
  { header: "Old Walk-in Apps", key: "oldWalkInApplications", width: 17 },
  { header: "University Applied", key: "universityApplications", width: 17 },
  { header: "Offers", key: "offers", width: 11 },
  { header: "CAS Applied", key: "casApplied", width: 13 },
  { header: "CAS Received", key: "casReceived", width: 14 },
  { header: "Visa Applied", key: "visaApplied", width: 13 },
  { header: "Visa Approved", key: "visaApproved", width: 14 },
  { header: "Loan Applications", key: "loanApplications", width: 17 },
  { header: "OS-LOAN / O-FUND", key: "outsideLoan", width: 18 },
  { header: "Loan Approved", key: "loanApproved", width: 14 },
  { header: "Loan Disbursed", key: "loanDisbursed", width: 15 },
  { header: "Target", key: "target", width: 10 },
  { header: "Achieved", key: "achieved", width: 11 },
  { header: "Lead Conversion %", key: "leadConversion", width: 16 },
  { header: "University Conversion %", key: "universityConversion", width: 19 },
  { header: "Visa Conversion %", key: "visaConversion", width: 16 },
  { header: "Loan Conversion %", key: "loanConversion", width: 16 },
  { header: "Target Completion %", key: "targetCompletion", width: 18 },
];

function addSummary(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Metric", key: "metric", width: 42 },
    { header: "Value", key: "value", width: 24 },
  ];
  const summaryRows: Array<[string, string | number]> = [
    ["Generated At", new Date(report.generatedAt).toLocaleString("en-IN")],
    ["Walk-ins", report.summary.walkIns],
    ["Reference (all sources except Walk-in)", report.summary.references],
    ["Applications (lead converted to student)", report.summary.applications],
    ["Same Day Apps", report.summary.sameDayApplications],
    ["Old Walk-in Apps", report.summary.oldWalkInApplications],
    ["University Applied", report.summary.universityApplications],
    ["Walk-in Drop / Lost", report.summary.walkInDropLost],
    ["Application Drop / Inactive", report.summary.studentDropInactive],
    ["Loan Applications", report.summary.loanApplications],
    ["OS-LOAN / O-FUND", report.summary.outsideLoan],
    ["Loan Approved", report.summary.loanApproved],
    ["Loan Disbursed", report.summary.loanDisbursed],
    ["CAS Applied", report.summary.casApplied],
    ["CAS Received", report.summary.casReceived],
    ["Visa Applied", report.summary.visaApplied],
    ["Visa Approved", report.summary.visaApproved],
    ["Target", report.summary.target],
    ["Achieved", report.summary.achieved],
    ["Lead to Student Conversion", `${report.summary.leadToStudentConversionPercentage}%`],
    ["University Application Conversion", `${report.summary.universityApplicationConversionPercentage}%`],
    ["Visa Conversion", `${report.summary.visaConversionPercentage}%`],
    ["Loan Conversion", `${report.summary.loanConversionPercentage}%`],
    ["Target Completion", `${report.summary.targetCompletionPercentage}%`],
  ];
  summaryRows.forEach(([metric, value]) => sheet.addRow({ metric, value }));
  styleWorksheet(sheet);

  const filterSheet = workbook.addWorksheet("Applied Filters");
  filterSheet.columns = [
    { header: "Filter", key: "filter", width: 32 },
    { header: "Value", key: "value", width: 44 },
  ];
  const filterRows: Array<[string, string]> = [
    ["Search", filters.search || "All"],
    ["Report Scope", humanize(filters.recordScope)],
    ["Branch ID", filters.branchId || "All"],
    ["User ID", filters.counselorId || "All"],
    ["Walk-in Status", humanize(filters.leadStatus)],
    ["Walk-in Source", filters.leadSource || "All"],
    ["Country ID", filters.countryId || "All"],
    ["Intake ID", filters.intakeId || "All"],
    ["University ID", filters.universityId || "All"],
    ["University Application Status", humanize(filters.applicationStatus)],
    ["CAS Status", humanize(filters.casStatus)],
    ["Visa Status", humanize(filters.visaStatus)],
    ["Loan Status", humanize(filters.loanStatus)],
    ["NBFC / Bank", filters.nbfc || "All"],
    ["Fintech Assignee ID", filters.fintechAssigneeId || "All"],
    ["Date Preset", humanize(filters.datePreset)],
    ["Start Date", filters.startDate || "Not Set"],
    ["End Date", filters.endDate || "Not Set"],
  ];
  filterRows.forEach(([filter, value]) => filterSheet.addRow({ filter, value }));
  styleWorksheet(filterSheet);
}

function addPerformanceSheets(workbook: ExcelJS.Workbook, report: PerformanceReportData) {
  const branch = workbook.addWorksheet("Branch Performance");
  branch.columns = [
    { header: "Branch", key: "branch", width: 28 },
    ...metricColumns,
  ];
  report.branchPerformance.forEach((row) => branch.addRow({ branch: row.branch, ...metricValues(row) }));
  if (report.branchPerformance.length) {
    const totalRow = branch.addRow({ branch: "Grand Total", ...metricValues(calculatePerformanceTotals(report.branchPerformance)) });
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_FILL } };
  }
  styleWorksheet(branch);

  const counselor = workbook.addWorksheet("User Performance");
  counselor.columns = [
    { header: "Branch", key: "branch", width: 25 },
    { header: "User", key: "counselor", width: 26 },
    ...metricColumns,
  ];
  for (const group of groupCounselorPerformance(report.counselorPerformance)) {
    group.rows.forEach((row) => counselor.addRow({ branch: row.branch, counselor: row.counselor, ...metricValues(row) }));
    const totalRow = counselor.addRow({ branch: group.branch, counselor: "Branch Total", ...metricValues(group.totals) });
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_FILL } };
  }
  styleWorksheet(counselor);
}

function addRecordSheets(workbook: ExcelJS.Workbook, report: PerformanceReportData) {
  const sheet = workbook.addWorksheet("Pipeline Records");
  sheet.columns = [
    { header: "Type", key: "recordType", width: 12 },
    { header: "Lead Number", key: "leadNumber", width: 16 },
    { header: "Student", key: "studentName", width: 24 },
    { header: "Mobile", key: "mobileNumber", width: 16 },
    { header: "Email", key: "emailId", width: 28 },
    { header: "Branch", key: "branchName", width: 22 },
    { header: "Owner", key: "counselorName", width: 22 },
    { header: "Source", key: "source", width: 18 },
    { header: "Reference", key: "reference", width: 12 },
    { header: "Application Timing", key: "applicationTiming", width: 18 },
    { header: "Country", key: "countryName", width: 20 },
    { header: "Intake", key: "intakeName", width: 18 },
    { header: "Course", key: "courseName", width: 28 },
    { header: "Lifecycle Status", key: "lifecycleStatus", width: 18 },
    { header: "Current Stage", key: "currentStage", width: 20 },
    { header: "Created / Converted", key: "createdAt", width: 18 },
    { header: "University Applications", key: "applicationsCount", width: 18 },
    { header: "Latest University", key: "latestUniversityName", width: 28 },
    { header: "Application Status", key: "latestApplicationStatus", width: 18 },
    { header: "CAS Status", key: "casStatus", width: 16 },
    { header: "Visa Status", key: "visaStatus", width: 16 },
    { header: "Loan Application", key: "loanApplication", width: 16 },
    { header: "OS-LOAN / O-FUND", key: "outsideLoan", width: 18 },
    { header: "Loan Status", key: "loanStatus", width: 18 },
    { header: "Loan Approved", key: "loanApproved", width: 15 },
    { header: "Loan Disbursed", key: "loanDisbursed", width: 16 },
    { header: "NBFC / Bank", key: "nbfc", width: 22 },
    { header: "Fintech Assignee", key: "fintechAssigneeName", width: 22 },
  ];
  report.rows.forEach((row) =>
    sheet.addRow({
      ...row,
      reference: row.isReference ? "Yes" : "No",
      applicationTiming: row.applicationTiming ? humanize(row.applicationTiming) : "",
      createdAt: formatDate(row.createdAt),
      loanApplication: row.loanApplication ? "Yes" : "No",
      outsideLoan: row.outsideLoan ? "Yes" : "No",
      loanApproved: row.loanApproved ? "Yes" : "No",
      loanDisbursed: row.loanDisbursed ? "Yes" : "No",
    }),
  );
  styleWorksheet(sheet);

  if (!report.applicationRows) return;
  const applications = workbook.addWorksheet("University Applications");
  applications.columns = [
    { header: "Application ID", key: "applicationId", width: 38 },
    { header: "Lead Number", key: "leadNumber", width: 16 },
    { header: "Student", key: "studentName", width: 24 },
    { header: "Branch", key: "branchName", width: 22 },
    { header: "Owner", key: "counselorName", width: 22 },
    { header: "Source", key: "source", width: 18 },
    { header: "Country", key: "countryName", width: 20 },
    { header: "University", key: "universityName", width: 30 },
    { header: "Course", key: "courseName", width: 28 },
    { header: "Intake", key: "intakeName", width: 18 },
    { header: "Applied Date", key: "applicationDate", width: 18 },
    { header: "Application Status", key: "applicationStatus", width: 18 },
    { header: "Offer Status", key: "offerStatus", width: 18 },
    { header: "CAS Status", key: "casStatus", width: 16 },
    { header: "Visa Status", key: "visaStatus", width: 16 },
    { header: "Loan Status", key: "loanStatus", width: 18 },
    { header: "Disbursed", key: "disbursed", width: 12 },
  ];
  report.applicationRows.forEach((row) =>
    applications.addRow({
      ...row,
      applicationDate: formatDate(row.applicationDate),
      disbursed: row.disbursed ? "Yes" : "No",
    }),
  );
  styleWorksheet(applications);
}

export async function buildPerformanceReportWorkbook(
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vsource CRM";
  workbook.created = new Date();
  addSummary(workbook, report, filters);
  addPerformanceSheets(workbook, report);
  addRecordSheets(workbook, report);
  const buffer = await workbook.xlsx.writeBuffer();
  // writeBuffer may return a Buffer; ensure a Uint8Array is returned
  return Uint8Array.from(buffer as any);
}
