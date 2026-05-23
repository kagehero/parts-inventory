import Link from "next/link";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { RepairPdfForm, type RepairMachineOption } from "@/components/repairs/repair-pdf-form";
import { listMachinesForRepairPdfSelect } from "@/server/services/machines.service";

type SearchShape = Record<string, string | string[] | undefined>;

export default async function RepairNewPage(props: { searchParams: Promise<SearchShape> }) {
  const params = await props.searchParams;
  const preRaw = typeof params.machineId === "string" ? params.machineId : undefined;

  const machineRows = await listMachinesForRepairPdfSelect();

  const machines: RepairMachineOption[] = machineRows.map((m) => ({
    id: m.id,
    label: `${m.customer.name} / ${m.modelName} / ${m.unitNo}`,
  }));

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader
        title="修理履歴（PDF登録）"
        description="保有機を選ぶと、その機械からも履歴を追いやすくなります（任意）。"
      />
      <DashboardContent className="gap-6 px-8 py-6">
        <RepairPdfForm machines={machines} initialMachineId={preRaw} />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/repairs">
          一覧へ戻る
        </Link>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
