import Link from "next/link";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { OrdersDataTable, type OrderTableRow } from "@/components/orders/orders-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderStatusLabel, orderDocumentTypeLabel } from "@/lib/labels";
import { listOrdersForDashboard } from "@/server/services/orders.service";

type SearchShape = Record<string, string | string[] | undefined>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchShape> }) {
  const params = await searchParams;
  const contactRaw = typeof params.contact === "string" ? params.contact : "";
  const orders = await listOrdersForDashboard({ contact: contactRaw });

  const rows: OrderTableRow[] = orders.map((order) => ({
    id: order.id,
    sortKey: order.orderDate.toISOString(),
    statusLabel: orderStatusLabel[order.status],
    docLabel: orderDocumentTypeLabel[order.documentType],
    supplier: order.supplierName ?? "—",
    contactName: order.contactName ?? "—",
    lines: order._count.lines,
  }));

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title="注文・入荷"
        description="未完の調達〜入荷まわりの進捗。担当者名の表示・絞り込みに対応しています。"
        actions={
          <Button size="sm" className="shadow-inner shadow-white/70" asChild>
            <Link href="/dashboard/orders/new">新規注文</Link>
          </Button>
        }
      />

      <DashboardContent className="gap-6">
        <form className="flex flex-wrap gap-2" action="/dashboard/orders" method="get">
          <Input
            name="contact"
            placeholder="注文担当者名で絞り込み"
            defaultValue={contactRaw}
            className="h-11 max-w-full border-border bg-background shadow-inner shadow-indigo-100/30 sm:w-[min(320px,100%)]"
          />
          <Button type="submit" variant="outline" size="sm" className="h-11">
            担当者で検索
          </Button>
          {contactRaw.trim() ? (
            <Button variant="ghost" size="sm" className="h-11" asChild>
              <Link href="/dashboard/orders">絞り込み解除</Link>
            </Button>
          ) : null}
        </form>

        <OrdersDataTable data={rows} />
      </DashboardContent>
    </DashboardPageFrame>
  );
}
