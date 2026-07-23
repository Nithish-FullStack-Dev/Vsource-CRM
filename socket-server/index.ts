import "dotenv/config";

import { createServer } from "node:http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";

import db from "../lib/prisma";
import { SOCKET_ROOMS } from "../lib/socket/rooms";
import { authenticateSocket } from "./authenticate-socket";

import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket.types";

const port = Number(process.env.SOCKET_PORT ?? 4001);

const allowedOrigins = (
  process.env.SOCKET_ALLOWED_ORIGINS ?? "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const httpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, {
      "Content-Type": "application/json",
    });

    response.end(
      JSON.stringify({
        status: "ok",
        service: "vsource-socket-server",
        timestamp: new Date().toISOString(),
      }),
    );

    return;
  }

  response.writeHead(404, {
    "Content-Type": "application/json",
  });

  response.end(
    JSON.stringify({
      success: false,
      message: "Not found",
    }),
  );
});

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  path: "/socket.io",

  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },

  transports: ["websocket", "polling"],

  pingInterval: 25_000,
  pingTimeout: 20_000,
  connectTimeout: 20_000,

  maxHttpBufferSize: 100_000,
  serveClient: false,
});

const redisPublisher = createClient({
  url: redisUrl,
});

const redisSubscriber = redisPublisher.duplicate();

redisPublisher.on("error", (error) => {
  console.error("[SocketRedisPublisher]", error);
});

redisSubscriber.on("error", (error) => {
  console.error("[SocketRedisSubscriber]", error);
});

io.use(authenticateSocket);

io.on("connection", async (socket) => {
  const { userId, userName, roleName, branchIds } = socket.data;

  /*
   * Every notification is finally emitted to this private room.
   * The same user can connect from multiple tabs or devices.
   */
  await socket.join(SOCKET_ROOMS.user(userId));

  /*
   * These rooms can be retained for future features, but notification
   * authorization will be controlled through recipient records.
   */
  await socket.join(SOCKET_ROOMS.role(roleName));

  for (const branchId of branchIds) {
    await socket.join(SOCKET_ROOMS.branch(branchId));
  }

  console.info("[SocketConnected]", {
    socketId: socket.id,
    userId,
    userName,
    roleName,
    rooms: Array.from(socket.rooms),
  });

  socket.emit("socket:ready", {
    userId,
    connectedAt: new Date().toISOString(),
  });

  socket.on("socket:ping", (acknowledgement) => {
    acknowledgement({
      ok: true,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", (reason) => {
    console.info("[SocketDisconnected]", {
      socketId: socket.id,
      userId,
      reason,
    });
  });

  socket.on("error", (error) => {
    console.error("[SocketError]", {
      socketId: socket.id,
      userId,
      error,
    });
  });
});

async function startSocketServer(): Promise<void> {
  await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);

  io.adapter(
    createAdapter(redisPublisher, redisSubscriber, {
      publishOnSpecificResponseChannel: true,
    }),
  );

  httpServer.listen(port, "0.0.0.0", () => {
    console.info("[SocketServer] Started", {
      port,
      allowedOrigins,
      redisConnected: true,
    });
  });
}

async function shutdown(signal: string): Promise<void> {
  console.info(`[SocketServer] Received ${signal}`);

  io.close();

  await Promise.allSettled([
    redisPublisher.quit(),
    redisSubscriber.quit(),
    db.$disconnect(),
  ]);

  httpServer.close(() => {
    console.info("[SocketServer] Shutdown complete");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[SocketServer] Forced shutdown");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  console.error("[SocketServer] Unhandled rejection", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[SocketServer] Uncaught exception", error);
  void shutdown("UNCAUGHT_EXCEPTION");
});

void startSocketServer().catch((error) => {
  console.error("[SocketServer] Startup failed", error);
  process.exit(1);
});
