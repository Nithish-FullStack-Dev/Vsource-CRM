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

  const { ip, deviceFingerprint, email, label, status, reason, durationMinutes } =
    await req.json();

  if (!ip || !email || !status) {
    return NextResponse.json(
      { message: "ip, email and status are required" },
      { status: 400 },
    );
  }

  const expiresAt = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60_000)
    : null;

  const data = {
    status,
    label,
    reason,
    expiresAt,
    deviceFingerprint: deviceFingerprint ?? null,
    createdById: currentUser?.id,
  };

  const rule = await prisma.ipRule.upsert({
    where: {
      ip_email: {
        ip,
        email,
      },
    },
    update: data,
    create: {
      ip,
      email,
      ...data,
    },
  });

  return NextResponse.json(rule);
}