import Link from "next/link";
import { notFound } from "next/navigation";

import { OutgoingMemoEditor } from "@/components/outgoing/outgoing-memo-editor";
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
import { jpDateLabel } from "@/lib/utils";
import { getUsageSlipById } from "@/server/services/usage-history.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function OutgoingDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;
  const slip = await getUsageSlipById(id);
  if (!slip) notFound();

  const customerLine = slip.customer
    ? `${slip.customer.name}（${slip.customer.municipality}）`
    : "無記名";
  const machineLine =
    slip.machine && slip.machine.modelName
      ? `${slip.machine.modelName}／号機 ${slip.machine.unitNo}${slip.machine.engineNo ? `／${slip.machine.engineNo}` : ""}`
      : "—";

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title="出庫伝票詳細"
        description={`伝票日 ${jpDateLabel(slip.issueDate)}`}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/outgoing">← 一覧</Link>
          </Button>
        }
      />

      <DashboardContent className="gap-8 px-5 py-6 sm:px-8">
        <div className="grid gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">行き先／顧客</span> {customerLine}
          </p>
          <p>
            <span className="text-muted-foreground">保有機</span> {machineLine}
          </p>
        </div>

        <OutgoingMemoEditor slipId={slip.id} memo={slip.memo} />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">明細</h2>
          <Table containerClassName="border-muted">
            <TableHeader>
              <TableRow>
                <TableHead>部品名</TableHead>
                <TableHead className="text-right">数量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slip.lines.map((ln) => (
                <TableRow key={ln.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/parts/${ln.partId}`} className="text-primary underline">
                      {ln.part.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{ln.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
