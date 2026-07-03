import { NextRequest } from "next/server";
import { handleError } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { buildPerformanceReportWorkbook } from "@/lib/performance-report-excel";
import {
  getPerformanceReportForExport,
  parsePerformanceReportFilters,
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

    const report = await getPerformanceReportForExport(filters, accessScope);
    const workbook = await buildPerformanceReportWorkbook(report, filters);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(workbook as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vsource-performance-report-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
