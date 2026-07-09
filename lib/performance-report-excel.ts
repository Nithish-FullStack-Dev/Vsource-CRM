import ExcelJS from "exceljs";
import type {
  PerformanceReportData,
  PerformanceReportFilters,
  PerformanceReportRow,
} from "@/types/performance-report";

const HEADER_FILL = "FF9F1239";
const HEADER_TEXT = "FFFFFFFF";
const SUBTLE_FILL = "FFF8FAFC";
const BORDER_COLOR = "FFE2E8F0";

function humanize(value: string): string {
  if (!value) {
    return "All";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN");
}

function styleHeader(row: ExcelJS.Row): void {
  row.height = 24;
  row.font = {
    bold: true,
    color: {
      argb: HEADER_TEXT,
    },
  };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: HEADER_FILL,
    },
  };
  row.alignment = {
    vertical: "middle",
  };
}

function styleWorksheet(worksheet: ExcelJS.Worksheet): void {
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
        left: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
        bottom: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
        right: {
          style: "thin",
          color: {
            argb: BORDER_COLOR,
          },
        },
      };

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    });

    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: SUBTLE_FILL,
        },
      };
    }
  });

  const headerRow = worksheet.getRow(1);
  styleHeader(headerRow);

  if (worksheet.columnCount > 0 && worksheet.rowCount > 0) {
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: worksheet.columnCount,
      },
    };
  }
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
  filters: PerformanceReportFilters,
): void {
  const worksheet = workbook.addWorksheet("Summary");

  worksheet.columns = [
    {
      header: "Metric",
      key: "metric",
      width: 36,
    },
    {
      header: "Value",
      key: "value",
      width: 24,
    },
  ];

  const summaryRows: Array<[string, string | number]> = [
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
    ["Target Months Included", report.summary.targetMonths],
    ["Lead to Student Conversion Rate", `${report.summary.conversionRate}%`],
    ["Student Applications", report.summary.totalApplications],
    ["Offer Applications", report.summary.offerApplications],
    ["Visa Approved Students", report.summary.visaApprovedStudents],
    ["CAS Received Students", report.summary.casReceivedStudents],
    ["Loan Sanctioned Students", report.summary.loanSanctionedStudents],
  ];

  const currencyMetrics = new Set([
    "Total Applied Amount",
    "Total Sanctioned Amount",
    "Total Disbursed Amount",
  ]);

  for (const [metric, value] of summaryRows) {
    const row = worksheet.addRow({ metric, value });

    if (currencyMetrics.has(metric)) {
      row.getCell(2).numFmt = "₹#,##0.00";
    }
  }

  styleWorksheet(worksheet);

  const filtersWorksheet = workbook.addWorksheet("Applied Filters");

  filtersWorksheet.columns = [
    {
      header: "Filter",
      key: "filter",
      width: 34,
    },
    {
      header: "Value",
      key: "value",
      width: 44,
    },
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

  for (const [filter, value] of filterRows) {
    filtersWorksheet.addRow({ filter, value });
  }

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
    {
      header: "Latest University",
      key: "latestUniversityName",
      width: 34,
    },
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
    {
      header: "Fintech Assignee",
      key: "fintechAssigneeName",
      width: 24,
    },
    { header: "Sanctioned Amount", key: "sanctionedAmount", width: 20 },
    { header: "Disbursed Amount", key: "disbursedAmount", width: 20 },
    { header: "Lead ID", key: "leadId", width: 38 },
    { header: "Student ID", key: "studentId", width: 38 },
    { header: "Record ID", key: "recordId", width: 38 },
  ];

  for (const row of rows) {
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
  }

  worksheet.getColumn("sanctionedAmount").numFmt = "₹#,##0.00";
  worksheet.getColumn("disbursedAmount").numFmt = "₹#,##0.00";
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
    {
      header: "Fintech Assignee",
      key: "fintechAssigneeName",
      width: 24,
    },
    { header: "NBFC", key: "nbfc", width: 22 },
    { header: "Loan Status", key: "loanStatus", width: 20 },
    { header: "PF Status", key: "pfStatus", width: 20 },
    { header: "Applied Amount", key: "appliedAmount", width: 18 },
    { header: "Sanctioned Amount", key: "sanctionedAmount", width: 20 },
    { header: "Disbursed", key: "disbursed", width: 14 },
    { header: "Disbursed Amount", key: "disbursedAmount", width: 20 },
    { header: "Student ID", key: "studentId", width: 38 },
    { header: "Application ID", key: "applicationId", width: 38 },
  ];

  for (const row of report.applicationRows ?? []) {
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
  }

  worksheet.getColumn("appliedAmount").numFmt = "₹#,##0.00";
  worksheet.getColumn("sanctionedAmount").numFmt = "₹#,##0.00";
  worksheet.getColumn("disbursedAmount").numFmt = "₹#,##0.00";
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

function addBranchSheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Branch Performance");

  worksheet.columns = [
    { header: "Branch", key: "branch", width: 28 },
    { header: "Leads Added", key: "leadsCreated", width: 18 },
    { header: "Active Leads", key: "leads", width: 16 },
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
    { header: "Applications", key: "applications", width: 18 },
    { header: "Conversion Rate", key: "conversionRate", width: 20 },
    { header: "Visa Approved", key: "visaApproved", width: 18 },
    { header: "Sanctioned Amount", key: "sanctionedAmount", width: 22 },
    { header: "Disbursed Amount", key: "disbursedAmount", width: 22 },
  ];

  for (const row of report.branchPerformance) {
    worksheet.addRow({
      ...row,
      targetCompletionPercentage: `${row.targetCompletionPercentage}%`,
      conversionRate: `${row.conversionRate}%`,
    });
  }

  worksheet.getColumn("sanctionedAmount").numFmt = "₹#,##0.00";
  worksheet.getColumn("disbursedAmount").numFmt = "₹#,##0.00";
  styleWorksheet(worksheet);
}

function addCounselorSheet(
  workbook: ExcelJS.Workbook,
  report: PerformanceReportData,
): void {
  const worksheet = workbook.addWorksheet("Counsellor Performance");

  worksheet.columns = [
    { header: "Branch", key: "branch", width: 26 },
    { header: "Counsellor", key: "counselor", width: 26 },
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
    { header: "Loan Sanctioned", key: "loanSanctioned", width: 18 },
    { header: "Sanctioned Amount", key: "sanctionedAmount", width: 22 },
    { header: "Disbursed Amount", key: "disbursedAmount", width: 22 },
  ];

  for (const row of report.counselorPerformance) {
    worksheet.addRow({
      ...row,
      targetCompletionPercentage: `${row.targetCompletionPercentage}%`,
      conversionRate: `${row.conversionRate}%`,
    });
  }

  worksheet.getColumn("sanctionedAmount").numFmt = "₹#,##0.00";
  worksheet.getColumn("disbursedAmount").numFmt = "₹#,##0.00";
  styleWorksheet(worksheet);

  let groupStart = 2;

  while (groupStart <= worksheet.rowCount) {
    const branch = worksheet.getCell(groupStart, 1).value;
    let groupEnd = groupStart;

    while (
      groupEnd + 1 <= worksheet.rowCount &&
      worksheet.getCell(groupEnd + 1, 1).value === branch
    ) {
      groupEnd += 1;
    }

    if (groupEnd > groupStart) {
      worksheet.mergeCells(groupStart, 1, groupEnd, 1);
      worksheet.getCell(groupStart, 1).alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true,
      };
    }

    groupStart = groupEnd + 1;
  }
}

function addStatusSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Array<{
    status: string;
    count: number;
  }>,
): void {
  const worksheet = workbook.addWorksheet(name);

  worksheet.columns = [
    { header: "Status", key: "status", width: 30 },
    { header: "Count", key: "count", width: 16 },
  ];

  worksheet.addRows(rows);
  styleWorksheet(worksheet);
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
  addBranchSheet(workbook, report);
  addCounselorSheet(workbook, report);
  addLeadSourceSheet(workbook, report);
  addStatusSheet(workbook, "Lead Status", report.leadStatusBreakdown);
  addStatusSheet(
    workbook,
    "Application Status",
    report.applicationStatusBreakdown,
  );
  addStatusSheet(workbook, "Visa Status", report.visaStatusBreakdown);
  addStatusSheet(workbook, "Loan Status", report.loanStatusBreakdown);

  const buffer = await workbook.xlsx.writeBuffer();

  return new Uint8Array(buffer);
}
