import { Workbook, type Cell, type Worksheet } from "exceljs";
import type {
  DirectorReportComparisonRow,
  DirectorReportData,
  DirectorReportFilters,
  DirectorReportIntakeComparisonRow,
  DirectorReportLeadDetail,
  DirectorReportRow,
  DirectorReportSummary,
  DirectorReportTableTotals,
} from "@/types/director-report";

const HEADER_FILL = "1F2937";
const GROUP_FILL = "991B1B";
const SUBTLE_FILL = "F3F4F6";
const ACCENT_FILL = "FEE2E2";
const BORDER_COLOR = "D1D5DB";

const reportColumns: Array<{
  header: string;
  key: keyof DirectorReportRow;
  width: number;
  format?: string;
}> = [
  { header: "Total Walk-ins", key: "totalWalkins", width: 14 },
  { header: "Leads Added", key: "leadsAdded", width: 13 },
  { header: "All Leads", key: "allLeads", width: 12 },
  { header: "Active Leads", key: "activeLeads", width: 13 },
  { header: "Qualified", key: "qualifiedLeads", width: 12 },
  { header: "Lead Lost", key: "lostLeads", width: 12 },
  { header: "Students", key: "students", width: 11 },
  { header: "Student Drop", key: "droppedStudents", width: 13 },
  { header: "Target", key: "target", width: 10 },
  { header: "Achieved", key: "achieved", width: 11 },
  { header: "Target %", key: "targetCompletionPercentage", width: 11, format: "0.0%" },
  { header: "Applications", key: "applications", width: 13 },
  { header: "Offers", key: "offers", width: 10 },
  { header: "CAS", key: "casReceived", width: 10 },
  { header: "Visa Approved", key: "visaApproved", width: 14 },
  { header: "Loan Logins", key: "loanLogins", width: 13 },
  { header: "Loan Approved", key: "loanApproved", width: 14 },
  { header: "Loan Disbursed", key: "loanDisbursed", width: 15 },
  { header: "Lead Conv %", key: "leadToStudentConversionPercentage", width: 12, format: "0.0%" },
  { header: "App Conv %", key: "applicationConversionPercentage", width: 12, format: "0.0%" },
  { header: "Visa Conv %", key: "visaConversionPercentage", width: 12, format: "0.0%" },
  { header: "Loan Approval %", key: "loanConversionPercentage", width: 15, format: "0.0%" },
  { header: "Applied Amount", key: "appliedAmount", width: 16, format: "₹#,##0" },
  { header: "Sanctioned Amount", key: "sanctionedAmount", width: 18, format: "₹#,##0" },
  { header: "Disbursed Amount", key: "disbursedAmount", width: 18, format: "₹#,##0" },
  { header: "Weekly Avg Walk-ins", key: "avgWeeklyWalkins", width: 18 },
  { header: "Weekly Avg Applications", key: "avgWeeklyApplications", width: 21 },
  { header: "Weekly Avg Loan Logins", key: "avgWeeklyLoanLogins", width: 21 },
  { header: "Weekly Avg Loan Approved", key: "avgWeeklyLoanApproved", width: 23 },
  { header: "Weekly Avg Visa", key: "avgWeeklyVisaApproved", width: 17 },
  { header: "Lead Numbers", key: "leadNumbers", width: 34 },
];

function applyBorder(cell: Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: BORDER_COLOR } },
    left: { style: "thin", color: { argb: BORDER_COLOR } },
    bottom: { style: "thin", color: { argb: BORDER_COLOR } },
    right: { style: "thin", color: { argb: BORDER_COLOR } },
  };
}

function addTitle(
  sheet: Worksheet,
  title: string,
  report: DirectorReportData,
  columnCount: number,
) {
  sheet.mergeCells(1, 1, 1, columnCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GROUP_FILL } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(2, 1, 2, columnCount);
  const metaCell = sheet.getCell(2, 1);
  metaCell.value = `Generated: ${new Date(report.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
  metaCell.font = { italic: true, color: { argb: "4B5563" } };
  metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBTLE_FILL } };
  metaCell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleHeaderRow(sheet: Worksheet, rowNumber: number) {
  const row = sheet.getRow(rowNumber);
  row.height = 30;

  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyBorder(cell);
  });
}

function styleDataRows(sheet: Worksheet, startRow: number) {
  for (let rowNumber = startRow; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.height = 22;

    row.eachCell((cell) => {
      applyBorder(cell);
      cell.alignment = { vertical: "middle", wrapText: true };

      if (rowNumber % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FAFAFA" } };
      }
    });
  }
}

function percentValue(value: unknown): number {
  return Number(value ?? 0) / 100;
}

function rowMetricValue(row: DirectorReportRow, column: (typeof reportColumns)[number]) {
  const value = row[column.key];

  if (column.key === "leadNumbers") {
    return Array.isArray(value) ? value.join(", ") : "";
  }

  if (column.format === "0.0%") return percentValue(value);
  return Number(value ?? 0);
}

function reportGroupKey(
  row: DirectorReportRow,
  options: { showPeriod?: boolean; showIntake?: boolean },
): string {
  return [
    options.showPeriod ? row.periodKey : "all-periods",
    options.showIntake ? row.intakeId ?? "not-set" : "all-intakes",
    row.branchId,
  ].join(":");
}

function styleSubtotalRow(sheet: Worksheet, rowNumber: number) {
  const row = sheet.getRow(rowNumber);
  row.height = 23;
  row.eachCell((cell) => {
    applyBorder(cell);
    cell.font = { bold: true, color: { argb: "7F1D1D" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: ACCENT_FILL },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

function styleGrandTotalRow(sheet: Worksheet, rowNumber: number) {
  const row = sheet.getRow(rowNumber);
  row.height = 25;
  row.eachCell((cell) => {
    applyBorder(cell);
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: GROUP_FILL },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

function addReportRowsSheet(
  workbook: Workbook,
  report: DirectorReportData,
  sheetName: string,
  title: string,
  rows: DirectorReportRow[],
  totals: DirectorReportTableTotals,
  options: { showPeriod?: boolean; showIntake?: boolean },
) {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [
      {
        state: "frozen",
        ySplit: 4,
        xSplit: options.showPeriod || options.showIntake ? 4 : 2,
      },
    ],
  });
  const identityHeaders = [
    ...(options.showPeriod ? ["Date / Period"] : []),
    ...(options.showIntake ? ["Intake"] : []),
    "Branch",
    "User",
  ];
  const headers = [
    ...identityHeaders,
    ...reportColumns.map((column) => column.header),
  ];
  const groups = new Map<
    string,
    { rows: DirectorReportRow[]; total: DirectorReportRow }
  >();

  for (const total of totals.branchRows) {
    groups.set(reportGroupKey(total, options), { rows: [], total });
  }

  for (const row of rows) {
    const key = reportGroupKey(row, options);
    const current = groups.get(key) ?? { rows: [], total: row };
    current.rows.push(row);
    groups.set(key, current);
  }

  const orderedGroups = Array.from(groups.values()).sort(
    (a, b) =>
      a.total.periodKey.localeCompare(b.total.periodKey) ||
      (a.total.intakeName ?? "").localeCompare(b.total.intakeName ?? "") ||
      a.total.branchName.localeCompare(b.total.branchName),
  );
  const subtotalRows: number[] = [];

  addTitle(sheet, title, report, headers.length);
  sheet.addRow([]);
  sheet.addRow(headers);
  styleHeaderRow(sheet, 4);

  const rowValues = (row: DirectorReportRow, userLabel = row.counselorName) => [
    ...(options.showPeriod ? [row.periodLabel] : []),
    ...(options.showIntake ? [row.intakeName ?? "Not Set"] : []),
    row.branchName,
    userLabel,
    ...reportColumns.map((column) => rowMetricValue(row, column)),
  ];

  for (const group of orderedGroups) {
    for (const row of group.rows) {
      sheet.addRow(rowValues(row));
    }

    const subtotal = sheet.addRow(rowValues(group.total, "BRANCH TOTAL"));
    subtotalRows.push(subtotal.number);
  }

  const grandIdentity = [
    "GRAND TOTAL",
    ...Array(Math.max(0, identityHeaders.length - 1)).fill(""),
  ];
  const grandRow = sheet.addRow([
    ...grandIdentity,
    ...reportColumns.map((column) =>
      rowMetricValue(totals.grandTotal, column),
    ),
  ]);

  identityHeaders.forEach((_, index) => {
    sheet.getColumn(index + 1).width =
      index === identityHeaders.length - 1 ? 28 : 22;
  });

  reportColumns.forEach((column, index) => {
    const excelColumn = sheet.getColumn(identityHeaders.length + index + 1);
    excelColumn.width = column.width;
    if (column.format) excelColumn.numFmt = column.format;
  });

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: headers.length },
    };
  }

  styleDataRows(sheet, 5);
  subtotalRows.forEach((rowNumber) => styleSubtotalRow(sheet, rowNumber));
  styleGrandTotalRow(sheet, grandRow.number);
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
}

function addSummarySheet(workbook: Workbook, report: DirectorReportData) {
  const sheet = workbook.addWorksheet("Summary", {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  addTitle(sheet, "VSource Directors Report — Summary", report, 4);
  sheet.addRow([]);
  sheet.addRow(["Metric", "Value", "Metric", "Value"]);
  styleHeaderRow(sheet, 4);

  const summary = report.summary;
  const metrics: Array<[string, keyof DirectorReportSummary, "number" | "percentage" | "currency"]> = [
    ["Total Walk-ins", "totalWalkins", "number"],
    ["Leads Added", "leadsAdded", "number"],
    ["All Leads", "allLeads", "number"],
    ["Active Leads", "activeLeads", "number"],
    ["Qualified Leads", "qualifiedLeads", "number"],
    ["Lost Leads", "lostLeads", "number"],
    ["Students", "students", "number"],
    ["Dropped Students", "droppedStudents", "number"],
    ["Applications", "applications", "number"],
    ["Offers", "offers", "number"],
    ["CAS Received", "casReceived", "number"],
    ["Visa Approved", "visaApproved", "number"],
    ["Loan Logins", "loanLogins", "number"],
    ["Loan Approved", "loanApproved", "number"],
    ["Loan Disbursed", "loanDisbursed", "number"],
    ["Target", "target", "number"],
    ["Achieved", "achieved", "number"],
    ["Lead Conversion", "leadToStudentConversionPercentage", "percentage"],
    ["Application Conversion", "applicationConversionPercentage", "percentage"],
    ["Visa Conversion", "visaConversionPercentage", "percentage"],
    ["Loan Approval Conversion", "loanConversionPercentage", "percentage"],
    ["Target Completion", "targetCompletionPercentage", "percentage"],
    ["Applied Amount", "appliedAmount", "currency"],
    ["Sanctioned Amount", "sanctionedAmount", "currency"],
    ["Disbursed Amount", "disbursedAmount", "currency"],
  ];

  for (let index = 0; index < metrics.length; index += 2) {
    const first = metrics[index];
    const second = metrics[index + 1];
    const row = sheet.addRow([
      first[0],
      first[2] === "percentage" ? percentValue(summary[first[1]]) : Number(summary[first[1]]),
      second?.[0] ?? "",
      second
        ? second[2] === "percentage"
          ? percentValue(summary[second[1]])
          : Number(summary[second[1]])
        : "",
    ]);

    const firstFormat = first[2] === "percentage" ? "0.0%" : first[2] === "currency" ? "₹#,##0" : "0";
    row.getCell(2).numFmt = firstFormat;

    if (second) {
      row.getCell(4).numFmt = second[2] === "percentage" ? "0.0%" : second[2] === "currency" ? "₹#,##0" : "0";
    }
  }

  styleDataRows(sheet, 5);
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 28;
  sheet.getColumn(4).width = 18;

  for (let row = 5; row <= sheet.rowCount; row += 1) {
    sheet.getCell(row, 1).font = { bold: true };
    sheet.getCell(row, 3).font = { bold: true };
    sheet.getCell(row, 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_FILL } };
    sheet.getCell(row, 4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_FILL } };
  }
}

function addComparisonSheet(
  workbook: Workbook,
  report: DirectorReportData,
  sheetName: string,
  title: string,
  rows: DirectorReportComparisonRow[],
) {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  const headers = ["Metric", "Current", "Previous", "Difference", "Change %"];
  addTitle(sheet, title, report, headers.length);
  sheet.addRow([]);
  sheet.addRow(headers);
  styleHeaderRow(sheet, 4);

  for (const item of rows) {
    const divisor = item.valueType === "percentage" ? 100 : 1;
    const row = sheet.addRow([
      item.metric,
      item.current / divisor,
      item.previous / divisor,
      item.difference / divisor,
      item.changePercentage / 100,
    ]);
    const valueFormat = item.valueType === "currency" ? "₹#,##0" : item.valueType === "percentage" ? "0.0%" : "0";
    row.getCell(2).numFmt = valueFormat;
    row.getCell(3).numFmt = valueFormat;
    row.getCell(4).numFmt = valueFormat;
    row.getCell(5).numFmt = "0.0%";
  }

  styleDataRows(sheet, 5);
  sheet.getColumn(1).width = 34;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 16;
}

function addIntakeComparisonSheet(
  workbook: Workbook,
  report: DirectorReportData,
  rows: DirectorReportIntakeComparisonRow[],
) {
  const sheet = workbook.addWorksheet("Intake Comparison", {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  const headers = [
    "Intake",
    "Walk-ins",
    "Students",
    "Applications",
    "Visa Approved",
    "Loan Logins",
    "Loan Approved",
    "Lead Conv %",
    "App Conv %",
    "Visa Conv %",
    "Loan Approval %",
  ];
  addTitle(sheet, "VSource Directors Report — Intake Comparison", report, headers.length);
  sheet.addRow([]);
  sheet.addRow(headers);
  styleHeaderRow(sheet, 4);

  for (const item of rows) {
    const row = sheet.addRow([
      item.intakeName,
      item.totalWalkins,
      item.students,
      item.applications,
      item.visaApproved,
      item.loanLogins,
      item.loanApproved,
      item.leadConversionPercentage / 100,
      item.applicationConversionPercentage / 100,
      item.visaConversionPercentage / 100,
      item.loanConversionPercentage / 100,
    ]);
    for (let column = 8; column <= 11; column += 1) {
      row.getCell(column).numFmt = "0.0%";
    }
  }

  const total = rows.reduce(
    (result, item) => ({
      totalWalkins: result.totalWalkins + item.totalWalkins,
      students: result.students + item.students,
      applications: result.applications + item.applications,
      visaApproved: result.visaApproved + item.visaApproved,
      loanLogins: result.loanLogins + item.loanLogins,
      loanApproved: result.loanApproved + item.loanApproved,
    }),
    {
      totalWalkins: 0,
      students: 0,
      applications: 0,
      visaApproved: 0,
      loanLogins: 0,
      loanApproved: 0,
    },
  );
  const ratio = (part: number, whole: number) =>
    whole > 0 ? part / whole : 0;
  const grandRow = sheet.addRow([
    "GRAND TOTAL",
    total.totalWalkins,
    total.students,
    total.applications,
    total.visaApproved,
    total.loanLogins,
    total.loanApproved,
    ratio(total.students, total.totalWalkins),
    ratio(total.applications, total.students),
    ratio(total.visaApproved, total.students),
    ratio(total.loanApproved, total.loanLogins),
  ]);
  for (let column = 8; column <= 11; column += 1) {
    grandRow.getCell(column).numFmt = "0.0%";
  }

  styleDataRows(sheet, 5);
  styleGrandTotalRow(sheet, grandRow.number);
  sheet.getColumn(1).width = 30;
  for (let column = 2; column <= 11; column += 1) {
    sheet.getColumn(column).width = 16;
  }
}

function addLeadDetailsSheet(
  workbook: Workbook,
  report: DirectorReportData,
  rows: DirectorReportLeadDetail[],
) {
  const sheet = workbook.addWorksheet("Lead Attribution", {
    views: [{ state: "frozen", ySplit: 4 }],
  });
  const headers = [
    "Lead Number",
    "Branch",
    "User",
    "Student",
    "Mobile",
    "Source",
    "Country",
    "Intake",
    "Status",
    "Attribution",
    "Created At",
  ];
  addTitle(sheet, "VSource Directors Report — Lead Attribution", report, headers.length);
  sheet.addRow([]);
  sheet.addRow(headers);
  styleHeaderRow(sheet, 4);

  for (const item of rows) {
    sheet.addRow([
      item.leadNumber,
      item.branchName,
      item.counselorName,
      item.studentName,
      item.mobileNumber,
      item.source,
      item.preferredCountry,
      item.preferredIntake,
      item.status,
      item.attribution,
      new Date(item.createdAt),
    ]);
  }

  styleDataRows(sheet, 5);
  [16, 24, 28, 24, 16, 18, 18, 20, 16, 22, 21].forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.getColumn(11).numFmt = "dd-mmm-yyyy hh:mm";
}

function filterEntries(filters: DirectorReportFilters): Array<[string, string]> {
  const labels: Record<keyof DirectorReportFilters, string> = {
    search: "Search",
    recordScope: "Record Scope",
    branchId: "Branch ID",
    counselorId: "User ID",
    leadStatus: "Lead Status",
    source: "Source",
    countryId: "Country ID",
    intakeId: "Intake ID",
    universityId: "University ID",
    applicationStatus: "Application Status",
    casStatus: "CAS Status",
    visaStatus: "Visa Status",
    loanStatus: "Loan Status",
    nbfc: "NBFC / Bank",
    fintechAssigneeId: "Fintech Assignee ID",
    datePreset: "Date Preset",
    startDate: "Start Date",
    endDate: "End Date",
  };

  return (Object.entries(filters) as Array<[keyof DirectorReportFilters, string]>)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => [labels[key], value]);
}

function addFiltersSheet(workbook: Workbook, report: DirectorReportData) {
  const sheet = workbook.addWorksheet("Applied Filters");
  addTitle(sheet, "VSource Directors Report — Applied Filters", report, 2);
  sheet.addRow([]);
  sheet.addRow(["Filter", "Value"]);
  styleHeaderRow(sheet, 4);

  for (const [label, value] of filterEntries(report.filters)) {
    sheet.addRow([label, value]);
  }

  styleDataRows(sheet, 5);
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 45;
}

export async function buildDirectorReportWorkbook(
  report: DirectorReportData,
): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = "VSource CRM";
  workbook.lastModifiedBy = "VSource CRM";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  addSummarySheet(workbook, report);
  addReportRowsSheet(workbook, report, "All Time", "VSource Directors Report — All Time", report.allTimeRows, report.allTimeTotals, {});
  addReportRowsSheet(workbook, report, "Today", "VSource Directors Report — Today", report.todayRows, report.todayTotals, {});
  addReportRowsSheet(workbook, report, "Current Week", "VSource Directors Report — Current Week", report.weeklyRows, report.weeklyTotals, { showPeriod: true });
  addReportRowsSheet(workbook, report, "Current Month", "VSource Directors Report — Current Month", report.currentMonthRows, report.currentMonthTotals, {});
  addReportRowsSheet(workbook, report, "Intake-wise", "VSource Directors Report — Intake-wise", report.intakeWiseRows, report.intakeWiseTotals, { showIntake: true });
  addComparisonSheet(workbook, report, "Week Comparison", "VSource Directors Report — Week Comparison", report.weekComparison);
  addComparisonSheet(workbook, report, "Month Comparison", "VSource Directors Report — Month Comparison", report.monthComparison);
  addIntakeComparisonSheet(workbook, report, report.intakeComparison);
  addLeadDetailsSheet(workbook, report, report.leadDetails);
  addFiltersSheet(workbook, report);

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}
