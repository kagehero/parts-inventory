import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type DashboardKpis = {
  parts: number;
  qty: number;
  openOrders: number;
  movesToday: number;
  stockDisplay: string;
};

/** Aggregates for the home dashboard (single round-trip block). */
export async function getDashboardKpis(): Promise<DashboardKpis> {
  const [partsCount, qtyAgg, openOrders, movesToday] = await Promise.all([
    prisma.part.count(),
    prisma.part.aggregate({ _sum: { currentQty: true } }),
    prisma.order.count({
      where: { status: { in: ["OPEN", "PARTIALLY_RECEIVED"] } },
    }),
    prisma.inventoryLog.count({
      where: {
        occurredAt: {
          gte: new Date(new Date().toDateString()),
        },
      },
    }),
  ]);

  const rows =
    qtyAgg._sum?.currentQty && qtyAgg._sum.currentQty > 0
      ? await prisma.part.findMany({
          where: { currentQty: { gt: 0 } },
          select: { purchasePrice: true, currentQty: true },
        })
      : [];

  const stockValueApprox = rows.reduce((acc, row) => {
    if (!row.purchasePrice) return acc;
    return acc.plus(row.purchasePrice.mul(row.currentQty));
  }, new Prisma.Decimal(0));

  const stockDisplay = rows.length
    ? new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0,
      }).format(stockValueApprox.toNumber())
    : "評価可能なデータがありません（仕入価格が未入力の為）";

  return {
    parts: partsCount,
    qty: qtyAgg._sum.currentQty ?? 0,
    openOrders,
    movesToday,
    stockDisplay,
  };
}
