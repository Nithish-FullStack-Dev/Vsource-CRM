import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getPerformanceReport } from "@/services/reports/performance-report.service";
import { performanceReportQueryKeys } from "@/services/reports/performance-report-query-key";
import type { PerformanceReportFilters } from "@/types/performance-report";

export function usePerformanceReport(
  filters: PerformanceReportFilters,
  page: number,
  limit: number,
) {
  return useQuery({
    queryKey: performanceReportQueryKeys.report(filters, page, limit),
    queryFn: () => getPerformanceReport(filters, page, limit),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
