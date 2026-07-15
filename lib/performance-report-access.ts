import {
  resolveDataAccessScope,
  type DataAccessUser,
} from "@/lib/data-access-scope";
import type { PerformanceReportAccessScope } from "@/lib/performance-reports";

export function resolvePerformanceReportAccessScope(
  currentUser: DataAccessUser,
): PerformanceReportAccessScope {
  return resolveDataAccessScope(currentUser);
}
