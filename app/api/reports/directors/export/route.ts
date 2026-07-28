import { NextRequest } from "next/server";
import { handleError } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { buildDirectorReportWorkbook } from "@/lib/director-report-excel";
import { getDirectorReport, parseDirectorReportFilters } from "@/lib/director-reports";
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
    if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR
    ) {
      throw new Error("Only Super Admin and Director can export Directors Report");
    }
    const filters = parseDirectorReportFilters(req.nextUrl.searchParams);
    const workbook = await buildDirectorReportWorkbook(await getDirectorReport(filters));
    const date = new Date().toISOString().slice(0, 10);
    return new Response(Buffer.from(workbook), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vsource-directors-report-${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
