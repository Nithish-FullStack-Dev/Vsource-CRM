import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status, reason, label, durationMinutes } = await req.json();

  const expiresAt =
    durationMinutes !== undefined
      ? durationMinutes
        ? new Date(Date.now() + durationMinutes * 60_000)
        : null
      : undefined;

  const rule = await prisma.ipRule.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(reason !== undefined && { reason }),
      ...(label !== undefined && { label }),
      ...(expiresAt !== undefined && { expiresAt }),
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.ipRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}