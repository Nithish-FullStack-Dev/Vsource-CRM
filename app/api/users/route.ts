// app\api\users\route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import db from "@/lib/prisma";

import { getAuthorizedUser, ROLES, ApiError } from "@/lib/rbac";

import {
  getUserAccessWhere,
  resolveDataAccessScope,
} from "@/lib/data-access-scope";

import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";

import { UserCreateSchema } from "@/lib/schemas";

import { MODULES, PERMISSIONS } from "@/lib/module-codes";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,

  role: {
    select: {
      id: true,
      name: true,
    },
  },

  branches: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.USERS,
      PERMISSIONS.READ,
    );

    const scope = resolveDataAccessScope(currentUser);

    const sp = req.nextUrl.searchParams;

    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search")?.trim() || undefined;

    const roleId = sp.get("roleId") || undefined;

    const branchId = sp.get("branchId") || undefined;

    const accessWhere = getUserAccessWhere(scope);

    const where = {
      AND: [
        accessWhere,

        ...(search
          ? [
              {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },

                  {
                    email: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },

                  {
                    role: {
                      name: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ],
              },
            ]
          : []),

        ...(roleId
          ? [
              {
                roleId,
              },
            ]
          : []),

        ...(branchId
          ? [
              {
                branches: {
                  some: {
                    id: branchId,
                  },
                },
              },
            ]
          : []),
      ],
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,

        skip,

        take,

        orderBy: {
          createdAt: "desc",
        },

        select: USER_SELECT,
      }),

      db.user.count({
        where,
      }),
    ]);

    return ok(users, undefined, buildMeta(total, page, limit));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.USERS,
      PERMISSIONS.CREATE,
    );

    const { branchIds, password, ...rest } = UserCreateSchema.parse(
      await req.json(),
    );

    const requestedBranchIds = branchIds ?? [];

    if (currentUser.role.name === ROLES.BRANCH_MANAGER) {
      const managerBranchIds = new Set(
        currentUser.branches.map((branch) => branch.id),
      );

      const hasUnauthorizedBranch = requestedBranchIds.some(
        (branchId) => !managerBranchIds.has(branchId),
      );

      if (hasUnauthorizedBranch) {
        throw new ApiError(
          403,
          "You cannot create users outside your assigned branches",
        );
      }
    }

    if (
      currentUser.role.name !== ROLES.SUPER_ADMIN &&
      currentUser.role.name !== ROLES.DIRECTOR &&
      currentUser.role.name !== ROLES.BRANCH_MANAGER
    ) {
      throw new ApiError(403, "You do not have permission to create users");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        ...rest,

        password: hashedPassword,

        ...(requestedBranchIds.length > 0
          ? {
              branches: {
                connect: requestedBranchIds.map((id) => ({
                  id,
                })),
              },
            }
          : {}),
      },

      select: USER_SELECT,
    });

    return created(user, "User created successfully");
  } catch (error) {
    return handleError(error);
  }
}
