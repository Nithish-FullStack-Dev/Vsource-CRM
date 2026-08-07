import { NextResponse } from "next/server";
import { validateUser } from "@/lib/auth";
import { generateToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";
import { sendMaliciousLoginAlert } from "@/lib/mailer";
import { ROLES } from "@/lib/roles";

const IP_CHECK_EXEMPT_ROLES: string[] = [
  ROLES.SUPER_ADMIN,
  ROLES.DIRECTOR,
];

export async function POST(req: Request) {
  try {
    const { email, password, deviceFingerprint } = await req.json();

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const now = new Date();

    // Validate credentials first
    const result = await validateUser(email, password);

    if (result.status === "blocked") {
      return NextResponse.json(
        {
          message:
            "Your account has been blocked due to multiple failed login attempts. Please contact an administrator.",
        },
        { status: 403 }
      );
    }

    if (result.status === "invalid") {
      return NextResponse.json(
        {
          message:
            result.attemptsLeft !== undefined
              ? `Invalid credentials. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"
              } remaining before your account is blocked.`
              : "Invalid credentials",
          attemptsLeft: result.attemptsLeft,
        },
        { status: 401 }
      );
    }

    const user = result.user;
    const isExemptRole = IP_CHECK_EXEMPT_ROLES.includes(user.role.name);

    if (!isExemptRole) {
      // ------------------------------------------------------------------
      // 1. Hard Block (Highest Priority) — keyed on ip + email
      // ------------------------------------------------------------------

      const ipBlockRule = await prisma.ipRule.findFirst({
        where: {
          ip,
          email,
          status: "BLOCKED",
        },
      });

      const ipIsHardBlocked =
        !!ipBlockRule &&
        (!ipBlockRule.expiresAt || ipBlockRule.expiresAt > now);

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

        try {
          await sendMaliciousLoginAlert({
            ip,
            userEmail: email,
            userAgent,
            reason: ipBlockRule.reason ?? "IP explicitly blocked",
          });
        } catch (err) {
          console.error("Failed to send alert email:", err);
        }

        return NextResponse.json(
          { message: "Access denied from this IP address." },
          { status: 403 },
        );
      }

      // ------------------------------------------------------------------
      // 2. Fetch Allow Rule — ip + email is the sole trust key now
      // ------------------------------------------------------------------

      const ipEmailAllowRule = await prisma.ipRule.findFirst({
        where: {
          ip,
          email,
          status: "ALLOWED",
        },
      });

      const isAllowed =
        !!ipEmailAllowRule &&
        (!ipEmailAllowRule.expiresAt || ipEmailAllowRule.expiresAt > now);

      if (!isAllowed) {
        await prisma.ipRule.upsert({
          where: {
            ip_email: {
              ip,
              email,
            },
          },
          update: {},
          create: {
            ip,
            email,
            deviceFingerprint: deviceFingerprint ?? null,
            label: `Auto-flagged: ${email}`,
            status: "BLOCKED",
            reason: "New/unrecognized ip+email combination",
          },
        });

        await prisma.loginIpLog.create({
          data: {
            ip,
            deviceFingerprint,
            userEmail: email,
            userAgent,
            status: "BLOCKED_NOT_WHITELISTED",
          },
        });

        try {
          await sendMaliciousLoginAlert({
            ip,
            userEmail: email,
            userAgent,
            reason: "IP+email combination not recognized/allowlisted",
          });
        } catch (err) {
          console.error("Failed to send alert email:", err);
        }

        return NextResponse.json(
          { message: "This IP is not authorized for this account." },
          { status: 403 }
        );
      }

      // ------------------------------------------------------------------
      // Login Allowed
      // ------------------------------------------------------------------

      await prisma.loginIpLog.create({
        data: {
          ip,
          deviceFingerprint,
          userEmail: email,
          userAgent,
          status: "ALLOWED",
        },
      });
    }

    // ------------------------------------------------------------------
    // Issue JWT
    // ------------------------------------------------------------------

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
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}