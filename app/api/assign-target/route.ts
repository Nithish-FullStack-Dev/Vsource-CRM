import { NextRequest, NextResponse } from "next/server";
import { queryDashboard } from "@/lib/crmData";
import { DashboardDataFilters } from "@/lib/crmTypes";
import { getAuthorizedUser, ROLES } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.READ,
    );

    const { searchParams } = new URL(req.url);

    const branchParam = searchParams.get("branchId");
    const userParam = searchParams.get("userId");
    const intakeParam = searchParams.get("intake");
    const dateRangeParam = searchParams.get("dateRangeType") || "month";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const filters: DashboardDataFilters = {
      branchId: null,
      userId: null,
      intake: !intakeParam || intakeParam === "all" ? null : intakeParam,
      dateRangeType: dateRangeParam as "today" | "week" | "month" | "custom",
      startDate: startDateParam || null,
      endDate: endDateParam || null,
    };

    const role = currentUser.role.name;

    // Super Admin & Director
    if (role === ROLES.SUPER_ADMIN || role === ROLES.DIRECTOR) {
      filters.branchId =
        !branchParam || branchParam === "all" ? null : branchParam;

      filters.userId = !userParam || userParam === "all" ? null : userParam;
    }

    // Branch Manager
    else if (role === ROLES.BRANCH_MANAGER) {
      filters.branchId =
        !branchParam || branchParam === "all"
          ? (currentUser.branches[0]?.id ?? null)
          : branchParam;

      filters.userId = !userParam || userParam === "all" ? null : userParam;
    }

    // Everyone else
    else {
      filters.branchId = currentUser.branches[0]?.id ?? null;
      filters.userId = currentUser.id;
    }

    const dashboardData = await queryDashboard(filters);

    return NextResponse.json(dashboardData);
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message ?? "Failed to retrieve CRM performance stats",
      },
      {
        status: err.statusCode ?? 500,
      },
    );
  }
}
