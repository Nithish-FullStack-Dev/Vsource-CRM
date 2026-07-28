import { Workbook, type Cell, type Worksheet } from "exceljs";
import type {
  DirectorReportComparisonRow,
  DirectorReportData,
  DirectorReportFilters,
  DirectorReportRow,
  DirectorReportSummary,
  DirectorReportTableTotals,
} from "@/types/director-report";

const HEADER_FILL = "1F2937";
const GROUP_FILL = "991B1B";
const SUBTLE_FILL = "F3F4F6";
const BORDER_COLOR = "D1D5DB";

const columns: Array<{
  header: string;
  key: keyof DirectorReportRow;
  width: number;
  format?: string;
}> = [
  { header: "Walk-ins", key: "walkIns", width: 12 },
  { header: "Reference", key: "references", width: 12 },
  { header: "Applications", key: "applications", width: 13 },
  { header: "Same Day Apps", key: "sameDayApplications", width: 15 },
  { header: "Old Walk-in Apps", key: "oldWalkInApplications", width: 17 },
  { header: "University Applied", key: "universityApplications", width: 17 },
  { header: "Offers", key: "offers", width: 10 },
  { header: "Drops / Hold / DIF", key: "dropHoldDif", width: 17 },
  { header: "Loan Applications", key: "loanApplications", width: 17 },
  { header: "OS-LOAN / O-FUND", key: "outsideLoan", width: 18 },
  { header: "Loan Approved", key: "loanApproved", width: 14 },
  { header: "Loan Disbursed", key: "loanDisbursed", width: 15 },
  { header: "Deposit Paid", key: "depositPaid", width: 13 },
  { header: "CAS Applied", key: "casApplied", width: 13 },
  { header: "CAS Received", key: "casReceived", width: 14 },
  { header: "Visa Applied", key: "visaApplied", width: 13 },
  { header: "Visa Approved", key: "visaApproved", width: 14 },
  { header: "Target", key: "target", width: 10 },
  { header: "Achieved", key: "achieved", width: 11 },
  { header: "Target %", key: "targetCompletionPercentage", width: 11, format: "0.0%" },
  { header: "Lead Conversion %", key: "leadToStudentConversionPercentage", width: 16, format: "0.0%" },
  { header: "University Conversion %", key: "universityApplicationConversionPercentage", width: 20, format: "0.0%" },
  { header: "Visa Conversion %", key: "visaConversionPercentage", width: 16, format: "0.0%" },
  { header: "Loan Conversion %", key: "loanConversionPercentage", width: 16, format: "0.0%" },
  { header: "Applied Amount", key: "appliedAmount", width: 16, format: "₹#,##0" },
  { header: "Sanctioned Amount", key: "sanctionedAmount", width: 18, format: "₹#,##0" },
  { header: "Disbursed Amount", key: "disbursedAmount", width: 18, format: "₹#,##0" },
  { header: "Weekly Avg Walk-ins", key: "avgWeeklyWalkIns", width: 18 },
  { header: "Weekly Avg Applications", key: "avgWeeklyApplications", width: 21 },
  { header: "Weekly Avg University Apps", key: "avgWeeklyUniversityApplications", width: 23 },
  { header: "Weekly Avg Loan Apps", key: "avgWeeklyLoanApplications", width: 20 },
  { header: "Weekly Avg Loan Approved", key: "avgWeeklyLoanApproved", width: 23 },
  { header: "Weekly Avg Visa", key: "avgWeeklyVisaApproved", width: 17 },
  { header: "Lead Numbers", key: "leadNumbers", width: 36 },
];

function border(cell: Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: BORDER_COLOR } },
    left: { style: "thin", color: { argb: BORDER_COLOR } },
    bottom: { style: "thin", color: { argb: BORDER_COLOR } },
    right: { style: "thin", color: { argb: BORDER_COLOR } },
  };
}

function title(sheet: Worksheet, text: string, report: DirectorReportData, count: number) {
  sheet.mergeCells(1, 1, 1, count);
  const cell = sheet.getCell(1, 1);
  cell.value = text;
  cell.font = { bold: true, size: 16, color: { argb: "FFFFFF" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GROUP_FILL } };
  cell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 27;
  sheet.mergeCells(2, 1, 2, count);
  const meta = sheet.getCell(2, 1);
  meta.value = `Generated: ${new Date(report.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
  meta.font = { italic: true, color: { argb: "4B5563" } };
  meta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBTLE_FILL } };
}

function styleHeader(sheet: Worksheet, rowNumber: number) {
  const row = sheet.getRow(rowNumber);
  row.height = 31;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    border(cell);
  });
}

function rowValue(row: DirectorReportRow, column: (typeof columns)[number]) {
  const value = row[column.key];
  if (column.key === "leadNumbers") return Array.isArray(value) ? value.join(", ") : "";
  if (column.format === "0.0%") return Number(value ?? 0) / 100;
  return value ?? 0;
}

function addReportSheet(
  workbook: Workbook,
  name: string,
  report: DirectorReportData,
  rows: DirectorReportRow[],
  totals: DirectorReportTableTotals,
  includePeriod = false,
  includeIntake = false,
) {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  const identity = [
    ...(includePeriod ? [{ header: "Period", key: "periodLabel", width: 20 }] : []),
    ...(includeIntake ? [{ header: "Intake", key: "intakeName", width: 20 }] : []),
    { header: "Branch", key: "branchName", width: 24 },
    { header: "User", key: "counselorName", width: 24 },
  ];
  const allColumns = [...identity, ...columns];
  title(sheet, name, report, allColumns.length);
  const header = sheet.getRow(4);
  allColumns.forEach((column, index) => {
    header.getCell(index + 1).value = column.header;
    sheet.getColumn(index + 1).width = column.width;
  });
  styleHeader(sheet, 4);

  const add = (row: DirectorReportRow, total = false) => {
    const values = [
      ...(includePeriod ? [row.periodLabel] : []),
      ...(includeIntake ? [row.intakeName ?? "Not Set"] : []),
      row.branchName,
      row.counselorName,
      ...columns.map((column) => rowValue(row, column)),
    ];
    const excelRow = sheet.addRow(values);
    excelRow.eachCell((cell, index) => {
      border(cell);
      cell.alignment = { vertical: "middle", wrapText: true };
      const metricIndex = index - identity.length - 1;
      if (metricIndex >= 0) {
        const format = columns[metricIndex]?.format;
        if (format) cell.numFmt = format;
      }
    });
    if (total) {
      excelRow.font = { bold: true };
      excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBTLE_FILL } };
    }
  };

  rows.forEach((row) => add(row));
  totals.branchRows.forEach((row) => add(row, true));
  add(totals.grandTotal, true);
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: allColumns.length } };
}

function addSummary(workbook: Workbook, report: DirectorReportData) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Metric", key: "metric", width: 42 },
    { header: "Value", key: "value", width: 24 },
  ];
  const summary = report.summary;
  const rows: Array<[string, string | number]> = [
    ["Walk-ins", summary.walkIns],
    ["Reference", summary.references],
    ["Applications", summary.applications],
    ["Same Day Apps", summary.sameDayApplications],
    ["Old Walk-in Apps", summary.oldWalkInApplications],
    ["University Applied", summary.universityApplications],
    ["Drops / Hold / DIF", summary.dropHoldDif],
    ["Loan Applications", summary.loanApplications],
    ["OS-LOAN / O-FUND", summary.outsideLoan],
    ["Loan Approved", summary.loanApproved],
    ["Loan Disbursed", summary.loanDisbursed],
    ["Deposit Paid", summary.depositPaid],
    ["CAS Applied", summary.casApplied],
    ["CAS Received", summary.casReceived],
    ["Visa Applied", summary.visaApplied],
    ["Visa Approved", summary.visaApproved],
    ["Target", summary.target],
    ["Achieved", summary.achieved],
    ["Applied Amount", summary.appliedAmount],
    ["Sanctioned Amount", summary.sanctionedAmount],
    ["Disbursed Amount", summary.disbursedAmount],
    ["Lead Conversion", `${summary.leadToStudentConversionPercentage}%`],
    ["University Conversion", `${summary.universityApplicationConversionPercentage}%`],
    ["Visa Conversion", `${summary.visaConversionPercentage}%`],
    ["Loan Conversion", `${summary.loanConversionPercentage}%`],
    ["Target Completion", `${summary.targetCompletionPercentage}%`],
  ];
  rows.forEach(([metric, value]) => sheet.addRow({ metric, value }));
  styleHeader(sheet, 1);
  sheet.eachRow((row, index) => index > 1 && row.eachCell(border));
}

function addComparison(workbook: Workbook, name: string, rows: DirectorReportComparisonRow[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: "Metric", key: "metric", width: 30 },
    { header: "Current", key: "current", width: 14 },
    { header: "Previous", key: "previous", width: 14 },
    { header: "Difference", key: "difference", width: 14 },
    { header: "Change %", key: "changePercentage", width: 14 },
  ];
  rows.forEach((row) => sheet.addRow(row));
  styleHeader(sheet, 1);
  sheet.eachRow((row, index) => index > 1 && row.eachCell(border));
}

function addFilters(workbook: Workbook, filters: DirectorReportFilters) {
  const sheet = workbook.addWorksheet("Applied Filters");
  sheet.columns = [
    { header: "Filter", key: "filter", width: 30 },
    { header: "Value", key: "value", width: 44 },
  ];
  Object.entries(filters).forEach(([filter, value]) => sheet.addRow({ filter, value: value || "All" }));
  styleHeader(sheet, 1);
  sheet.eachRow((row, index) => index > 1 && row.eachCell(border));
}

export async function buildDirectorReportWorkbook(report: DirectorReportData) {
  const workbook = new Workbook();
  workbook.creator = "Vsource CRM";
  workbook.created = new Date();
  addSummary(workbook, report);
  addReportSheet(workbook, "Today", report, report.todayRows, report.todayTotals);
  addReportSheet(workbook, "Weekly Daily", report, report.weeklyRows, report.weeklyTotals, true);
  addReportSheet(workbook, "Current Month", report, report.currentMonthRows, report.currentMonthTotals);
  addReportSheet(workbook, "Intake Wise", report, report.intakeWiseRows, report.intakeWiseTotals, false, true);
  addReportSheet(workbook, "All Time", report, report.allTimeRows, report.allTimeTotals);
  addComparison(workbook, "Week Comparison", report.weekComparison);
  addComparison(workbook, "Month Comparison", report.monthComparison);
  addFilters(workbook, report.filters);
  return workbook.xlsx.writeBuffer();
}
