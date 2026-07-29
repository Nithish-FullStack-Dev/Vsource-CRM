import { io, type Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "./event";

export type CRMSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: CRMSocket | null = null;

export function getSocket(): CRMSocket {
  if (typeof window === "undefined") {
    throw new Error("Socket.IO client can only be initialized in the browser.");
  }

  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001";

    console.info("[SocketClient] Initializing", {
      socketUrl,
      origin: window.location.origin,
    });

    socket = io(socketUrl, {
      path: "/socket.io",

      withCredentials: true,

      autoConnect: false,

      // Start with polling, then upgrade to WebSocket.
      transports: ["polling", "websocket"],

      upgrade: true,

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.5,

      timeout: 20_000,
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}