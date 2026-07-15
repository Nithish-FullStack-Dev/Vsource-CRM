// app\api\users\branch-dropdown\route.ts

import { handleError, ok } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findMany({
      where: {
        branches: {
          some: {
            id,
          },
        },
      },
      select: {
        name: true,
        id: true,
      },
    });

    return ok(user, "user details fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
