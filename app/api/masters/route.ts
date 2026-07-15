import { NextRequest, NextResponse } from "next/server";
import { queryMasters } from "@/lib/crmData";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      request,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.READ,
    );

    const masters = await queryMasters(currentUser.id);
    return NextResponse.json(masters);
  } catch (err: any) {
    console.error("Error in GET /api/masters:", err);
    return NextResponse.json(
      { error: "Failed to retrieve CRM masters" },
      { status: 500 },
    );
  }
}
