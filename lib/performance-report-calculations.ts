import { reportPercentage } from "@/lib/report-metric-rules";
import type {
  PerformanceReportCounselorPoint,
  PerformanceReportMetricRow,
} from "@/types/performance-report";

export const emptyPerformanceMetrics = (): PerformanceReportMetricRow => ({
  walkIns: 0,
  references: 0,
  activeWalkIns: 0,
  dropHoldDif: 0,
  applications: 0,
  sameDayApplications: 0,
  oldWalkInApplications: 0,
  universityApplications: 0,
  offers: 0,
  casApplied: 0,
  casReceived: 0,
  visaApplied: 0,
  visaApproved: 0,
  loanApplications: 0,
  outsideLoan: 0,
  loanApproved: 0,
  loanDisbursed: 0,
  target: 0,
  achieved: 0,
  leadToStudentConversionPercentage: 0,
  universityApplicationConversionPercentage: 0,
  visaConversionPercentage: 0,
  loanConversionPercentage: 0,
  targetCompletionPercentage: 0,
});

const additiveKeys = [
  "walkIns",
  "references",
  "activeWalkIns",
  "dropHoldDif",
  "applications",
  "sameDayApplications",
  "oldWalkInApplications",
  "universityApplications",
  "offers",
  "casApplied",
  "casReceived",
  "visaApplied",
  "visaApproved",
  "loanApplications",
  "outsideLoan",
  "loanApproved",
  "loanDisbursed",
  "target",
  "achieved",
] as const;

export function finalizePerformanceMetrics<T extends PerformanceReportMetricRow>(
  row: T,
): T {
  row.leadToStudentConversionPercentage = reportPercentage(
    row.applications,
    row.walkIns,
  );
  row.universityApplicationConversionPercentage = reportPercentage(
    row.universityApplications,
    row.applications,
  );
  row.visaConversionPercentage = reportPercentage(
    row.visaApproved,
    row.applications,
  );
  row.loanConversionPercentage = reportPercentage(
    row.loanApproved,
    row.loanApplications,
  );
  row.targetCompletionPercentage = reportPercentage(row.achieved, row.target);
  return row;
}

export function calculatePerformanceTotals<T extends PerformanceReportMetricRow>(
  rows: T[],
): PerformanceReportMetricRow {
  const total = emptyPerformanceMetrics();
  for (const row of rows) {
    for (const key of additiveKeys) total[key] += row[key];
  }
  return finalizePerformanceMetrics(total);
}

export type CounselorPerformanceGroup = {
  branchId: string;
  branch: string;
  rows: PerformanceReportCounselorPoint[];
  totals: PerformanceReportMetricRow;
};

export function groupCounselorPerformance(
  rows: PerformanceReportCounselorPoint[],
): CounselorPerformanceGroup[] {
  const groups = new Map<string, CounselorPerformanceGroup>();
  for (const row of rows) {
    const group = groups.get(row.branchId) ?? {
      branchId: row.branchId,
      branch: row.branch,
      rows: [],
      totals: emptyPerformanceMetrics(),
    };
    group.rows.push(row);
    groups.set(row.branchId, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      rows: group.rows.sort((a, b) => a.counselor.localeCompare(b.counselor)),
      totals: calculatePerformanceTotals(group.rows),
    }))
    .sort((a, b) => a.branch.localeCompare(b.branch));
}
