// app/api/loan-applications/[id]/document-masters/route.ts

import { NextRequest } from "next/server";
import { z } from "zod";

import db, { prisma } from "@/lib/prisma";
import { handleError, notFound, ok } from "@/lib/api-helpers";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

const CreateDocumentMaster = z.object({
  name: z.string().trim().min(2, "Document name is required").max(100),

  required: z.boolean().default(false),
});

function slugifyDocumentName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const POST = async (req: NextRequest, ctx: Ctx) => {
  try {
    const { id } = await ctx.params;

    // 1. Validate loan application
    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return notFound("Loan application");
    }

    // 2. Validate request
    const body = CreateDocumentMaster.parse(await req.json());

    // 3. Prevent duplicate custom document names
    // within this loan application
    const existing = await db.loanDocumentMaster.findFirst({
      where: {
        applicationId: id,
        category: "OTHER",
        isActive: true,

        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return Response.json(
        {
          message: "A custom document with this name already exists",
        },
        {
          status: 409,
        },
      );
    }

    // 4. Generate internal unique code
    const baseCode = slugifyDocumentName(body.name) || "custom_document";

    const code = `${baseCode}_${crypto.randomUUID().slice(0, 8)}`;

    // 5. Find last custom document order
    const lastDocument = await db.loanDocumentMaster.findFirst({
      where: {
        applicationId: id,
        category: "OTHER",
      },

      orderBy: {
        sortOrder: "desc",
      },

      select: {
        sortOrder: true,
      },
    });

    // 6. Create custom master
    const documentMaster = await db.loanDocumentMaster.create({
      data: {
        id: crypto.randomUUID(),

        code,
        name: body.name,

        category: "OTHER",

        required: body.required,

        isSystem: false,
        isActive: true,

        applicationId: id,

        sortOrder: (lastDocument?.sortOrder ?? 0) + 1,

        updatedAt: new Date(),
      },
    });

    return ok(documentMaster, "Custom document added successfully");
  } catch (error) {
    return handleError(error);
  }
};

export const GET = async (_: NextRequest, ctx: Ctx) => {
  try {
    const { id } = await ctx.params;

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return notFound("Loan application");
    }

    const documentMasters = await db.loanDocumentMaster.findMany({
      where: {
        applicationId: id,
        category: "OTHER",
        isSystem: false,
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return ok(documentMasters, "Custom document masters fetched successfully");
  } catch (error) {
    return handleError(error);
  }
};
