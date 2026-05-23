import type { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/types";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

const searchMode = "insensitive" as const;

export type PartWriteInput = {
  name: string;
  oemPartNo?: string;
  aftermarketNo?: string;
  oemListPrice?: Prisma.Decimal | null;
  purchasePrice?: Prisma.Decimal | null;
  salePrice?: Prisma.Decimal | null;
  compatibleModels?: string;
  markupRate?: Prisma.Decimal | null;
};

/**
 * Creates a SKU with **zero** stock. Stock increases only via purchase receipt
 * (`PURCHASE_IN` logs); see `orders.service`.
 */
export async function createPartTx(tx: DbClient, payload: PartWriteInput): Promise<{ id: string }> {
  const row = await tx.part.create({
    data: {
      ...payload,
      currentQty: 0,
    },
  });

  return { id: row.id };
}

export async function createPart(payload: PartWriteInput): Promise<{ id: string }> {
  return prisma.$transaction((tx) => createPartTx(tx, payload));
}

/**
 * Updates master attributes only. `currentQty` is not accepted here — stock changes
 * only through the inventory ledger (receive + usage).
 */
export async function updatePartTx(tx: DbClient, partId: string, payload: PartWriteInput): Promise<void> {
  await tx.part.update({
    where: { id: partId },
    data: payload,
  });
}

export async function updatePart(partId: string, payload: PartWriteInput): Promise<void> {
  return prisma.$transaction((tx) => updatePartTx(tx, partId, payload));
}

export async function deletePartTx(tx: DbClient, partId: string): Promise<void> {
  await tx.part.delete({ where: { id: partId } });
}

/**
 * Deletes a part only if it was never stocked or referenced — **inventory logs are never
 * deleted**, so any ledger row blocks removal.
 */
export async function deletePart(partId: string): Promise<void> {
  const [orders, usageLines, ledgerRows] = await Promise.all([
    prisma.orderLine.count({ where: { partId } }),
    prisma.usageHistoryLine.count({ where: { partId } }),
    prisma.inventoryLog.count({ where: { partId } }),
  ]);

  if (orders + usageLines > 0) {
    throw new ActionError("注文または出庫で利用されている部品は削除できません");
  }
  if (ledgerRows > 0) {
    throw new ActionError("在庫履歴がある部品は削除できません（履歴は変更しません）");
  }

  await prisma.$transaction((tx) => deletePartTx(tx, partId));
}

export async function findPartById(id: string) {
  return prisma.part.findUnique({ where: { id } });
}

/** Parts master list with optional server-side name/part-no search. */
export async function listPartsForMasterPage(params: { query?: string; take?: number }) {
  const take = params.take ?? 250;
  const trimmed = params.query?.trim() ?? "";

  const where: Prisma.PartWhereInput | undefined =
    trimmed.length > 0
      ? {
          OR: [
            { name: { contains: trimmed, mode: searchMode } },
            { oemPartNo: { contains: trimmed, mode: searchMode } },
            { aftermarketNo: { contains: trimmed, mode: searchMode } },
            { compatibleModels: { contains: trimmed, mode: searchMode } },
          ],
        }
      : undefined;

  return prisma.part.findMany({
    where,
    orderBy: { name: "asc" },
    take,
  });
}

/** Lightweight rows for order-line pickers and outgoing forms. */
export async function listPartsForStockPickers(take = 1200) {
  return prisma.part.findMany({
    orderBy: { name: "asc" },
    take,
    select: { id: true, name: true, currentQty: true },
  });
}

/** Full rows for append-line dropdowns that need list prices, etc. */
export async function listPartsAlphabetical(take = 3000) {
  return prisma.part.findMany({ orderBy: { name: "asc" }, take });
}
