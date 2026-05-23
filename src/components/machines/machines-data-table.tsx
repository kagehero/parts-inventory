"use client";

import * as React from "react";

import Link from "next/link";
import type { Customer } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { MachineUniversalForm } from "@/components/customers/machine-universal-form";
import { DeleteMachineButton } from "@/components/customers/delete-machine-button";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type MachineTableRow = {
  id: string;
  customerName: string;
  municipality: string;
  modelName: string;
  unitNo: string;
  engineNo: string;
};

const columns: ColumnDef<MachineTableRow>[] = [
  { accessorKey: "customerName", header: "顧客" },
  { accessorKey: "municipality", header: "所在地" },
  {
    accessorKey: "modelName",
    header: "型式",
    cell: ({ row }) => (
      <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/dashboard/machines/${row.original.id}`}>
        {row.original.modelName}
      </Link>
    ),
  },
  { accessorKey: "unitNo", header: "号機" },
  { accessorKey: "engineNo", header: "エンジンNo" },
  {
    id: "repairs",
    header: "修理",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={`/dashboard/machines/${row.original.id}`}
        >
          詳細
        </Link>
        <Link
          className="text-muted-foreground underline-offset-4 hover:underline"
          href={`/dashboard/repairs/new?machineId=${row.original.id}`}
        >
          PDF登録
        </Link>
        <Link
          className="text-muted-foreground underline-offset-4 hover:underline"
          href={`/dashboard/repairs?machineId=${row.original.id}`}
        >
          表形式
        </Link>
      </div>
    ),
  },
  {
    id: "_actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <DeleteMachineButton machineId={row.original.id} />,
  },
];

export function MachinesDataTable({ data }: { data: MachineTableRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterPlaceholder="顧客・機番・所在地で絞り込み…"
      emptyLabel="保有機がありません。"
    />
  );
}

type MinimalCustomer = Pick<Customer, "id" | "name" | "municipality">;

export function MachineCreateDialog({ customers }: { customers: MinimalCustomer[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 transition-transform active:scale-[0.985]">
          <Plus className="h-4 w-4" aria-hidden />
          保有機を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl border-border shadow-xl">
        <DialogHeader className="text-left">
          <DialogTitle>保有機の登録</DialogTitle>
          <DialogDescription>顧客に紐づく機番を登録します（一意制約があります）。</DialogDescription>
        </DialogHeader>
        <div className="max-h-[68dvh] overflow-y-auto pr-1 pt-2">
          <MachineUniversalForm customers={customers} embedded onDone={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
