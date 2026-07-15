import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { resolvePerformanceReportAccessScope } from "@/lib/performance-report-access";
import {
  getPerformanceReport,
  parsePerformanceReportFilters,
  parsePerformanceReportPagination,
} from "@/lib/performance-reports";
import { getAuthorizedUser } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );
    const filters = parsePerformanceReportFilters(req.nextUrl.searchParams);
    const { page, limit } = parsePerformanceReportPagination(
      req.nextUrl.searchParams,
    );
    const report = await getPerformanceReport(
      filters,
      page,
      limit,
      false,
      resolvePerformanceReportAccessScope(user),
    );
    return ok(report, "Performance report fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
