import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  MachineScopedRepairsDataTable,
  type RepairMachineScopedRow,
} from "@/components/repairs/repairs-data-table";
import { Button } from "@/components/ui/button";
import { jpDateLabel } from "@/lib/utils";
import { getMachineWithCustomer } from "@/server/services/machines.service";
import { listRepairHistories } from "@/server/services/repairs.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MachineDetailPage(props: Props) {
  const { id } = await props.params;

  const machine = await getMachineWithCustomer(id);

  if (!machine) notFound();

  const repairs = await listRepairHistories({ machineId: id, take: 500 });

  const repairRows: RepairMachineScopedRow[] = repairs.map((r) => ({
    id: r.id,
    repairDateSort: r.repairDate.toISOString(),
    repairDateDisplay: jpDateLabel(r.repairDate),
    title: r.title,
    fileName: r.fileName,
  }));

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title={`保有機：${machine.modelName} / ${machine.unitNo}`}
        description={`${machine.customer.name}（${machine.customer.municipality}）の修理伝票PDFを一覧します。`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={`/dashboard/repairs/new?machineId=${machine.id}`}>修理PDFを登録</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/repairs?machineId=${machine.id}`}>全画面一覧へ</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/machines">保有機一覧へ</Link>
            </Button>
          </div>
        }
      />

      <DashboardContent className="gap-8">
        <section className="rounded-lg border border-border/80 bg-card/30 px-4 py-4 shadow-sm sm:px-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">機械情報</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">顧客</dt>
              <dd className="font-medium">
                <Link className="text-primary underline-offset-4 hover:underline" href={`/dashboard/customers/${machine.customerId}`}>
                  {machine.customer.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">所在地</dt>
              <dd>{machine.customer.municipality}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">エンジンNo</dt>
              <dd className="tabular-nums">{machine.engineNo?.trim() ? machine.engineNo : "—"}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">修理履歴</h2>
          <p className="mb-4 max-w-2xl text-[13px] text-muted-foreground">
            修理日・タイトル・PDFを紐づけて管理します。アップロード時にこの保有機を選ぶと、ここに表示されます。
          </p>
          <MachineScopedRepairsDataTable data={repairRows} />
        </section>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
