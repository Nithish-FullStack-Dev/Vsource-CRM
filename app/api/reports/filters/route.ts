import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { resolvePerformanceReportAccessScope } from "@/lib/performance-report-access";
import { getPerformanceReportFilterOptions } from "@/lib/performance-reports";
import { getAuthorizedUser } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );
    const options = await getPerformanceReportFilterOptions(
      resolvePerformanceReportAccessScope(currentUser),
    );

    return ok(options, "Performance report filters fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
