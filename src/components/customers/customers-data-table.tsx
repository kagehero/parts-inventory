"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";

export type CustomerTableRow = {
  id: string;
  name: string;
  municipality: string;
  machineCount: number;
};

const columns: ColumnDef<CustomerTableRow>[] = [
  {
    accessorKey: "name",
    header: "名前",
    cell: ({ row }) => (
      <Link
        className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
        href={`/dashboard/customers/${row.original.id}`}
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "municipality", header: "所在地（町村）" },
  {
    accessorKey: "machineCount",
    header: "保有機",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono font-normal tabular-nums">
        {row.original.machineCount}
      </Badge>
    ),
  },
];

export function CustomersDataTable({ data }: { data: CustomerTableRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterPlaceholder="顧客名・所在地で絞り込み…"
      emptyLabel="顧客がいません。"
    />
  );
}
