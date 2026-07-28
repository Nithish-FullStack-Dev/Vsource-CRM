import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ROLES } from "@/lib/roles";

const EXEMPT_ROLES: string[] = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR];
const MAX_FAILED_ATTEMPTS = 3;

async function findUserWithRole(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          modulePermissions: {
            include: {
              module: true,
            },
          },
        },
      },
      branches: true,
    },
  });
}

type FoundUser = NonNullable<Awaited<ReturnType<typeof findUserWithRole>>>;

type ValidateResult =
  | { status: "ok"; user: FoundUser }
  | { status: "invalid"; attemptsLeft?: number }
  | { status: "blocked" };

export async function validateUser(
  email: string,
  password: string,
): Promise<ValidateResult> {
  const user = await findUserWithRole(email);

  if (!user) {
    return { status: "invalid" };
  }

  const isExempt = EXEMPT_ROLES.includes(user.role.name);

  if (user.isBlocked && !isExempt) {
    return { status: "blocked" };
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    if (isExempt) {
      return { status: "invalid" };
    }

    const updatedAttempts = user.failedLoginAttempts + 1;
    const shouldBlock = updatedAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: updatedAttempts,
        isBlocked: shouldBlock,
      },
    });

    if (shouldBlock) {
      return { status: "blocked" };
    }

    return {
      status: "invalid",
      attemptsLeft: MAX_FAILED_ATTEMPTS - updatedAttempts,
    };
  }

  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0 },
    });
  }

  return { status: "ok", user };
}

export async function getCurrentUser() {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) return null;

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const { payload } = await jwtVerify(token, secret);

  return {
    id: payload.sub as string,
    roleId: payload.roleId as string,
  };
}