/**
 * app/api/banks/[id]/route.ts
 *
 * GET    /api/banks/:id
 * PUT    /api/banks/:id
 * PATCH  /api/banks/:id
 * DELETE /api/banks/:id
 */

import { NextRequest } from "next/server";

import { handleError, noContent, notFound, ok } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";
import { BankUpdateSchema } from "@/lib/schemas";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const bank = await prisma.bank.findUnique({
      where: {
        id,
      },
    });

    if (!bank) {
      return notFound("Bank");
    }

    return ok(bank);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const existingBank = await prisma.bank.findUnique({
      where: {
        id,
      },
    });

    if (!existingBank) {
      return notFound("Bank");
    }

    const body = BankUpdateSchema.parse(await req.json());

    const bank = await prisma.bank.update({
      where: {
        id,
      },
      data: body,
    });

    return ok(bank, "Bank updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const existingBank = await prisma.bank.findUnique({
      where: {
        id,
      },
    });

    if (!existingBank) {
      return notFound("Bank");
    }

    const body = BankUpdateSchema.pick({
      status: true,
    }).parse(await req.json());

    const bank = await prisma.bank.update({
      where: {
        id,
      },
      data: {
        status: body.status,
      },
    });

    return ok(bank, "Bank status updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const existingBank = await prisma.bank.findUnique({
      where: {
        id,
      },
    });

    if (!existingBank) {
      return notFound("Bank");
    }

    await prisma.bank.delete({
      where: {
        id,
      },
    });

    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
