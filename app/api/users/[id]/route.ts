/**
 * api/users/[id]/route.ts
 * GET    /api/users/:id
 * PUT  /api/users/:id
 * DELETE /api/users/:id
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/rbac";
import { ok, notFound, noContent, handleError } from "@/lib/api-helpers";
import { UserUpdateSchema } from "@/lib/schemas";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

type Ctx = { params: Promise<{ id: string }> };

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true, description: true } },
  branches: { select: { id: true, name: true, code: true } },
} as const;

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(_req, MODULES.USERS, PERMISSIONS.READ);

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) return notFound("User");
    return ok(user);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(req, MODULES.USERS, PERMISSIONS.UPDATE);

    const { id } = await params;
    const { branchIds, password, ...rest } = UserUpdateSchema.parse(
      await req.json(),
    );

    const data: Record<string, unknown> = { ...rest };
    if (password) data.password = await bcrypt.hash(password, 10);
    if (branchIds !== undefined) {
      data.branches = { set: branchIds.map((bid) => ({ id: bid })) };
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
    return ok(user, "User updated successfully");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    await getAuthorizedUser(req, MODULES.USERS, PERMISSIONS.DELETE);

    const { id } = await params;
    await db.user.delete({ where: { id } });
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
