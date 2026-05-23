import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  DashboardContent,
  DashboardPageFrame,
} from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { inventoryLogLabel } from "@/lib/labels";
import { jpDateLabel } from "@/lib/utils";
import { findPartById } from "@/server/services/parts.service";
import { listInventoryLogsForPart } from "@/server/services/inventory.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function PartLedgerPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;
  const part = await findPartById(id);
  if (!part) notFound();

  const logs = await listInventoryLogsForPart(id);

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader
        title="入出庫履歴"
        description={`部品「${part.name}」のみを表示`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/parts/${part.id}`}>部品の編集</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/inventory">在庫・履歴トップへ</Link>
            </Button>
          </div>
        }
      />
      <DashboardContent className="px-5 py-6 sm:px-8">
        <p className="mb-6 text-xs text-muted-foreground">
          仕訳一覧で重複した行に見えても、入庫／出庫のたびに1行ずつ計上されています。出庫（使用）では日付・行き先（顧客）・伝票メモへ進めます。
        </p>
        <Table containerClassName="border-muted">
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>区分</TableHead>
              <TableHead className="text-right">増減</TableHead>
              <TableHead>相手／内容</TableHead>
              <TableHead>伝票へ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  この部品の入出庫履歴はまだありません。
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const qty = log.quantity;
                const qtyLabel = qty >= 0 ? `+${qty}` : `${qty}`;
                let counterparty = "—";
                let slipCell: ReactNode = "—";

                if (log.logType === "USAGE_OUT" && log.usageHistoryLine) {
                  const sh = log.usageHistoryLine.usageHistory;
                  counterparty =
                    sh.customer != null ? `${sh.customer.name}（${sh.customer.municipality}）` : "無記名";
                  slipCell = (
                    <Link
                      href={`/dashboard/outgoing/${sh.id}#memo`}
                      className="text-primary underline"
                    >
                      メモ入力
                    </Link>
                  );
                } else if (log.logType === "PURCHASE_IN" && log.orderLine?.order) {
                  const od = log.orderLine.order;
                  counterparty = od.supplierName?.trim() || "発注先入庫";
                  slipCell = (
                    <Link href={`/dashboard/orders/${od.id}`} className="text-primary underline">
                      注文を開く
                    </Link>
                  );
                } else if (log.logType === "ADJUSTMENT") {
                  counterparty = log.note?.trim() || "調整・棚卸";
                  slipCell = "—";
                }

                return (
                  <TableRow key={log.id}>
                    <TableCell>{jpDateLabel(log.occurredAt)}</TableCell>
                    <TableCell>{inventoryLogLabel[log.logType]}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{qtyLabel}</TableCell>
                    <TableCell className="max-w-[min(360px,40vw)] text-sm">{counterparty}</TableCell>
                    <TableCell>{slipCell}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
