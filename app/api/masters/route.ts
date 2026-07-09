import { NextResponse } from "next/server";
import { queryMasters } from "@/lib/crmData";

export async function GET() {
  try {
    const masters = await queryMasters();
    return NextResponse.json(masters);
  } catch (err: any) {
    console.error("Error in GET /api/masters:", err);
    return NextResponse.json(
      { error: "Failed to retrieve CRM masters" },
      { status: 500 },
    );
  }
}
