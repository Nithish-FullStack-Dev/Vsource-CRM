import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? undefined;
  return NextResponse.json({ ip, userAgent });
}