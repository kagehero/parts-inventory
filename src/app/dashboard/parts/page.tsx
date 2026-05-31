import Link from "next/link";

import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PartCreateDialog } from "@/components/parts/part-create-dialog";
import { PartsDataTable, type PartsTableRow } from "@/components/parts/parts-data-table";
import { PartsReorderTable } from "@/components/parts/parts-reorder-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { yen } from "@/lib/utils";
import { listPartsForMasterPage } from "@/server/services/parts.service";

type SearchShape = Record<string, string | string[] | undefined>;

export default async function PartsPage({ searchParams }: { searchParams: Promise<SearchShape> }) {
  const params = await searchParams;
  const qRaw = typeof params.q === "string" ? params.q : "";
  const searching = qRaw.trim().length > 0;
  const parts = await listPartsForMasterPage({ query: qRaw, take: searching ? 250 : 5000 });

  const rows: PartsTableRow[] = parts.map((part) => ({
    id: part.id,
    name: part.name,
    oemPartNo: part.oemPartNo ?? "—",
    aftermarketNo: part.aftermarketNo ?? "—",
    salePriceDisplay: yen(part.salePrice),
    currentQty: part.currentQty,
  }));

  return (
    <DashboardPageFrame>
      <DashboardHeader
        title="部品マスタ"
        description={
          searching
            ? "検索結果の一覧です。並べ替えは検索をクリアした状態で行ってください。"
            : "品番・単価・現在庫と履歴ログを統合運用できます。一覧はドラッグで並べ替え可能です。"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <PartCreateDialog>
              <Button size="sm" className="shadow-inner shadow-white/70">
                新規登録
              </Button>
            </PartCreateDialog>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/parts/new">全画面フォームへ</Link>
            </Button>
          </div>
        }
      />
      <DashboardContent>
        <form className="flex flex-wrap gap-2" action="/dashboard/parts" method="get">
          <Input
            name="q"
            placeholder="サーバー側で品名／型式／品番を検索"
            defaultValue={qRaw}
            className="h-11 max-w-full border-border bg-background shadow-inner shadow-indigo-100/30 sm:w-[min(560px,100%)]"
          />
          <Button type="submit" variant="outline" size="sm" className="h-11">
            適用
          </Button>
          {searching ? (
            <Button variant="ghost" size="sm" className="h-11" asChild>
              <Link href="/dashboard/parts">検索クリア</Link>
            </Button>
          ) : null}
        </form>

        {searching ? <PartsDataTable data={rows} /> : <PartsReorderTable data={rows} />}
      </DashboardContent>
    </DashboardPageFrame>
  );
}
