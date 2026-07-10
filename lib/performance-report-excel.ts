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

function humanize(value: string): string {
  return value
    ? value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "All";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN");
}

function styleHeader(row: ExcelJS.Row): void {
  row.height = 24;
  row.font = { bold: true, color: { argb: HEADER_TEXT } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  row.alignment = { vertical: "middle" };
}

function styleTotalRow(
  row: ExcelJS.Row,
  fill: string,
  fontColor = "FF0F172A",
): void {
  row.font = { bold: true, color: { argb: fontColor } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: fill },
  };
}

function styleWorksheet(worksheet: ExcelJS.Worksheet): void {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  worksheet.eachRow((row, rowNumber) => {
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

  styleHeader(worksheet.getRow(1));

  if (worksheet.columnCount > 0 && worksheet.rowCount > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columnCount },
    };
  }
}

function metricValues(metrics: PerformanceReportMetricRow) {
  return {
    totalWalkins: metrics.totalWalkins,
    leadsCreated: metrics.leadsCreated,
    leads: metrics.leads,
    qualifiedLeads: metrics.qualifiedLeads,
    lostLeads: metrics.lostLeads,
    students: metrics.students,
    droppedStudents: metrics.droppedStudents,
    target: metrics.target,
    achieved: metrics.achieved,
    targetCompletionPercentage: `${metrics.targetCompletionPercentage}%`,
    applications: metrics.applications,
    offers: metrics.offers,
    conversionRate: `${metrics.conversionRate}%`,
    casReceived: metrics.casReceived,
    visaApproved: metrics.visaApproved,
  };
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
): void {
  const worksheet = workbook.addWorksheet("Summary");
  worksheet.columns = [
    { header: "Metric", key: "metric", width: 38 },
    { header: "Value", key: "value", width: 24 },
  ];
  const rows: Array<[string, string | number]> = [
    ["Generated At", new Date(report.generatedAt).toLocaleString("en-IN")],
    ["All Walk-in Records", report.summary.totalPipelineRecords],
    ["Leads Added", report.summary.totalLeadsCreated],
    ["Active / Unconverted Leads", report.summary.totalLeads],
    ["Qualified Leads", report.summary.qualifiedLeads],
    ["Lost Leads", report.summary.lostLeads],
    ["Converted Students", report.summary.totalStudents],
    ["Dropped Students", report.summary.droppedStudents],
    ["Student Target", report.summary.totalTarget],
    ["Target Achieved", report.summary.totalAchieved],
    ["Target Completion", `${report.summary.targetCompletionPercentage}%`],
    ["Target Assignments", report.summary.targetAssignments],
    ["Lead to Student Conversion", `${report.summary.conversionRate}%`],
    ["University Applications", report.summary.totalApplications],
    ["Offer Applications", report.summary.offerApplications],
    ["CAS Received Students", report.summary.casReceivedStudents],
    ["Visa Approved Students", report.summary.visaApprovedStudents],
  ];

  rows.forEach(([metric, value]) => worksheet.addRow({ metric, value }));
  styleWorksheet(worksheet);

  const filtersWorksheet = workbook.addWorksheet("Applied Filters");
  filtersWorksheet.columns = [
    { header: "Filter", key: "filter", width: 34 },
    { header: "Value", key: "value", width: 44 },
  ];
  const filterRows: Array<[string, string]> = [
    ["Search", filters.search || "All"],
    ["Report Scope", humanize(filters.recordScope)],
    ["Branch ID", filters.branchId || "All"],
    ["Counselor ID", filters.counselorId || "All"],
    ["Lead Status", humanize(filters.leadStatus)],
    ["Lead Source", filters.leadSource || "All"],
    ["Country ID", filters.countryId || "All"],
    ["Intake ID", filters.intakeId || "All"],
    ["University ID", filters.universityId || "All"],
    ["Application Status", humanize(filters.applicationStatus)],
    ["CAS Status", humanize(filters.casStatus)],
    ["Visa Status", humanize(filters.visaStatus)],
    ["Loan Status", humanize(filters.loanStatus)],
    ["NBFC", filters.nbfc || "All"],
    ["Fintech Assignee ID", filters.fintechAssigneeId || "All"],
    ["Lifecycle Date Range", humanize(filters.datePreset)],
    ["Custom Start Date", filters.startDate || "Not Set"],
    ["Custom End Date", filters.endDate || "Not Set"],
  ];

  filterRows.forEach(([filter, value]) =>
    filtersWorksheet.addRow({ filter, value }),
  );
  styleWorksheet(filtersWorksheet);
}

function addPipelineSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: PerformanceReportRow[],
): void {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = [
    { header: "Record Type", key: "recordType", width: 16 },
    { header: "Lead Number", key: "leadNumber", width: 18 },
    { header: "Student Name", key: "studentName", width: 24 },
    { header: "Email", key: "emailId", width: 30 },
    { header: "Mobile", key: "mobileNumber", width: 18 },
    { header: "Branch", key: "branchName", width: 24 },
    { header: "Counselor", key: "counselorName", width: 24 },
    { header: "Source", key: "source", width: 20 },
    { header: "Country", key: "countryName", width: 20 },
    { header: "Intake", key: "intakeName", width: 20 },
    { header: "Course", key: "courseName", width: 28 },
    { header: "Lifecycle Status", key: "lifecycleStatus", width: 22 },
    { header: "Current Stage", key: "currentStage", width: 22 },
    { header: "Created Date", key: "createdAt", width: 18 },
    { header: "Converted Date", key: "convertedAt", width: 18 },
    { header: "Next Follow-up", key: "nextFollowup", width: 18 },
    { header: "Applications", key: "applicationsCount", width: 15 },
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
    { header: "Loan Status", key: "loanStatus", width: 18 },
    { header: "NBFC", key: "nbfc", width: 20 },
    { header: "Fintech Assignee", key: "fintechAssigneeName", width: 24 },
    { header: "Lead ID", key: "leadId", width: 38 },
    { header: "Student ID", key: "studentId", width: 38 },
    { header: "Record ID", key: "recordId", width: 38 },
  ];

  rows.forEach((row) => {
    worksheet.addRow({
      ...row,
      recordType: humanize(row.recordType),
      lifecycleStatus: humanize(row.lifecycleStatus),
      currentStage: humanize(row.currentStage),
      createdAt: formatDate(row.createdAt),
      convertedAt: formatDate(row.convertedAt),
      nextFollowup: formatDate(row.nextFollowup),
      latestApplicationDate: formatDate(row.latestApplicationDate),
      latestApplicationStatus: humanize(row.latestApplicationStatus),
      latestOfferStatus: humanize(row.latestOfferStatus),
      casStatus: humanize(row.casStatus),
      visaStatus: humanize(row.visaStatus),
      loanStatus: humanize(row.loanStatus),
    });
  });
  styleWorksheet(worksheet);
}

function addApplicationsSheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Applications");
  worksheet.columns = [
    { header: "Lead Number", key: "leadNumber", width: 18 },
    { header: "Student Name", key: "studentName", width: 24 },
    { header: "Email", key: "emailId", width: 30 },
    { header: "Mobile", key: "mobileNumber", width: 18 },
    { header: "Branch", key: "branchName", width: 22 },
    { header: "Counselor", key: "counselorName", width: 22 },
    { header: "Source", key: "source", width: 20 },
    { header: "Country", key: "countryName", width: 18 },
    { header: "University", key: "universityName", width: 34 },
    { header: "Course", key: "courseName", width: 30 },
    { header: "Intake", key: "intakeName", width: 20 },
    { header: "Portal", key: "portal", width: 18 },
    { header: "Application Date", key: "applicationDate", width: 18 },
    { header: "Application Status", key: "applicationStatus", width: 22 },
    { header: "Offer Status", key: "offerStatus", width: 22 },
    { header: "Deposit Status", key: "depositStatus", width: 20 },
    { header: "IHS Paid Status", key: "ihsPaidStatus", width: 20 },
    { header: "Visa Paid Status", key: "visaPaidStatus", width: 20 },
    { header: "CAS Status", key: "casStatus", width: 20 },
    { header: "Visa Status", key: "visaStatus", width: 20 },
    { header: "Fintech Assignee", key: "fintechAssigneeName", width: 24 },
    { header: "NBFC", key: "nbfc", width: 22 },
    { header: "Loan Status", key: "loanStatus", width: 20 },
    { header: "PF Status", key: "pfStatus", width: 20 },
    { header: "Disbursed", key: "disbursed", width: 14 },
    { header: "Student ID", key: "studentId", width: 38 },
    { header: "Application ID", key: "applicationId", width: 38 },
  ];

  (report.applicationRows ?? []).forEach((row) => {
    worksheet.addRow({
      ...row,
      applicationDate: formatDate(row.applicationDate),
      applicationStatus: humanize(row.applicationStatus),
      offerStatus: humanize(row.offerStatus),
      depositStatus: humanize(row.depositStatus),
      ihsPaidStatus: humanize(row.ihsPaidStatus),
      visaPaidStatus: humanize(row.visaPaidStatus),
      casStatus: humanize(row.casStatus),
      visaStatus: humanize(row.visaStatus),
      loanStatus: humanize(row.loanStatus),
      pfStatus: humanize(row.pfStatus),
      disbursed: row.disbursed ? "Yes" : "No",
    });
  });
  styleWorksheet(worksheet);
}

function addMonthlySheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Monthly Funnel");
  worksheet.columns = [
    { header: "Month", key: "label", width: 18 },
    { header: "New Leads", key: "leads", width: 18 },
    { header: "Converted Students", key: "students", width: 20 },
    { header: "Applications", key: "applications", width: 18 },
  ];
  worksheet.addRows(report.monthlyVolume);
  styleWorksheet(worksheet);
}

function addCountrySheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Country Demand");
  worksheet.columns = [
    { header: "Country", key: "country", width: 24 },
    { header: "Leads", key: "leads", width: 16 },
    { header: "Students", key: "students", width: 16 },
    { header: "Applications", key: "applications", width: 18 },
  ];
  worksheet.addRows(report.countryDemand);
  styleWorksheet(worksheet);
}

function performanceColumns(firstHeader: string, secondHeader?: string) {
  return [
    { header: firstHeader, key: "branch", width: 28 },
    ...(secondHeader
      ? [{ header: secondHeader, key: "counselor", width: 26 }]
      : []),
    { header: "Total Walk-ins", key: "totalWalkins", width: 18 },
    { header: "Leads Added", key: "leadsCreated", width: 16 },
    { header: "Active Leads", key: "leads", width: 16 },
    { header: "Qualified Leads", key: "qualifiedLeads", width: 18 },
    { header: "Lost Leads", key: "lostLeads", width: 16 },
    { header: "Students", key: "students", width: 16 },
    { header: "Dropped Students", key: "droppedStudents", width: 20 },
    { header: "Student Target", key: "target", width: 18 },
    { header: "Target Achieved", key: "achieved", width: 18 },
    {
      header: "Target Completion",
      key: "targetCompletionPercentage",
      width: 20,
    },
    { header: "Applications", key: "applications", width: 16 },
    { header: "Offers", key: "offers", width: 14 },
    { header: "Conversion Rate", key: "conversionRate", width: 18 },
    { header: "CAS Received", key: "casReceived", width: 16 },
    { header: "Visa Approved", key: "visaApproved", width: 16 },
  ];
}

function addBranchSheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Branch Performance");
  worksheet.columns = performanceColumns("Branch");

  report.branchPerformance.forEach((row) => {
    worksheet.addRow({ branch: row.branch, ...metricValues(row) });
  });

  const totalRow = worksheet.addRow({
    branch: "Grand Total",
    ...metricValues(calculatePerformanceTotals(report.branchPerformance)),
  });
  styleWorksheet(worksheet);
  styleTotalRow(totalRow, GRAND_TOTAL_FILL);
}

function addCounselorSheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Counsellor Performance");
  worksheet.columns = performanceColumns("Branch", "Counsellor");

  groupCounselorPerformance(report.counselorPerformance).forEach((group) => {
    group.rows.forEach((row) => {
      worksheet.addRow({
        branch: row.branch,
        counselor: row.counselor,
        ...metricValues(row),
      });
    });

    const subtotalRow = worksheet.addRow({
      branch: `${group.branch} Total`,
      counselor: "",
      ...metricValues(group.totals),
    });
    styleTotalRow(subtotalRow, TOTAL_FILL);
  });

  const grandTotalRow = worksheet.addRow({
    branch: "Grand Total",
    counselor: "",
    ...metricValues(calculatePerformanceTotals(report.counselorPerformance)),
  });
  styleWorksheet(worksheet);
  styleTotalRow(grandTotalRow, GRAND_TOTAL_FILL);
}

function addLeadSourceSheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Lead Sources");
  worksheet.columns = [
    { header: "Source", key: "source", width: 28 },
    { header: "Leads", key: "leads", width: 16 },
    { header: "Students", key: "students", width: 16 },
    { header: "Total", key: "total", width: 16 },
  ];
  worksheet.addRows(report.leadSourceBreakdown);
  styleWorksheet(worksheet);
}

function addStatusSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Array<{ status: string; count: number }>,
): void {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = [
    { header: "Status", key: "status", width: 30 },
    { header: "Count", key: "count", width: 16 },
  ];
  worksheet.addRows(rows);
  styleWorksheet(worksheet);
}

export async function buildPerformanceReportWorkbook(
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VSource CRM";
  workbook.lastModifiedBy = "VSource CRM";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = "VSource CRM lead and student performance report";
  workbook.title = "Performance Report";

  addSummarySheet(workbook, report, filters);
  addBranchSheet(workbook, report);
  addCounselorSheet(workbook, report);
  addPipelineSheet(workbook, "Pipeline Records", report.rows);
  addPipelineSheet(
    workbook,
    "Leads",
    report.rows.filter((row) => row.recordType === "lead"),
  );
  addPipelineSheet(
    workbook,
    "Students",
    report.rows.filter((row) => row.recordType === "student"),
  );
  addApplicationsSheet(workbook, report);
  addMonthlySheet(workbook, report);
  addCountrySheet(workbook, report);
  addLeadSourceSheet(workbook, report);
  addStatusSheet(workbook, "Lead Status", report.leadStatusBreakdown);
  addStatusSheet(
    workbook,
    "Application Status",
    report.applicationStatusBreakdown,
  );

  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
