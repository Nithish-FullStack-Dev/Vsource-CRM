/**
 * app/api/notifications/process/route.ts
 * POST /api/notifications/process
 *
 * Internal endpoint: processes PENDING NotificationOutbox rows and converts
 * them into Notification records. Secured with CRON_SECRET header.
 *
 * Call this from:
 *   - Vercel Cron (vercel.json)
 *   - Any external scheduler
 *   - Manually for testing
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  // ── Security: internal-only via secret header ──────────────────────────
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const processorId = randomUUID(); // unique lock owner for this run

    // ── 1. Claim PENDING rows atomically ───────────────────────────────────
    const claimed = await db.notificationOutbox.findMany({
      where: {
        status: "PENDING",
        nextAttemptAt: { lte: now },
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    if (claimed.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const claimedIds = claimed.map((r) => r.id);

    // Lock them
    await db.notificationOutbox.updateMany({
      where: { id: { in: claimedIds } },
      data: { status: "PROCESSING", lockedAt: now, lockedBy: processorId },
    });

    let successCount = 0;
    let failCount = 0;

    for (const outbox of claimed) {
      try {
        const payload = outbox.payload as Record<string, unknown>;
        const recipientId = payload.recipientId as string;

        if (!recipientId) {
          throw new Error("Missing recipientId in outbox payload");
        }

        const eventId = randomUUID();

        // ── 2. Create Notification row (skipDuplicates via @@unique) ──────
        await db.notification.createMany({
          data: [
            {
              id: randomUUID(),
              eventId,
              eventKey: outbox.eventKey,
              recipientId,
              actorId: outbox.actorId ?? null,
              branchId: outbox.branchId ?? null,
              entityType: outbox.aggregateType,
              entityId: outbox.aggregateId,
              title: payload.title as string,
              message: payload.message as string,
              actionUrl: (payload.actionUrl as string) ?? null,
              icon: null,
              priority: (payload.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") ?? "NORMAL",
              metadata: (payload.metadata as Prisma.InputJsonValue) ?? null,
              readAt: null,
              archivedAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          skipDuplicates: true,
        });

        // ── 3. Mark outbox row as PROCESSED ──────────────────────────────
        await db.notificationOutbox.update({
          where: { id: outbox.id },
          data: {
            status: "PROCESSED",
            processedAt: now,
            lockedAt: null,
            lockedBy: null,
            updatedAt: now,
          },
        });

        successCount++;
      } catch (err) {
        console.error(`[NotificationProcessor] Failed to process outbox ${outbox.id}:`, err);
        failCount++;

        // Exponential backoff: nextAttemptAt = now + 2^attempts minutes
        const attempts = outbox.attempts + 1;
        const backoffMinutes = Math.min(Math.pow(2, attempts), 60);
        const nextAttemptAt = new Date(now.getTime() + backoffMinutes * 60 * 1000);

        await db.notificationOutbox.update({
          where: { id: outbox.id },
          data: {
            status: attempts >= 5 ? "FAILED" : "PENDING",
            attempts,
            nextAttemptAt,
            lastError: err instanceof Error ? err.message : String(err),
            lockedAt: null,
            lockedBy: null,
            updatedAt: now,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: successCount,
      failed: failCount,
    });
  } catch (err) {
    console.error("[NotificationProcessor] Fatal error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
