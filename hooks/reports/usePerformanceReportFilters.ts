import { useQuery } from "@tanstack/react-query";
import { getPerformanceReportFilterOptions } from "@/services/reports/performance-report.service";
import { performanceReportQueryKeys } from "@/services/reports/performance-report-query-key";

export function usePerformanceReportFilters() {
  return useQuery({
    queryKey: performanceReportQueryKeys.filters(),
    queryFn: getPerformanceReportFilterOptions,
    staleTime: 5 * 60_000,
  });
}
