import Link from "next/link";

import {
  InventoryLogDataTable,
  type InventoryLogRow,
} from "@/components/inventory/inventory-log-data-table";
import {
  InventoryStockDataTable,
  type InventoryStockRow,
} from "@/components/inventory/inventory-stock-data-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jpDateLabel } from "@/lib/utils";
import { inventoryLogLabel } from "@/lib/labels";
import { listInventoryLogs, listPartsStock } from "@/server/services/inventory.service";

type SearchShape = Record<string, string | string[] | undefined>;

export default async function InventoryLedgerPage(props: {
  searchParams: Promise<SearchShape>;
}) {
  const params = await props.searchParams;
  const qRaw = typeof params.q === "string" ? params.q : "";

  const [movements, parts] = await Promise.all([
    listInventoryLogs({ query: qRaw, take: 200 }),
    listPartsStock({ query: qRaw, take: 300 }),
  ]);

  const stockRows: InventoryStockRow[] = parts.map((p) => ({
    id: p.id,
    name: p.name,
    partNos: [p.oemPartNo, p.aftermarketNo].filter(Boolean).join(" / ") || "—",
    qty: p.currentQty,
  }));

  const logRows: InventoryLogRow[] = movements.map((m) => ({
    id: m.id,
    occurredAtSort: m.occurredAt.toISOString(),
    occurredDisplay: jpDateLabel(m.occurredAt),
    typeLabel: inventoryLogLabel[m.logType],
    partName: m.part.name,
    partHref: `/dashboard/parts/${m.partId}`,
    partLedgerHref: `/dashboard/parts/${m.partId}/ledger`,
    quantity: m.quantity,
    note: m.note ?? "",
  }));

  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <DashboardHeader
        title="在庫・履歴"
        description="在庫一覧の「入出庫履歴」から部品別の履歴へ。一覧の部品行は編集または部品専用の入出庫一覧にリンクします。"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/parts">部品マスタへ</Link>
          </Button>
        }
      />
      <MotionFade className="flex flex-1 flex-col gap-12 px-5 py-8 sm:px-8">
        <form className="flex flex-wrap gap-2" action="/dashboard/inventory" method="get">
          <Input
            name="q"
            placeholder="品名・品番・メモなど（サーバー検索）"
            defaultValue={qRaw}
            className="h-11 max-w-full border-border bg-background shadow-inner shadow-indigo-100/35 sm:w-[min(560px,100%)]"
          />
          <Button type="submit" variant="outline" size="sm" className="h-11">
            検索適用
          </Button>
        </form>

        <section className="space-y-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">在庫一覧（検索一致）</h2>
          <InventoryStockDataTable data={stockRows} />
        </section>

        <section className="space-y-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">入出庫仕訳（最新200）</h2>
          <InventoryLogDataTable data={logRows} />
        </section>
      </MotionFade>
    </div>
  );
}
