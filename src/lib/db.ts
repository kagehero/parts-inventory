import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function makePrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * DB接続切断後の自動再接続を試みるラッパー。
 * Prisma は接続が切れると自動で再接続するが、Hot Reload 時などに
 * "Error { kind: Closed }" が出る場合は $connect() を呼んで明示的に再確立する。
 */
export async function withReconnect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Closed") || msg.includes("Connection refused") || msg.includes("pool")) {
      await prisma.$connect();
      return fn();
    }
    throw err;
  }
}
