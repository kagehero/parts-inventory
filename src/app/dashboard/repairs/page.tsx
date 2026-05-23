import Link from "next/link";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  RepairsDataTable,
  type RepairTableRow,
} from "@/components/repairs/repairs-data-table";
import { jpDateLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMachineWithCustomer } from "@/server/services/machines.service";
import { listRepairHistories } from "@/server/services/repairs.service";

type SearchShape = Record<string, string | string[] | undefined>;

function machineLabel(row: Awaited<ReturnType<typeof listRepairHistories>>[number]): string {
  const m = row.machine;
  if (!m) return "—";
  return `${m.customer.name} / ${m.modelName} / ${m.unitNo}`;
}

export default async function RepairsPage(props: { searchParams: Promise<SearchShape> }) {
  const params = await props.searchParams;
  const machineIdFilter = typeof params.machineId === "string" ? params.machineId.trim() : undefined;

  const [records, filterMachine] = await Promise.all([
    listRepairHistories({ machineId: machineIdFilter, take: 250 }),
    machineIdFilter ? getMachineWithCustomer(machineIdFilter) : null,
  ]);

  const rows: RepairTableRow[] = records.map((r) => ({
    id: r.id,
    repairDateSort: r.repairDate.toISOString(),
    repairDateDisplay: jpDateLabel(r.repairDate),
    title: r.title,
    fileName: r.fileName,
    machineLabel: machineLabel(r),
    machineId: r.machineId,
  }));

  const filterBanner =
    machineIdFilter && filterMachine ? (
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <span>
          保有機で絞り込み中:
          <span className="ml-1 font-medium text-foreground">
            {filterMachine.customer.name} / {filterMachine.modelName} / {filterMachine.unitNo}
          </span>
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/machines/${filterMachine.id}`}>保有機ページ</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/repairs">解除</Link>
        </Button>
      </p>
    ) : machineIdFilter && !filterMachine ? (
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-destructive">
        指定の保有機が見つかりません。
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/repairs">一覧へ</Link>
        </Button>
      </p>
    ) : null;

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title="修理履歴"
        description="PDF をファイルとして保管します。保有機に紐づけると一覧・検索しやすくなります。"
        actions={
          <Button size="sm" className="shadow-inner shadow-white/65" asChild>
            <Link href="/dashboard/repairs/new">PDF アップロード</Link>
          </Button>
        }
      />

      <DashboardContent>
        {filterBanner}
        <RepairsDataTable data={rows} />

        {!rows.length ? (
          <p className="text-[13px] text-muted-foreground">
            {machineIdFilter ? "この保有機に紐づく修理履歴はまだありません。" : "データがありません。PDF を追加してください。"}
          </p>
        ) : null}
      </DashboardContent>
    </DashboardPageFrame>
  );
}
