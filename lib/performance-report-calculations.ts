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
  target: 0,
  achieved: 0,
  targetCompletionPercentage: 0,
  applications: 0,
  offers: 0,
  conversionRate: 0,
  casReceived: 0,
  visaApproved: 0,
});

export function calculatePerformanceTotals<T extends PerformanceReportMetricRow>(
  rows: T[],
): PerformanceReportMetricRow {
  const totals = rows.reduce((result, row) => {
    result.totalWalkins += row.totalWalkins;
    result.leadsCreated += row.leadsCreated;
    result.leads += row.leads;
    result.qualifiedLeads += row.qualifiedLeads;
    result.lostLeads += row.lostLeads;
    result.students += row.students;
    result.droppedStudents += row.droppedStudents;
    result.target += row.target;
    result.achieved += row.achieved;
    result.applications += row.applications;
    result.offers += row.offers;
    result.casReceived += row.casReceived;
    result.visaApproved += row.visaApproved;
    return result;
  }, emptyTotals());

  totals.targetCompletionPercentage =
    totals.target > 0
      ? Number(((totals.achieved / totals.target) * 100).toFixed(1))
      : 0;
  totals.conversionRate =
    totals.totalWalkins > 0
      ? Number(((totals.students / totals.totalWalkins) * 100).toFixed(1))
      : 0;

  return totals;
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
    const group: CounselorPerformanceGroup = groups.get(row.branchId) ?? {
      branchId: row.branchId,
      branch: row.branch,
      rows: [],
      totals: emptyTotals(),
    };

    group.rows.push(row);
    groups.set(row.branchId, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      rows: group.rows.sort((a, b) => a.counselor.localeCompare(b.counselor)),
      totals: calculatePerformanceTotals(group.rows),
    }))
    .sort((a, b) => a.branch.localeCompare(b.branch));
}
