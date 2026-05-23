import Link from "next/link";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  MachinesDataTable,
  MachineCreateDialog,
  type MachineTableRow,
} from "@/components/machines/machines-data-table";
import { Button } from "@/components/ui/button";
import { listCustomersAlphabetical } from "@/server/services/customers.service";
import { listMachinesWithCustomersForDashboard } from "@/server/services/machines.service";

export default async function MachinesPage() {
  const [customers, machines] = await Promise.all([
    listCustomersAlphabetical(600),
    listMachinesWithCustomersForDashboard(),
  ]);

  const tableRows: MachineTableRow[] = machines.map((m) => ({
    id: m.id,
    customerName: m.customer.name,
    municipality: m.customer.municipality,
    modelName: m.modelName,
    unitNo: m.unitNo,
    engineNo: m.engineNo ?? "—",
  }));

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title="保有機"
        description="全顧客の保有機一覧。テーブルをソート・検索できます。重複しないよう型式／号機の組み合わせが制約されています。"
        actions={
          <div className="flex flex-wrap gap-2">
            <MachineCreateDialog customers={customers} />
            <Button variant="outline" size="sm" asChild className="shadow-inner shadow-indigo-100/35">
              <Link href="/dashboard/customers">顧客マスタへ</Link>
            </Button>
          </div>
        }
      />

      <DashboardContent className="gap-6">
        <MachinesDataTable data={tableRows} />
      </DashboardContent>
    </DashboardPageFrame>
  );
}
