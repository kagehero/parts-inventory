"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";

export type OrderTableRow = {
  id: string;
  sortKey: string;
  statusLabel: string;
  docLabel: string;
  supplier: string;
  lines: number;
};

const columns: ColumnDef<OrderTableRow>[] = [
  {
    accessorKey: "sortKey",
    header: "注文日",
    sortingFn: "basic",
    cell: ({ row }) => <span className="tabular-nums text-[13px]">{row.original.sortKey.slice(0, 10)}</span>,
  },
  { accessorKey: "docLabel", header: "書類" },
  { accessorKey: "statusLabel", header: "状態" },
  { accessorKey: "supplier", header: "発注先" },
  {
    accessorKey: "lines",
    header: "行",
    cell: ({ row }) => <span className="tabular-nums">{row.original.lines}</span>,
  },
  {
    id: "_",
    header: "",
    accessorFn: (row) => row.id,
    cell: ({ row }) => (
      <Link href={`/dashboard/orders/${row.original.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        詳細
      </Link>
    ),
    enableSorting: false,
  },
];

export function OrdersDataTable({ data }: { data: OrderTableRow[] }) {
  return (
    <DataTable columns={columns} data={data} filterPlaceholder="書類・状態・発注先・日付で絞り込み…" emptyLabel="注文がありません。" />
  );
}
