"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";

export type InventoryLogRow = {
  id: string;
  occurredAtSort: string;
  occurredDisplay: string;
  typeLabel: string;
  partName: string;
  partHref: string;
  /** その部品の入出庫だけを並べた一覧 */
  partLedgerHref: string;
  quantity: number;
  note: string;
};

function typeVariant(label: string): "default" | "secondary" | "subtle" {
  if (label.includes("購買")) return "subtle";
  if (label.includes("使用")) return "default";
  return "secondary";
}

const columns: ColumnDef<InventoryLogRow>[] = [
  {
    accessorKey: "occurredAtSort",
    header: "発生日時",
    cell: ({ row }) => <span className="tabular-nums text-[13px]">{row.original.occurredDisplay}</span>,
  },
  {
    accessorKey: "typeLabel",
    header: "種別",
    cell: ({ row }) => (
      <Badge variant={typeVariant(row.original.typeLabel)} className="font-normal">
        {row.original.typeLabel}
      </Badge>
    ),
  },
  {
    accessorKey: "partName",
    header: "部品",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
        <Link
          href={row.original.partHref}
          className="font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline"
        >
          {row.original.partName}
        </Link>
        <Link
          href={row.original.partLedgerHref}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
        >
          入出庫履歴のみ
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "数量",
    cell: ({ row }) => (
      <span className={row.original.quantity < 0 ? "font-semibold text-destructive tabular-nums" : "tabular-nums"}>
        {row.original.quantity}
      </span>
    ),
  },
  { accessorKey: "note", header: "メモ" },
];

export function InventoryLogDataTable({ data }: { data: InventoryLogRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterPlaceholder="種別・部品・メモで絞り込み…"
      emptyLabel="履歴がありません。"
    />
  );
}
