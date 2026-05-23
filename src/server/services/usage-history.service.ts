import { listCustomersAlphabetical } from "@/server/services/customers.service";
import { listMachinesForOutgoing } from "@/server/services/machines.service";
import { listPartsForStockPickers } from "@/server/services/parts.service";

import type { DbClient } from "@/server/db/types";
import { applyStockDelta } from "@/server/inventory/stock-delta";

import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

/**
 * Usage (出庫) decreases stock: `USAGE_OUT` ledger + `Part.currentQty`.
 * Lines with `kind: "adHoc"` create a minimal master row (`isAdHoc`) and may drive `currentQty` negative.
 */

export type OutgoingLineInput =
  | { kind: "master"; partId: string; quantity: number }
  | {
      kind: "adHoc";
      quantity: number;
      itemName: string;
      partNo?: string;
      machineModel?: string;
      machineUnitNo?: string;
      machineEngineNo?: string;
    };

type ResolvedLine = { partId: string; quantity: number; allowNegative: boolean };

export type CreateUsageSlipPayload = {
  issueDate?: Date | null;
  customerId?: string;
  machineId?: string;
  memo?: string;
  lines: OutgoingLineInput[];
};

async function resolveLines(tx: DbClient, lines: OutgoingLineInput[]): Promise<ResolvedLine[]> {
  const resolved: ResolvedLine[] = [];
  for (const line of lines) {
    if (line.kind === "master") {
      const part = await tx.part.findUnique({ where: { id: line.partId } });
      if (!part) throw new ActionError("部品が存在しません");
      resolved.push({ partId: line.partId, quantity: line.quantity, allowNegative: false });
      continue;
    }

    const name = line.itemName.trim();
    if (!name) throw new ActionError("品名を入力してください");

    const compat = [line.machineModel, line.machineUnitNo, line.machineEngineNo]
      .filter((s) => s && s.trim())
      .join(" / ");

    const part = await tx.part.create({
      data: {
        name: name,
        oemPartNo: line.partNo?.trim() || undefined,
        compatibleModels: compat.length ? compat : undefined,
        currentQty: 0,
        isAdHoc: true,
      },
    });

    resolved.push({ partId: part.id, quantity: line.quantity, allowNegative: true });
  }
  return resolved;
}

function aggregateByPart(resolved: ResolvedLine[]): Map<string, { total: number; allowNegative: boolean }> {
  const totals = new Map<string, { total: number; allowNegative: boolean }>();
  for (const line of resolved) {
    const cur = totals.get(line.partId);
    if (!cur) {
      totals.set(line.partId, { total: line.quantity, allowNegative: line.allowNegative });
    } else {
      cur.total += line.quantity;
      cur.allowNegative = cur.allowNegative && line.allowNegative;
    }
  }
  return totals;
}

export async function createUsageSlipTx(tx: DbClient, payload: CreateUsageSlipPayload): Promise<{ id: string }> {
  const resolved = await resolveLines(tx, payload.lines);
  const need = aggregateByPart(resolved);

  const slip = await tx.usageHistory.create({
    data: {
      issueDate: payload.issueDate ?? new Date(),
      customerId: payload.customerId?.trim() ? payload.customerId : undefined,
      machineId: payload.machineId?.trim() ? payload.machineId : undefined,
      memo: payload.memo?.trim() ? payload.memo.trim() : undefined,
    },
  });

  for (const line of resolved) {
    const created = await tx.usageHistoryLine.create({
      data: {
        usageHistoryId: slip.id,
        partId: line.partId,
        quantity: line.quantity,
      },
    });

    await tx.inventoryLog.create({
      data: {
        partId: line.partId,
        logType: "USAGE_OUT",
        quantity: -line.quantity,
        usageLineId: created.id,
      },
    });
  }

  for (const [partId, agg] of need.entries()) {
    await applyStockDelta(tx, partId, -agg.total, { allowNegative: agg.allowNegative });
  }

  return { id: slip.id };
}

export async function createUsageSlip(payload: CreateUsageSlipPayload): Promise<{ id: string }> {
  return prisma.$transaction((tx) => createUsageSlipTx(tx, payload));
}

export async function getOutgoingIssueFormData() {
  const [customers, machines, parts] = await Promise.all([
    listCustomersAlphabetical(),
    listMachinesForOutgoing(),
    listPartsForStockPickers(),
  ]);

  return { customers, machines, parts };
}

export async function listUsageHistoriesForDashboard(take = 250) {
  return prisma.usageHistory.findMany({
    orderBy: { issueDate: "desc" },
    take,
    include: {
      customer: true,
      machine: true,
      lines: { include: { part: true }, orderBy: { createdAt: "asc" as const } },
    },
  });
}

export async function getUsageSlipById(id: string) {
  return prisma.usageHistory.findUnique({
    where: { id },
    include: {
      customer: true,
      machine: true,
      lines: { include: { part: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateUsageSlipMemo(input: { id: string; memo: string | null }): Promise<void> {
  const row = await prisma.usageHistory.findUnique({ where: { id: input.id } });
  if (!row) throw new ActionError("出庫伝票が見つかりません");

  await prisma.usageHistory.update({
    where: { id: input.id },
    data: { memo: input.memo },
  });
}
