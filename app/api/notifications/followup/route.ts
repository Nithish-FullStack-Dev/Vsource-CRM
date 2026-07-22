/**
 * app/api/notifications/followup/route.ts
 * POST /api/notifications/followup
 *
 * Cron endpoint: checks for leads with nextFollowup = today and fires
 * follow-up reminder notifications. Secured with CRON_SECRET header.
 * Safe to run multiple times per day — dedupeKey prevents duplicates.
 */

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { notifyFollowupReminder } from "@/lib/notification.service";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Date-only bounds for "today"
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const leads = await db.lead.findMany({
      where: {
        nextFollowup: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isConverted: false,
      },
      select: {
        id: true,
        leadNumber: true,
        studentName: true,
        branchId: true,
        counselors: {
          select: { counselorId: true },
        },
      },
    });

    if (leads.length === 0) {
      return NextResponse.json({ success: true, reminded: 0 });
    }

    // Fire notifications in parallel (each is internally safe)
    await Promise.allSettled(leads.map((lead) => notifyFollowupReminder(lead)));

    return NextResponse.json({ success: true, reminded: leads.length });
  } catch (err) {
    console.error("[FollowupCron] Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
