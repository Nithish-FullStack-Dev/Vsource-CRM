"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  disconnectSocket,
  getSocket,
  type CRMSocket,
} from "@/lib/socket/client";

type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface SocketContextValue {
  socket: CRMSocket | null;
  status: SocketStatus;
  error: string | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  status: "idle",
  error: null,
});

interface SocketProviderProps {
  children: ReactNode;
  authenticated: boolean;
}

export function SocketProvider({
  children,
  authenticated,
}: SocketProviderProps) {
  const [socket, setSocket] = useState<CRMSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) {
      disconnectSocket();
      setSocket(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const activeSocket = getSocket();

    setSocket(activeSocket);
    setStatus("connecting");
    setError(null);

    const handleConnect = (): void => {
      setStatus("connected");
      setError(null);
    };

    const handleDisconnect = (): void => {
      setStatus("disconnected");
    };

    const handleConnectError = (connectionError: Error): void => {
      console.error("[SocketClient] Connection failed", connectionError);
      setStatus("error");
      setError(connectionError.message);
    };

    const handleReady = (payload: {
      userId: string;
      connectedAt: string;
    }): void => {
      console.info("[SocketClient] Ready", payload);
    };

    activeSocket.on("connect", handleConnect);
    activeSocket.on("disconnect", handleDisconnect);
    activeSocket.on("connect_error", handleConnectError);
    activeSocket.on("socket:ready", handleReady);

    if (!activeSocket.connected) {
      activeSocket.connect();
    }

    return () => {
      activeSocket.off("connect", handleConnect);
      activeSocket.off("disconnect", handleDisconnect);
      activeSocket.off("connect_error", handleConnectError);
      activeSocket.off("socket:ready", handleReady);
    };
  }, [authenticated]);

  const contextValue = useMemo<SocketContextValue>(
    () => ({
      socket,
      status,
      error,
    }),
    [socket, status, error],
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
