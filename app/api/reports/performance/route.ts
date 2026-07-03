import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import {
  getPerformanceReport,
  parsePerformanceReportFilters,
  parsePerformanceReportPagination,
  type PerformanceReportAccessScope,
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
    const { page, limit } = parsePerformanceReportPagination(
      req.nextUrl.searchParams,
    );

    let accessScope: PerformanceReportAccessScope = {
      kind: "all",
    };

    if (currentUser.role.name === ROLES.BRANCH_MANAGER) {
      accessScope = {
        kind: "branches",
        branchIds: currentUser.branches.map((branch) => branch.id),
      };
    } else if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR
    ) {
      accessScope = {
        kind: "user",
        userId: currentUser.id,
        userName: currentUser.name,
      };
    }

    const report = await getPerformanceReport(
      filters,
      page,
      limit,
      false,
      accessScope,
    );

    return ok(report, "Performance report fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
