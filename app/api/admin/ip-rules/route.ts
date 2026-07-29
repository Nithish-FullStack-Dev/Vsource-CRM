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

  const fingerprint = deviceFingerprint ?? null;

  const data = {
    status,
    label,
    reason,
    expiresAt,
    createdById: currentUser?.id,
  };

  let rule;

  if (fingerprint) {
    // Fingerprint present — safe to use the compound unique key
    rule = await prisma.ipRule.upsert({
      where: {
        ip_deviceFingerprint: {
          ip,
          deviceFingerprint: fingerprint,
        },
      },
      update: data,
      create: {
        ip,
        deviceFingerprint: fingerprint,
        ...data,
      },
    });
  } else {
    // No fingerprint — Prisma's compound unique key requires all fields
    // to be non-null, so `ip_deviceFingerprint` can't be used as a `where`
    // when deviceFingerprint is null. Fall back to a manual find + create/update.
    const existing = await prisma.ipRule.findFirst({
      where: { ip, deviceFingerprint: null },
    });

    if (existing) {
      rule = await prisma.ipRule.update({
        where: { id: existing.id },
        data,
      });
    } else {
      rule = await prisma.ipRule.create({
        data: {
          ip,
          deviceFingerprint: null,
          ...data,
        },
      });
    }
  }

  return NextResponse.json(rule);
}