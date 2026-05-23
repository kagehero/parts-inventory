import Link from "next/link";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  OrdersDataTable,
  type OrderTableRow,
} from "@/components/orders/orders-data-table";
import { Button } from "@/components/ui/button";
import { orderStatusLabel, orderDocumentTypeLabel } from "@/lib/labels";
import { listOrdersForDashboard } from "@/server/services/orders.service";

export default async function OrdersPage() {
  const orders = await listOrdersForDashboard();

  const rows: OrderTableRow[] = orders.map((order) => ({
    id: order.id,
    sortKey: order.orderDate.toISOString(),
    statusLabel: orderStatusLabel[order.status],
    docLabel: orderDocumentTypeLabel[order.documentType],
    supplier: order.supplierName ?? "—",
    lines: order._count.lines,
  }));

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title="注文・入荷"
        description="未完の調達〜入荷まわりの進捗。一覧は状態・発注先で素早く探せます。"
        actions={
          <Button size="sm" className="shadow-inner shadow-white/70" asChild>
            <Link href="/dashboard/orders/new">新規注文</Link>
          </Button>
        }
      />

      <DashboardContent className="gap-6">
        <OrdersDataTable data={rows} />
      </DashboardContent>
    </DashboardPageFrame>
  );
}
