import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const rules = await prisma.ipRule.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();

  const { ip, deviceFingerprint, label, status, reason, durationMinutes } =
    await req.json();

  if (!ip || !status) {
    return NextResponse.json(
      { message: "ip and status are required" },
      { status: 400 },
    );
  }

  const expiresAt = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60_000)
    : null;

  const rule = await prisma.ipRule.upsert({
    where: {
      ip_deviceFingerprint: {
        ip,
        deviceFingerprint: deviceFingerprint ?? null,
      },
    },
    update: {
      status,
      label,
      reason,
      expiresAt,
      createdById: currentUser?.id,
    },
    create: {
      ip,
      deviceFingerprint: deviceFingerprint ?? null,
      status,
      label,
      reason,
      expiresAt,
      createdById: currentUser?.id,
    },
  });

  return NextResponse.json(rule);
}