import {
  DEFAULT_PERFORMANCE_REPORT_FILTERS,
  type PerformanceReportFilters,
} from "@/types/performance-report";

export function countPerformanceReportFilters(
  filters: PerformanceReportFilters,
): number {
  return Object.entries(filters).reduce((count, [key, value]) => {
    const defaultValue =
      DEFAULT_PERFORMANCE_REPORT_FILTERS[key as keyof PerformanceReportFilters];
    return value && value !== defaultValue ? count + 1 : count;
  }, 0);
}

export function humanizeReportStatus(value: string): string {
  return value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not Set";
}

export function formatReportDate(value: string | null): string {
  if (!value) return "Not Set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not Set" : date.toLocaleDateString("en-IN");
}
