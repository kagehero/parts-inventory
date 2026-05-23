import type { DbClient } from "@/server/db/types";

import { ActionError } from "@/lib/server/action-guard";

/**
 * Inventory model (authoritative rules)
 * -------------------------------------
 * - On-hand quantity is NOT edited on the part master screen. It is derived from the
 *   append-only `inventory_logs` ledger:
 *
 *       onHand == sum(InventoryLog.quantity) for that part
 *
 * - Increases (incoming) are written only when purchase orders are **received**
 *   (`logType: PURCHASE_IN`, positive `quantity`), in the same DB transaction as the
 *   receipt line update (see `orders.service` → `receiveOrderLineTx`).
 *
 * - Decreases (outgoing) are written only from **usage** (出庫) slips
 *   (`logType: USAGE_OUT`, negative `quantity`), in the same transaction as stock update
 *   (see `usage-history.service` → `createUsageSlipTx`).
 *
 * - `Part.currentQty` is a cached sum updated in those transactions for fast reads;
 *   it must stay equal to the ledger sum. Application code must change it only via
 *   `applyStockDelta` together with creating the corresponding log row — never by
 *   arbitrary part updates.
 *
 * - Ledger rows are immutable in normal operation: we do not delete or rewrite them;
 *   parts with any ledger history cannot be deleted (see `parts.service` → `deletePart`).
 *
 * - Negative stock is forbidden by default. Outbound lines created as **ad-hoc** parts may pass
 *   `{ allowNegative: true }` so usage can be recorded when goods were never booked in (伝票未到着).
 */
export async function applyStockDelta(
  tx: DbClient,
  partId: string,
  delta: number,
  opts?: { allowNegative?: boolean },
): Promise<void> {
  if (delta === 0) return;

  if (delta > 0) {
    await tx.part.update({
      where: { id: partId },
      data: { currentQty: { increment: delta } },
    });
    return;
  }

  const need = -delta;
  if (opts?.allowNegative) {
    await tx.part.update({
      where: { id: partId },
      data: { currentQty: { decrement: need } },
    });
    return;
  }

  const { count } = await tx.part.updateMany({
    where: { id: partId, currentQty: { gte: need } },
    data: { currentQty: { decrement: need } },
  });

  if (count === 0) {
    const part = await tx.part.findUnique({
      where: { id: partId },
      select: { name: true, currentQty: true },
    });
    const label = part?.name ?? "部品";
    const onHand = part?.currentQty ?? 0;
    throw new ActionError(`在庫不足: ${label}（現在 ${onHand}）`);
  }
}

/**
 * Rebuilds `currentQty` from the ledger sum (e.g. after manual DB repair).
 * Not used in normal request flows; prefer fixing data and running this from a one-off script.
 */
export async function syncPartQtyFromLedger(tx: DbClient, partId: string): Promise<void> {
  const agg = await tx.inventoryLog.aggregate({
    where: { partId },
    _sum: { quantity: true },
  });
  const sum = agg._sum.quantity ?? 0;
  await tx.part.update({
    where: { id: partId },
    data: { currentQty: sum },
  });
}
