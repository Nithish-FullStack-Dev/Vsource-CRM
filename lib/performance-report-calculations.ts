import type {
  PerformanceReportCounselorPoint,
  PerformanceReportMetricRow,
} from "@/types/performance-report";

const emptyTotals = (): PerformanceReportMetricRow => ({
  totalWalkins: 0,
  leadsCreated: 0,
  leads: 0,
  qualifiedLeads: 0,
  lostLeads: 0,
  students: 0,
  droppedStudents: 0,
  loanLogins: 0,
  loanApproved: 0,
  applicationConversions: 0,
  visaConversions: 0,
  applicationConversionRate: 0,
  visaConversionRate: 0,
  conversionRate: 0,
  target: 0,
  achieved: 0,
  targetCompletionPercentage: 0,
  applications: 0,
  offers: 0,
  casReceived: 0,
  visaApproved: 0,
});

export function calculatePerformanceTotals<
  T extends PerformanceReportMetricRow,
>(rows: T[]): PerformanceReportMetricRow {
  const total = rows.reduce((sum, row) => {
    for (const key of [
      "totalWalkins",
      "leadsCreated",
      "leads",
      "qualifiedLeads",
      "lostLeads",
      "students",
      "droppedStudents",
      "loanLogins",
      "loanApproved",
      "applicationConversions",
      "visaConversions",
      "target",
      "achieved",
      "applications",
      "offers",
      "casReceived",
      "visaApproved",
    ] as const) {
      sum[key] += row[key];
    }
    return sum;
  }, emptyTotals());

  total.targetCompletionPercentage = total.target
    ? Number(((total.achieved / total.target) * 100).toFixed(1))
    : 0;
  total.applicationConversionRate = total.totalWalkins
    ? Number(
        ((total.applicationConversions / total.totalWalkins) * 100).toFixed(1),
      )
    : 0;
  total.visaConversionRate = total.applicationConversions
    ? Number(
        ((total.visaConversions / total.applicationConversions) * 100).toFixed(
          1,
        ),
      )
    : 0;
  total.conversionRate = total.applicationConversionRate;

  return total;
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
      totals: emptyTotals(),
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
