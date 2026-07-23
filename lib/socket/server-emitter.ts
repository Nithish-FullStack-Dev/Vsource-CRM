import { Emitter } from "@socket.io/redis-emitter";
import { createClient, type RedisClientType } from "redis";

import type { ServerToClientEvents } from "@/lib/socket/event";

type SocketEmitter = Emitter<ServerToClientEvents>;

const globalForSocketEmitter = globalThis as unknown as {
  socketRedisClient?: RedisClientType;
  socketEmitter?: SocketEmitter;
  socketEmitterPromise?: Promise<SocketEmitter>;
};

async function createSocketEmitter(): Promise<SocketEmitter> {
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

  const redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on("error", (error) => {
    console.error("[SocketEmitterRedis]", error);
  });

  await redisClient.connect();

  const emitter = new Emitter<ServerToClientEvents>(redisClient);

  globalForSocketEmitter.socketRedisClient = redisClient;
  globalForSocketEmitter.socketEmitter = emitter;

  return emitter;
}

export async function getSocketEmitter(): Promise<SocketEmitter> {
  if (globalForSocketEmitter.socketEmitter) {
    return globalForSocketEmitter.socketEmitter;
  }

  if (!globalForSocketEmitter.socketEmitterPromise) {
    globalForSocketEmitter.socketEmitterPromise = createSocketEmitter().catch(
      (error) => {
        globalForSocketEmitter.socketEmitterPromise = undefined;
        throw error;
      },
    );
  }

  return globalForSocketEmitter.socketEmitterPromise;
}
