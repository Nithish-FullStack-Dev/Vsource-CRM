import ExcelJS from "exceljs";
import {
  calculatePerformanceTotals,
  groupCounselorPerformance,
} from "@/lib/performance-report-calculations";
import type {
  PerformanceReportData,
  PerformanceReportFilters,
  PerformanceReportMetricRow,
  PerformanceReportRow,
} from "@/types/performance-report";

const HEADER_FILL = "FF9F1239";
const HEADER_TEXT = "FFFFFFFF";
const SUBTLE_FILL = "FFF8FAFC";
const TOTAL_FILL = "FFF1F5F9";
const GRAND_TOTAL_FILL = "FFE2E8F0";
const BORDER_COLOR = "FFE2E8F0";

const humanize = (value: string) =>
  value
    ? value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "All";

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 24;
  row.font = { bold: true, color: { argb: HEADER_TEXT } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  row.alignment = { vertical: "middle" };
}

function styleTotal(row: ExcelJS.Row, fill: string) {
  row.font = { bold: true, color: { argb: "FF0F172A" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
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
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: SUBTLE_FILL },
      };
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
    totalWalkins: row.totalWalkins,
    leadsCreated: row.leadsCreated,
    leads: row.leads,
    qualifiedLeads: row.qualifiedLeads,
    lostLeads: row.lostLeads,
    students: row.students,
    droppedStudents: row.droppedStudents,
    loanLogins: row.loanLogins,
    loanApproved: row.loanApproved,
    applicationConversions:
      `${row.applicationConversions} (${row.applicationConversionRate}%)`,

    visaConversions:
      `${row.visaConversions} (${row.visaConversionRate}%)`,
    target: row.target,
    achieved: row.achieved,
    targetCompletionPercentage: `${row.targetCompletionPercentage}%`,
    applications: row.applications,
    offers: row.offers,
    casReceived: row.casReceived,
  };
}

function addSummary(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Metric", key: "metric", width: 40 },
    { header: "Value", key: "value", width: 24 },
  ];
  const rows: Array<[string, string | number]> = [
    ["Generated At", new Date(report.generatedAt).toLocaleString("en-IN")],
    ["Total Walk-ins", report.summary.totalPipelineRecords],
    ["Active Walk-ins", report.summary.totalLeads],
    ["Drop Walk-ins", report.summary.lostLeads],
    ["Applications", report.summary.totalStudents],
    ["Dropped Applications", report.summary.droppedStudents],
    ["Walk-ins Added", report.summary.totalLeadsCreated],
    ["Loan Logins", report.summary.loanLogins],
    ["Loan Approved", report.summary.loanApproved],
    ["Application Conversions", report.summary.applicationConversions],
    [
      "Application Conversion Rate",
      `${report.summary.applicationConversionRate}%`,
    ],
    ["Visa Conversions", report.summary.visaConversions],
    ["Visa Conversion Rate", `${report.summary.visaConversionRate}%`],
    ["Visa Approval Target", report.summary.totalTarget],
    ["Target Achieved (Visa Approved)", report.summary.totalAchieved],
    ["Target Completion", `${report.summary.targetCompletionPercentage}%`],
    ["Target Assignments", report.summary.targetAssignments],
    ["University Applications", report.summary.totalApplications],
    ["Offer Applications", report.summary.offerApplications],
    ["CAS Received", report.summary.casReceivedStudents],
    ["Visa Approved", report.summary.visaApprovedStudents],
  ];
  rows.forEach(([metric, value]) => sheet.addRow({ metric, value }));
  styleWorksheet(sheet);

  const filterSheet = workbook.addWorksheet("Applied Filters");
  filterSheet.columns = [
    { header: "Filter", key: "filter", width: 34 },
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
    ["Application Status", humanize(filters.applicationStatus)],
    ["CAS Status", humanize(filters.casStatus)],
    ["Visa Status", humanize(filters.visaStatus)],
    ["Loan Status", humanize(filters.loanStatus)],
    ["NBFC / Bank", filters.nbfc || "All"],
    ["Fintech Assignee ID", filters.fintechAssigneeId || "All"],
    ["Lifecycle Date Range", humanize(filters.datePreset)],
    ["Custom Start Date", filters.startDate || "Not Set"],
    ["Custom End Date", filters.endDate || "Not Set"],
  ];
  filterRows.forEach(([filter, value]) =>
    filterSheet.addRow({ filter, value }),
  );
  styleWorksheet(filterSheet);
}

function addPipeline(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: PerformanceReportRow[],
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: "Record Type", key: "recordType", width: 16 },
    { header: "Walk-in Number", key: "leadNumber", width: 18 },
    { header: "Applicant Name", key: "studentName", width: 24 },
    { header: "Email", key: "emailId", width: 30 },
    { header: "Mobile", key: "mobileNumber", width: 18 },
    { header: "Branch", key: "branchName", width: 24 },
    { header: "Current Owner", key: "counselorName", width: 24 },
    { header: "Source", key: "source", width: 20 },
    { header: "Country", key: "countryName", width: 20 },
    { header: "Intake", key: "intakeName", width: 20 },
    { header: "Course", key: "courseName", width: 28 },
    { header: "Lifecycle Status", key: "lifecycleStatus", width: 22 },
    { header: "Current Stage", key: "currentStage", width: 22 },
    { header: "Created Date", key: "createdAt", width: 18 },
    { header: "Application Conversion Date", key: "convertedAt", width: 24 },
    { header: "Next Follow-up", key: "nextFollowup", width: 18 },
    { header: "University Applications", key: "applicationsCount", width: 22 },
    { header: "Latest University", key: "latestUniversityName", width: 34 },
    {
      header: "Latest Application Date",
      key: "latestApplicationDate",
      width: 22,
    },
    {
      header: "Latest Application Status",
      key: "latestApplicationStatus",
      width: 24,
    },
    { header: "Latest Offer Status", key: "latestOfferStatus", width: 22 },
    { header: "CAS Status", key: "casStatus", width: 18 },
    { header: "Visa Status", key: "visaStatus", width: 18 },
    { header: "Loan Login", key: "loanLogin", width: 16 },
    { header: "Loan Status", key: "loanStatus", width: 20 },
    { header: "Loan Approved", key: "loanApproved", width: 18 },
    { header: "NBFC / Bank", key: "nbfc", width: 22 },
    { header: "Fintech Assignee", key: "fintechAssigneeName", width: 24 },
  ];
  rows.forEach((row) =>
    sheet.addRow({
      ...row,
      recordType: row.recordType === "lead" ? "Walk-in" : "Application",
      createdAt: formatDate(row.createdAt),
      convertedAt: formatDate(row.convertedAt),
      nextFollowup: formatDate(row.nextFollowup),
      latestApplicationDate: formatDate(row.latestApplicationDate),
      loanLogin: row.loanLogin ? "Yes" : "No",
      loanApproved: row.loanApproved ? "Yes" : "No",
    }),
  );
  styleWorksheet(sheet);
}

function addApplications(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
) {
  const sheet = workbook.addWorksheet("University Applications");
  sheet.columns = [
    { header: "Application ID", key: "applicationId", width: 38 },
    { header: "Walk-in Number", key: "leadNumber", width: 18 },
    { header: "Applicant Name", key: "studentName", width: 24 },
    { header: "Branch", key: "branchName", width: 24 },
    { header: "Current Owner", key: "counselorName", width: 24 },
    { header: "Country", key: "countryName", width: 20 },
    { header: "University", key: "universityName", width: 34 },
    { header: "Course", key: "courseName", width: 28 },
    { header: "Intake", key: "intakeName", width: 20 },
    { header: "Portal", key: "portal", width: 20 },
    { header: "Application Date", key: "applicationDate", width: 20 },
    { header: "Application Status", key: "applicationStatus", width: 22 },
    { header: "Offer Status", key: "offerStatus", width: 20 },
    { header: "CAS Status", key: "casStatus", width: 18 },
    { header: "Visa Status", key: "visaStatus", width: 18 },
    { header: "Loan Status", key: "loanStatus", width: 20 },
    { header: "NBFC / Bank", key: "nbfc", width: 20 },
    { header: "Fintech Assignee", key: "fintechAssigneeName", width: 24 },
  ];
  (report.applicationRows ?? []).forEach((row) =>
    sheet.addRow({ ...row, applicationDate: formatDate(row.applicationDate) }),
  );
  styleWorksheet(sheet);
}

function performanceColumns(first: string, second?: string) {
  return [
    { header: first, key: "branch", width: 28 },
    ...(second ? [{ header: second, key: "counselor", width: 28 }] : []),
    { header: "Total Walk-ins", key: "totalWalkins", width: 18 },
    { header: "Walk-ins Added", key: "leadsCreated", width: 18 },
    { header: "Active Walk-ins", key: "leads", width: 18 },
    { header: "Qualified Walk-ins", key: "qualifiedLeads", width: 20 },
    { header: "Drop Walk-ins", key: "lostLeads", width: 18 },
    { header: "Applications", key: "students", width: 18 },
    { header: "Dropped Applications", key: "droppedStudents", width: 22 },
    { header: "Loan Logins", key: "loanLogins", width: 16 },
    { header: "Loan Approved", key: "loanApproved", width: 18 },
    {
      header: "Application Conversions (No. / %)",
      key: "applicationConversions",
      width: 28,
    },
    {
      header: "Visa Conversions (No. / %)",
      key: "visaConversions",
      width: 25,
    },
    { header: "Visa Approval Target", key: "target", width: 20 },
    { header: "Target Achieved (Visa Approved)", key: "achieved", width: 24 },
    {
      header: "Target Completion",
      key: "targetCompletionPercentage",
      width: 20,
    },
    { header: "University Applications", key: "applications", width: 24 },
    { header: "Offers", key: "offers", width: 16 },
    { header: "CAS Received", key: "casReceived", width: 18 },
  ];
}

function addBranch(workbook: ExcelJS.Workbook, report: PerformanceReportData) {
  const sheet = workbook.addWorksheet("Branch Performance");
  sheet.columns = performanceColumns("Branch");
  report.branchPerformance.forEach((row) =>
    sheet.addRow({ branch: row.branch, ...metricValues(row) }),
  );
  const total = calculatePerformanceTotals(report.branchPerformance);
  const totalRow = sheet.addRow({
    branch: "Grand Total",
    ...metricValues(total),
  });
  styleWorksheet(sheet);
  styleTotal(totalRow, GRAND_TOTAL_FILL);
}

function addCounselor(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
) {
  const sheet = workbook.addWorksheet("User Performance");
  sheet.columns = performanceColumns("Branch", "User");
  const groups = groupCounselorPerformance(report.counselorPerformance);
  for (const group of groups) {
    group.rows.forEach((row) =>
      sheet.addRow({
        branch: row.branch,
        counselor: row.counselor,
        ...metricValues(row),
      }),
    );
    const subtotal = sheet.addRow({
      branch: `${group.branch} Total`,
      counselor: "",
      ...metricValues(group.totals),
    });
    styleTotal(subtotal, TOTAL_FILL);
  }
  const grandTotal = sheet.addRow({
    branch: "Grand Total",
    counselor: "All Branches",
    ...metricValues(calculatePerformanceTotals(report.counselorPerformance)),
  });
  styleWorksheet(sheet);
  styleTotal(grandTotal, GRAND_TOTAL_FILL);
}

function addMonthly(workbook: ExcelJS.Workbook, report: PerformanceReportData) {
  const sheet = workbook.addWorksheet("Monthly Volume");
  sheet.columns = [
    { header: "Month", key: "label", width: 18 },
    { header: "Walk-ins", key: "leads", width: 16 },
    { header: "Applications", key: "students", width: 18 },
    { header: "University Applications", key: "applications", width: 24 },
    { header: "Loan Logins", key: "loanLogins", width: 16 },
    { header: "Loan Approved", key: "loanApproved", width: 18 },
    { header: "Visa Conversions", key: "visaConversions", width: 20 },
  ];
  sheet.addRows(report.monthlyVolume);
  styleWorksheet(sheet);
}

function addCountry(workbook: ExcelJS.Workbook, report: PerformanceReportData) {
  const sheet = workbook.addWorksheet("Country Demand");
  sheet.columns = [
    { header: "Country", key: "country", width: 24 },
    { header: "Walk-ins", key: "leads", width: 16 },
    { header: "Applications", key: "students", width: 18 },
    { header: "University Applications", key: "applications", width: 24 },
  ];
  sheet.addRows(report.countryDemand);
  styleWorksheet(sheet);
}

function addLeadSource(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
) {
  const sheet = workbook.addWorksheet("Walk-in Sources");
  sheet.columns = [
    { header: "Source", key: "source", width: 26 },
    { header: "Walk-ins", key: "leads", width: 16 },
    { header: "Applications", key: "students", width: 18 },
    { header: "Total", key: "total", width: 16 },
  ];
  sheet.addRows(report.leadSourceBreakdown);
  styleWorksheet(sheet);
}

function addStatus(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Array<{ status: string; count: number }>,
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: "Status", key: "status", width: 28 },
    { header: "Count", key: "count", width: 16 },
  ];
  sheet.addRows(rows);
  styleWorksheet(sheet);
}

export async function buildPerformanceReportWorkbook(
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VSource CRM";
  workbook.created = new Date();
  addSummary(workbook, report, filters);
  addPipeline(workbook, "Walk-ins and Applications", report.rows);
  addApplications(workbook, report);
  addBranch(workbook, report);
  addCounselor(workbook, report);
  addMonthly(workbook, report);
  addCountry(workbook, report);
  addLeadSource(workbook, report);
  addStatus(workbook, "Walk-in Status", report.leadStatusBreakdown);
  addStatus(workbook, "Application Status", report.applicationStatusBreakdown);
  addStatus(workbook, "Visa Status", report.visaStatusBreakdown);
  addStatus(workbook, "Loan Status", report.loanStatusBreakdown);
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
