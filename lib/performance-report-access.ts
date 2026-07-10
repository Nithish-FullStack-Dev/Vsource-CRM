import { ROLES } from "@/lib/rbac";
import type { PerformanceReportAccessScope } from "@/lib/performance-reports";

type AuthorizedPerformanceUser = {
  id: string;
  name: string;
  role: {
    name: string;
  };
  branches: Array<{
    id: string;
  }>;
};

export function resolvePerformanceReportAccessScope(
  currentUser: AuthorizedPerformanceUser,
): PerformanceReportAccessScope {
  if (
    currentUser.role.name === ROLES.SUPER_ADMIN ||
    currentUser.role.name === ROLES.DIRECTOR
  ) {
    return { kind: "all" };
  }

  if (currentUser.role.name === ROLES.BRANCH_MANAGER) {
    return {
      kind: "branches",
      branchIds: currentUser.branches.map((branch) => branch.id),
    };
  }

  return {
    kind: "user",
    userId: currentUser.id,
    userName: currentUser.name,
  };
}
