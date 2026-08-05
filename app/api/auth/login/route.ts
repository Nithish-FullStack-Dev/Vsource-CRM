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
      // 1. Hard Block (Highest Priority)
      // ------------------------------------------------------------------

      const ipBlockRule = await prisma.ipRule.findFirst({
        where: {
          ip,
          deviceFingerprint: null,
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
      // 2. Fetch Allow Rules
      // ------------------------------------------------------------------

      const [ipAllowRule, deviceAllowRule] = await Promise.all([
        prisma.ipRule.findFirst({
          where: {
            ip,
            deviceFingerprint: null,
            status: "ALLOWED",
          },
        }),

        deviceFingerprint
          ? prisma.ipRule.findFirst({
            where: {
              ip,
              deviceFingerprint,
              status: "ALLOWED",
            },
          })
          : Promise.resolve(null),
      ]);

      const ipIsAllowed =
        !!ipAllowRule &&
        (!ipAllowRule.expiresAt || ipAllowRule.expiresAt > now);

      const deviceIsAllowed =
        !!deviceAllowRule &&
        (!deviceAllowRule.expiresAt || deviceAllowRule.expiresAt > now);

      const hasFingerprint =
        typeof deviceFingerprint === "string" &&
        deviceFingerprint.trim().length > 0;

      // ------------------------------------------------------------------
      // PRIORITY:
      // 1. Allowed IP + fingerprint
      // 2. Allowed device
      // ------------------------------------------------------------------

      const isAllowed =
        (ipIsAllowed && hasFingerprint) ||
        deviceIsAllowed;

      if (!isAllowed) {
        if (deviceFingerprint) {
          await prisma.ipRule.upsert({
            where: {
              ip_deviceFingerprint: {
                ip,
                deviceFingerprint,
              },
            },
            update: {},
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
          {
            message: "This device is not authorized to sign in.",
          },
          {
            status: 403,
          }
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

      // Optional:
      // Alert only if login was allowed by device rule but IP changed.
      if (
        deviceIsAllowed &&
        deviceAllowRule &&
        deviceAllowRule.ip !== ip
      ) {
        await sendMaliciousLoginAlert({
          ip,
          userEmail: email,
          userAgent,
          reason: "Known device logged in from a new IP",
        });
      }
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