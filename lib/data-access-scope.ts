// lib\data-access-scope.ts
import type { Prisma } from "@/generated/prisma/client";
import { ROLES } from "@/lib/rbac";

export type DataAccessUser = {
  id: string;
  name: string;
  role: {
    name: string;
  };
  branches: Array<{
    id: string;
  }>;
};

export type DataAccessScope =
  | {
      kind: "all";
    }
  | {
      kind: "branches";
      branchIds: string[];
    }
  | {
      kind: "user";
      userId: string;
      userName: string;
    };

export function resolveDataAccessScope(
  currentUser: DataAccessUser,
): DataAccessScope {
  if (
    currentUser.role.name === ROLES.SUPER_ADMIN ||
    currentUser.role.name === ROLES.DIRECTOR
  ) {
    return {
      kind: "all",
    };
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

export function getUserAccessWhere(
  scope: DataAccessScope,
): Prisma.UserWhereInput {
  if (scope.kind === "all") {
    return {};
  }

  if (scope.kind === "branches") {
    return {
      branches: {
        some: {
          id: {
            in: scope.branchIds,
          },
        },
      },
    };
  }

  return {
    id: scope.userId,
  };
}

export function getLeadAccessWhere(
  scope: DataAccessScope,
): Prisma.LeadWhereInput {
  if (scope.kind === "all") {
    return {};
  }

  if (scope.kind === "branches") {
    return {
      branchId: {
        in: scope.branchIds,
      },
    };
  }

  return {
    OR: [
      {
        counselors: {
          some: {
            counselorId: scope.userId,
          },
        },
      },
      {
        createdById: scope.userId,
      },
    ],
  };
}

export function getStudentAccessWhere(
  scope: DataAccessScope,
): Prisma.StudentWhereInput {
  if (scope.kind === "all") {
    return {};
  }

  if (scope.kind === "branches") {
    return {
      branchId: {
        in: scope.branchIds,
      },
    };
  }

  return {
    counselorId: scope.userId,
  };
}

export function getStudentApplicationAccessWhere(
  scope: DataAccessScope,
): Prisma.StudentApplicationWhereInput {
  if (scope.kind === "all") {
    return {};
  }

  if (scope.kind === "branches") {
    return {
      student: {
        branchId: {
          in: scope.branchIds,
        },
      },
    };
  }

  return {
    student: {
      counselorId: scope.userId,
    },
  };
}

export function getStudentTimelineAccessWhere(
  scope: DataAccessScope,
): Prisma.StudentTimelineWhereInput {
  if (scope.kind === "all") {
    return {};
  }

  if (scope.kind === "branches") {
    return {
      student: {
        branchId: {
          in: scope.branchIds,
        },
      },
    };
  }

  return {
    student: {
      counselorId: scope.userId,
    },
  };
}
