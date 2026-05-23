import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Read models for the inventory UI. On-hand totals come from `Part.currentQty`, which is
 * kept in sync with `inventory_logs` by purchase receipt and usage services.
 */
const searchMode = "insensitive" as const;

export type InventoryLogListParams = {
  query?: string;
  take?: number;
};

/** Ledger rows for history UI (newest first). */
export async function listInventoryLogs(params: InventoryLogListParams = {}) {
  const take = params.take ?? 200;
  const q = params.query?.trim();

  const where = q
    ? {
        OR: [
          { note: { contains: q, mode: searchMode } },
          { part: { name: { contains: q, mode: searchMode } } },
          { part: { oemPartNo: { contains: q, mode: searchMode } } },
          { part: { aftermarketNo: { contains: q, mode: searchMode } } },
        ],
      }
    : undefined;

  return prisma.inventoryLog.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take,
    include: { part: true },
  });
}

export type StockListParams = {
  query?: string;
  /** Only parts with qty &gt; lowWater */
  lowWater?: number;
  take?: number;
};

/** Parts master with current qty — for inventory / stock overview + search. */
export async function listPartsStock(params: StockListParams = {}) {
  const take = params.take ?? 500;
  const q = params.query?.trim();
  const lw = params.lowWater;

  const where: Prisma.PartWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: searchMode } },
      { oemPartNo: { contains: q, mode: searchMode } },
      { aftermarketNo: { contains: q, mode: searchMode } },
      { compatibleModels: { contains: q, mode: searchMode } },
    ];
  }
  if (lw !== undefined) {
    where.currentQty = { lte: lw };
  }

  return prisma.part.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { name: "asc" },
    take,
  });
}

/** Ledger rows for one part — newest first. Includes linkage for 「誰へ」 outbound and purchase context. */
export async function listInventoryLogsForPart(partId: string, take = 500) {
  return prisma.inventoryLog.findMany({
    where: { partId },
    orderBy: { occurredAt: "desc" },
    take,
    include: {
      part: true,
      orderLine: {
        include: {
          order: { select: { id: true, supplierName: true, orderDate: true } },
        },
      },
      usageHistoryLine: {
        include: {
          usageHistory: {
            include: { customer: true, machine: true },
          },
        },
      },
    },
  });
}
