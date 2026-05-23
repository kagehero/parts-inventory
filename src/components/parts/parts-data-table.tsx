"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { cn } from "@/lib/utils";

export type PartsTableRow = {
  id: string;
  name: string;
  oemPartNo: string;
  aftermarketNo: string;
  salePriceDisplay: string;
  currentQty: number;
};

const columns: ColumnDef<PartsTableRow>[] = [
  {
    accessorKey: "name",
    header: "部品名",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/parts/${row.original.id}`}
        className={cn(
          "font-medium text-primary underline-offset-4 transition-colors hover:text-primary/85 hover:underline",
        )}
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "oemPartNo", header: "純正品番" },
  { accessorKey: "aftermarketNo", header: "社外商番" },
  { accessorKey: "salePriceDisplay", header: "売価" },
  {
    accessorKey: "currentQty",
    header: "在庫",
  },
];

export function PartsDataTable({ data }: { data: PartsTableRow[] }) {
  return (
    <DataTable columns={columns} data={data} filterPlaceholder="部品名・品番・価格で絞り込み…" emptyLabel="部品がありません。" />
  );
}
