// app/api/loan-applications/[id]/activities/route.ts

import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { activitySchema } from "@/schemas/loan-application/loan-application.schema";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

interface CreateActivityBody {
  type?: string;
  title: string;
  description?: string | null;
  createdById?: string | null;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const body = (await req.json()) as CreateActivityBody;

    const validatedData = activitySchema.parse(body);

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    let validCreatedById: string | null = null;

    if (body.createdById) {
      const user = await db.user.findUnique({
        where: {
          id: body.createdById,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          {
            message: "Invalid activity creator",
          },
          {
            status: 400,
          },
        );
      }

      validCreatedById = user.id;
    }

    const created = await db.loanActivity.create({
      data: {
        applicationId: id,
        type: validatedData.type ?? "activities",
        title: validatedData.title,
        description: validatedData.description ?? null,
        createdById: validCreatedById,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Activity added successfully",
        data: created,
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error("POST loan activity error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "issues" in error &&
      Array.isArray(error.issues)
    ) {
      return NextResponse.json(
        {
          message:
            error.issues[0]?.message ??
            "Invalid activity data",
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to add activity",
      },
      {
        status: 500,
      },
    );
  }
}