import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { deleteSupplierAction } from "@/features/suppliers/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSuppliersAlphabetical } from "@/server/services/suppliers.service";

export default async function SuppliersPage() {
  const rows = await listSuppliersAlphabetical();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader
        title="仕入先マスタ"
        description="注文ヘッダで選択して、発注先・担当・FAX などを転記できます。"
        actions={
          <Button size="sm" asChild>
            <Link href="/dashboard/suppliers/new">新規登録</Link>
          </Button>
        }
      />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <Table containerClassName="border-muted max-w-4xl">
          <TableHeader>
            <TableRow>
              <TableHead>社名</TableHead>
              <TableHead>担当</TableHead>
              <TableHead>FAX</TableHead>
              <TableHead className="w-40">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  まだ登録がありません。
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.companyName}</TableCell>
                  <TableCell>{r.attn ?? "—"}</TableCell>
                  <TableCell>{r.fax ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/suppliers/${r.id}/edit`}>編集</Link>
                      </Button>
                      <form action={deleteSupplierAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          削除
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/orders">
          ← 注文・入荷へ
        </Link>
      </MotionFade>
    </div>
  );
}
