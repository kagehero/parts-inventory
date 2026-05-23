import type { Prisma, PrismaClient } from "@prisma/client";

/** Prisma client or interactive transaction client — pass into services for atomic work. */
export type DbClient = PrismaClient | Prisma.TransactionClient;
