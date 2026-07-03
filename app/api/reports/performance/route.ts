import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import {
  getPerformanceReport,
  parsePerformanceReportFilters,
  parsePerformanceReportPagination,
} from "@/lib/performance-reports";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );

    const filters = parsePerformanceReportFilters(req.nextUrl.searchParams);

    if (currentUser.role.name === ROLES.COUNSELLOR) {
      filters.counselorId = currentUser.id;
    }

    const { page, limit } = parsePerformanceReportPagination(
      req.nextUrl.searchParams,
    );

    const report = await getPerformanceReport(filters, page, limit);

    return ok(report, "Performance report fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
