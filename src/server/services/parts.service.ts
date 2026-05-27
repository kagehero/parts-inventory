import type { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/types";
import { applyStockDelta } from "@/server/inventory/stock-delta";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

const searchMode = "insensitive" as const;

const partOrderBy = [{ sortOrder: "asc" as const }, { name: "asc" as const }];

export type PartPickerRow = {
  id: string;
  name: string;
  currentQty: number;
  oemPartNo: string | null;
  aftermarketNo: string | null;
};

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

function buildPartSearchWhere(query?: string): Prisma.PartWhereInput | undefined {
  const trimmed = query?.trim() ?? "";
  if (!trimmed) return undefined;
  return {
    OR: [
      { name: { contains: trimmed, mode: searchMode } },
      { oemPartNo: { contains: trimmed, mode: searchMode } },
      { aftermarketNo: { contains: trimmed, mode: searchMode } },
      { compatibleModels: { contains: trimmed, mode: searchMode } },
    ],
  };
}

async function nextPartSortOrder(tx: DbClient): Promise<number> {
  const agg = await tx.part.aggregate({ _max: { sortOrder: true } });
  return (agg._max.sortOrder ?? -1) + 1;
}

/**
 * Creates a SKU with **zero** stock. Stock increases only via purchase receipt
 * (`PURCHASE_IN` logs); see `orders.service`.
 */
export async function createPartTx(tx: DbClient, payload: PartWriteInput): Promise<{ id: string }> {
  const sortOrder = await nextPartSortOrder(tx);
  const row = await tx.part.create({
    data: {
      ...payload,
      currentQty: 0,
      sortOrder,
    },
  });

  return { id: row.id };
}

export async function createPart(payload: PartWriteInput): Promise<{ id: string }> {
  return prisma.$transaction((tx) => createPartTx(tx, payload));
}

/**
 * Updates master attributes only. `currentQty` is not accepted here — stock changes
 * only through the inventory ledger (receive + usage + adjustment).
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

export async function getPartPickerRow(partId: string): Promise<PartPickerRow | null> {
  return prisma.part.findUnique({
    where: { id: partId },
    select: {
      id: true,
      name: true,
      currentQty: true,
      oemPartNo: true,
      aftermarketNo: true,
    },
  });
}

/** Server-side search for shared part picker (注文・出庫). */
export async function searchPartsForPicker(params: { query?: string; take?: number } = {}) {
  const take = params.take ?? 40;
  return prisma.part.findMany({
    where: buildPartSearchWhere(params.query),
    orderBy: partOrderBy,
    take,
    select: {
      id: true,
      name: true,
      currentQty: true,
      oemPartNo: true,
      aftermarketNo: true,
    },
  });
}

/** Parts master list with optional server-side name/part-no search. */
export async function listPartsForMasterPage(params: { query?: string; take?: number }) {
  const take = params.take ?? 250;
  return prisma.part.findMany({
    where: buildPartSearchWhere(params.query),
    orderBy: partOrderBy,
    take,
  });
}

/** Lightweight rows for legacy pickers — prefer searchPartsForPicker. */
export async function listPartsForStockPickers(take = 1200) {
  return prisma.part.findMany({
    orderBy: partOrderBy,
    take,
    select: { id: true, name: true, currentQty: true },
  });
}

/** Full rows — ordered by sortOrder. */
export async function listPartsAlphabetical(take = 3000) {
  return prisma.part.findMany({ orderBy: partOrderBy, take });
}

/** Persist drag-and-drop order from parts master UI. */
export async function reorderParts(orderedIds: string[]): Promise<void> {
  const unique = [...new Set(orderedIds)];
  if (unique.length !== orderedIds.length) {
    throw new ActionError("並べ替えデータが不正です");
  }

  await prisma.$transaction(async (tx) => {
    const count = await tx.part.count({ where: { id: { in: unique } } });
    if (count !== unique.length) {
      throw new ActionError("存在しない部品が含まれています");
    }

    await Promise.all(
      unique.map((id, index) =>
        tx.part.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  });
}

/** Manual stock correction — writes ADJUSTMENT ledger row. */
export async function adjustPartStock(input: {
  partId: string;
  delta: number;
  note?: string | null;
}): Promise<void> {
  if (input.delta === 0) {
    throw new ActionError("増減量は0以外にしてください");
  }

  await prisma.$transaction(async (tx) => {
    const part = await tx.part.findUnique({ where: { id: input.partId } });
    if (!part) throw new ActionError("部品が見つかりません");

    await tx.inventoryLog.create({
      data: {
        partId: input.partId,
        logType: "ADJUSTMENT",
        quantity: input.delta,
        note: input.note?.trim() || null,
      },
    });

    await applyStockDelta(tx, input.partId, input.delta, { allowNegative: true });
  });
}
