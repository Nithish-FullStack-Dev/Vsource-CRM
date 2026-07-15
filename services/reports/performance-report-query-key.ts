import type { PerformanceReportFilters } from "@/types/performance-report";

export const performanceReportQueryKeys = {
  all: ["performance-reports"] as const,
  filters: () => [...performanceReportQueryKeys.all, "filters"] as const,
  report: (filters: PerformanceReportFilters, page: number, limit: number) =>
    [
      ...performanceReportQueryKeys.all,
      "report",
      filters,
      page,
      limit,
    ] as const,
};
