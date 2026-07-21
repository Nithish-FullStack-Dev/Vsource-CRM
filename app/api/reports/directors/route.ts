import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";
import {
  getDirectorReport,
  parseDirectorReportFilters,
} from "@/lib/director-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );

    if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR
    ) {
      throw new Error("Only Super Admin and Director can access Directors Report");
    }

    const filters = parseDirectorReportFilters(req.nextUrl.searchParams);
    const report = await getDirectorReport(filters);

    return ok(report, "Directors report fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
