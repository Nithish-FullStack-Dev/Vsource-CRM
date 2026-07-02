import ExcelJS from "exceljs";
import type {
  CounsellorPerformance,
  PerformanceResponse,
} from "@/types/counsellor-performance";

function getStatus(counsellor: CounsellorPerformance) {
  if (counsellor.target <= 0) {
    return "Target not set";
  }

  if (counsellor.targetAchieved) {
    return "Achieved";
  }

  if (counsellor.completionPercentage >= 75) {
    return "On track";
  }

  return "Behind";
}

function formatJoinedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function createCounsellorPerformanceWorkbook(
  report: PerformanceResponse,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vsource CRM";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Performance", {
    views: [{ state: "frozen", ySplit: 11 }],
  });

  worksheet.mergeCells("A1:L1");
  worksheet.getCell("A1").value = "Counsellor Performance Report";
  worksheet.getCell("A1").font = {
    bold: true,
    size: 18,
    color: { argb: "FFFFFFFF" },
  };
  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  worksheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF174D41" },
  };
  worksheet.getRow(1).height = 30;

  const metadata = [
    ["Period Type", report.period.type.toUpperCase()],
    ["Period", report.period.label],
    ["Total Counsellors", report.summary.totalCounsellors],
    ["Total Monthly Target", report.summary.totalTarget],
    ["Total Achieved", report.summary.totalAchieved],
    ["Total Leads Added", report.summary.totalLeadsCreated],
    ["Overall Completion", report.summary.completionPercentage / 100],
  ];

  metadata.forEach(([label, value], index) => {
    const rowNumber = index + 3;
    worksheet.getCell(rowNumber, 1).value = label;
    worksheet.getCell(rowNumber, 1).font = { bold: true };
    worksheet.getCell(rowNumber, 2).value = value;
  });

  worksheet.getCell("B9").numFmt = "0%";

  const headerRowNumber = 11;
  const headers = [
    "Rank",
    "Counsellor",
    "Email",
    "Branches",
    "Joined Date",
    "Period Type",
    "Period",
    "Monthly Target",
    "Achieved",
    "Leads Added",
    "Completion",
    "Status",
  ];

  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.values = headers;
  headerRow.height = 24;
  headerRow.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };

  report.counsellors.forEach((counsellor, index) => {
    const row = worksheet.addRow([
      index + 1,
      counsellor.name,
      counsellor.email,
      counsellor.branches.map((branch) => branch.name).join(", ") ||
        "Not assigned",
      formatJoinedDate(counsellor.joinedAt),
      report.period.type.toUpperCase(),
      report.period.label,
      counsellor.target,
      counsellor.achieved,
      counsellor.leadsCreated,
      counsellor.completionPercentage / 100,
      getStatus(counsellor),
    ]);

    row.getCell(11).numFmt = "0%";
    row.alignment = {
      vertical: "middle",
    };
  });

  worksheet.autoFilter = {
    from: {
      row: headerRowNumber,
      column: 1,
    },
    to: {
      row: headerRowNumber + report.counsellors.length,
      column: headers.length,
    },
  };

  worksheet.columns = [
    { width: 8 },
    { width: 24 },
    { width: 30 },
    { width: 30 },
    { width: 16 },
    { width: 14 },
    { width: 28 },
    { width: 18 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
  ];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= headerRowNumber) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    }
  });

  return workbook.xlsx.writeBuffer();
}
