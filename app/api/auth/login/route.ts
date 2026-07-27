import { NextResponse } from "next/server";
import { validateUser } from "@/lib/auth";
import { generateToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";
import { sendMaliciousLoginAlert } from "@/lib/mailer";
import { ROLES } from "@/lib/roles";

const IP_CHECK_EXEMPT_ROLES: string[] = [ROLES.SUPER_ADMIN, ROLES.DIRECTOR];

export async function POST(req: Request) {
  try {
    const { email, password, deviceFingerprint } = await req.json();

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const now = new Date();

    // 1. Validate credentials FIRST so we know the role before applying IP/device rules
    const result = await validateUser(email, password);

    if (result.status === "blocked") {
      return NextResponse.json(
        {
          message:
            "Your account has been blocked due to multiple failed login attempts. Please contact an administrator.",
        },
        { status: 403 },
      );
    }

    if (result.status === "invalid") {
      return NextResponse.json(
        {
          message:
            result.attemptsLeft !== undefined
              ? `Invalid credentials. ${result.attemptsLeft} attempt${
                  result.attemptsLeft === 1 ? "" : "s"
                } remaining before your account is blocked.`
              : "Invalid credentials",
          attemptsLeft: result.attemptsLeft,
        },
        { status: 401 },
      );
    }

    const user = result.user;
    const isExemptRole = IP_CHECK_EXEMPT_ROLES.includes(user.role.name);

    // 2. Apply IP/device checks only for non-exempt roles
    if (!isExemptRole) {
      // Hard block: explicit IP-level ban
      const ipBlockRule = await prisma.ipRule.findFirst({
        where: { ip, deviceFingerprint: null, status: "BLOCKED" },
      });

      const ipIsHardBlocked =
        ipBlockRule && (!ipBlockRule.expiresAt || ipBlockRule.expiresAt > now);

      if (ipIsHardBlocked) {
        await prisma.loginIpLog.create({
          data: {
            ip,
            deviceFingerprint,
            userEmail: email,
            userAgent,
            status: "BLOCKED_EXPLICIT",
          },
        });

        await sendMaliciousLoginAlert({
          ip,
          userEmail: email,
          userAgent,
          reason: ipBlockRule.reason ?? "IP explicitly blocked",
        });

        return NextResponse.json(
          { message: "Access denied from this IP address." },
          { status: 403 },
        );
      }

      // Primary check: known & allowed device?
      const deviceRule = deviceFingerprint
        ? await prisma.ipRule.findFirst({
            where: { deviceFingerprint, status: "ALLOWED" },
          })
        : null;

      const deviceIsAllowed =
        deviceRule && (!deviceRule.expiresAt || deviceRule.expiresAt > now);

      if (!deviceIsAllowed) {
        // Unknown device -> block, and register it as a pending/blocked
        // rule so it shows up in the admin panel for one-click approval.
        if (deviceFingerprint) {
          await prisma.ipRule.upsert({
            where: {
              ip_deviceFingerprint: { ip, deviceFingerprint },
            },
            update: {}, // don't overwrite if admin already actioned it
            create: {
              ip,
              deviceFingerprint,
              label: `Auto-flagged: ${email}`,
              status: "BLOCKED",
              reason: "New/unrecognized device attempted login",
            },
          });
        }

        await prisma.loginIpLog.create({
          data: {
            ip,
            deviceFingerprint,
            userEmail: email,
            userAgent,
            status: "BLOCKED_NOT_WHITELISTED",
          },
        });

        await sendMaliciousLoginAlert({
          ip,
          userEmail: email,
          userAgent,
          reason: "Device not recognized/allowlisted",
        });

        return NextResponse.json(
          { message: "This device is not authorized to sign in." },
          { status: 403 },
        );
      }

      // Known device, but check if this IP is new for it (soft flag only)
      const ipMatchesKnownDevice = deviceRule.ip === ip;

      await prisma.loginIpLog.create({
        data: {
          ip,
          deviceFingerprint,
          userEmail: email,
          userAgent,
          status: "ALLOWED",
        },
      });

      if (!ipMatchesKnownDevice) {
        await sendMaliciousLoginAlert({
          ip,
          userEmail: email,
          userAgent,
          reason: "Known device logged in from a new/unrecognized IP",
        });
      }
    }

    // 3. Issue token (runs for both exempt and approved non-exempt logins)
    const token = await generateToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    const response = NextResponse.json({
      success: true,
      user,
    });

    response.cookies.set("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}