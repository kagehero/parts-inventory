"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { StockAdjustForm } from "@/components/parts/stock-adjust-form";
import { DataTable } from "@/components/data-table/data-table";

export type InventoryStockRow = {
  id: string;
  name: string;
  partNos: string;
  qty: number;
};

const columns: ColumnDef<InventoryStockRow>[] = [
  {
    accessorKey: "name",
    header: "部品",
    cell: ({ row }) => {
      const pid = row.original.id;
      return (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href={`/dashboard/parts/${pid}`}
            className="font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline"
          >
            {row.original.name}
          </Link>
          <Link
            href={`/dashboard/parts/${pid}/ledger`}
            className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/[0.06] px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/[0.12] transition-colors"
          >
            入出庫履歴 →
          </Link>
        </div>
      );
    },
  },
  { accessorKey: "partNos", header: "品番（純正 / 社外）" },
  {
    accessorKey: "qty",
    header: "現在庫",
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.qty}</span>,
  },
  {
    id: "adjust",
    header: "在庫調整",
    cell: ({ row }) => (
      <StockAdjustForm
        partId={row.original.id}
        partName={row.original.name}
        currentQty={row.original.qty}
        compact
      />
    ),
  },
];

export function InventoryStockDataTable({ data }: { data: InventoryStockRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterPlaceholder="部品・品番で絞り込み…（サーバー検索済み一覧内）"
      emptyLabel="在庫データがありません。"
    />
  );
}
