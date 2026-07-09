import { NextRequest, NextResponse } from "next/server";
import { upsertTarget } from "@/lib/crmData";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchId, userId, intake, target, createdById } = body;

    if (
      !branchId ||
      !userId ||
      !intake ||
      typeof target !== "number" ||
      target < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid target values. Branch, user, intake and non-negative target are required.",
        },
        { status: 400 },
      );
    }

    const updatedTarget = await upsertTarget(
      branchId,
      userId,
      intake,
      target,
      createdById || null,
    );

    return NextResponse.json({ success: true, target: updatedTarget });
  } catch (err: any) {
    console.error("Error in POST /api/targets:", err);
    return NextResponse.json(
      { error: err.message || "Failed to set/update target" },
      { status: 500 },
    );
  }
}
