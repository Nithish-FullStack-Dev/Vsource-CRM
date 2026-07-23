import type { ExtendedError, Socket } from "socket.io";

import db from "../lib/prisma";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket.types";
import { verifyToken } from "@/lib/jwt";

type CRMServerSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

interface AccessTokenPayload {
  id: string;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [name, ...value] = cookie.trim().split("=");
      return [name, decodeURIComponent(value.join("="))];
    }),
  );
}

function isAccessTokenPayload(payload: unknown): payload is AccessTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof (payload as AccessTokenPayload).id === "string"
  );
}

export async function authenticateSocket(
  socket: CRMServerSocket,
  next: (error?: ExtendedError) => void,
): Promise<void> {
  try {
    const rawCookie = socket.request.headers.cookie;

    if (!rawCookie) {
      return next(new Error("AUTHENTICATION_REQUIRED"));
    }

    const cookies = parseCookies(rawCookie);
    const accessToken = cookies.access_token;

    if (!accessToken) {
      return next(new Error("AUTHENTICATION_REQUIRED"));
    }

    const payload = await verifyToken(accessToken);

    if (!isAccessTokenPayload(payload)) {
      return next(new Error("INVALID_ACCESS_TOKEN"));
    }

    const user = await db.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        name: true,
        role: {
          select: {
            name: true,
          },
        },
        branches: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return next(new Error("USER_NOT_FOUND"));
    }

    socket.data.userId = user.id;
    socket.data.userName = user.name;
    socket.data.roleName = user.role.name;
    socket.data.branchIds = user.branches.map((branch) => branch.id);

    return next();
  } catch (error) {
    console.error("[SocketAuthentication]", error);
    return next(new Error("INVALID_ACCESS_TOKEN"));
  }
}
