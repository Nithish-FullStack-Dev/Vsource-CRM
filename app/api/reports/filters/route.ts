// app\api\reports\filters\route.ts
import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import {
  getPerformanceReportFilterOptions,
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

    const branchIds = currentUser.branches.map((branch) => branch.id);
    const roleName = currentUser.role.name;

    let accessScope: PerformanceReportAccessScope;

    if (
      roleName === ROLES.SUPER_ADMIN ||
      roleName === ROLES.DIRECTOR
    ) {
      accessScope = {
        kind: "all",
      };
    } else if (roleName === ROLES.BRANCH_MANAGER) {
      accessScope = {
        kind: "branches",
        branchIds,
      };
    } else {
      accessScope = {
        kind: "user",
        userId: currentUser.id,
        userName: currentUser.name,
      };
    }

    const rawOptions = await getPerformanceReportFilterOptions();

    if (accessScope.kind === "all") {
      return ok(
        {
          ...rawOptions,
          access: accessScope,
        },
        "Performance report filters fetched successfully",
      );
    }

    if (accessScope.kind === "branches") {
      const accessibleBranchIds = new Set(accessScope.branchIds);

      return ok(
        {
          ...rawOptions,
          access: accessScope,
          branches: rawOptions.branches.filter((branch) =>
            accessibleBranchIds.has(branch.value),
          ),
          counselors: rawOptions.counselors.filter((user) =>
            user.branchIds.some((branchId) =>
              accessibleBranchIds.has(branchId),
            ),
          ),
        },
        "Performance report filters fetched successfully",
      );
    }

    const currentUserBranchIds = new Set(branchIds);

    return ok(
      {
        ...rawOptions,
        access: accessScope,
        branches: rawOptions.branches.filter((branch) =>
          currentUserBranchIds.has(branch.value),
        ),
        counselors: rawOptions.counselors.filter(
          (user) => user.value === currentUser.id,
        ),
      },
      "Performance report filters fetched successfully",
    );
  } catch (error) {
    return handleError(error);
  }
}