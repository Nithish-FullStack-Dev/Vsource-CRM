import { NextRequest } from "next/server";
import { handleError } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { resolvePerformanceReportAccessScope } from "@/lib/performance-report-access";
import { buildPerformanceReportWorkbook } from "@/lib/performance-report-excel";
import {
  getPerformanceReportForExport,
  parsePerformanceReportFilters,
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
    const report = await getPerformanceReportForExport(
      filters,
      resolvePerformanceReportAccessScope(user),
    );
    const workbook = await buildPerformanceReportWorkbook(report, filters);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(Buffer.from(workbook), {
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
