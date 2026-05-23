"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterPlaceholder?: string;
  emptyLabel?: string;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  filterPlaceholder = "一覧を絞り込み…",
  emptyLabel = "該当する行がありません。",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder={filterPlaceholder}
          value={globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(String(e.target.value))}
          className="h-10 max-w-full border-border bg-background/90 shadow-inner shadow-indigo-100/40 transition-shadow hover:shadow-sm focus-visible:border-primary/50 focus-visible:ring-primary/30 sm:w-72"
          aria-label="テーブル検索"
        />
        <div className="text-xs tabular-nums text-muted-foreground">
          {table.getFilteredRowModel().rows.length} / {table.getCoreRowModel().rows.length} 件
        </div>
      </div>

      <Table containerClassName="border-border/90 bg-card/95 backdrop-blur-[2px] shadow-[0_1px_26px_-10px_rgba(67,56,202,0.26)]">
        <TableHeader className="sticky top-0 z-[1] bg-muted/65 shadow-sm backdrop-blur-sm [&_tr]:border-b-muted">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-muted/65">
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      className={cn(
                        "-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-primary/[0.09] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        header.column.getCanSort() ? "" : "cursor-default hover:bg-transparent",
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                      disabled={!header.column.getCanSort()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() ? (
                        <span className="text-muted-foreground">
                          {{
                            asc: <ArrowUp className="h-3.5 w-3.5" aria-hidden />,
                            desc: <ArrowDown className="h-3.5 w-3.5" aria-hidden />,
                          }[header.column.getIsSorted() as string] ?? (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-45" aria-hidden />
                          )}
                        </span>
                      ) : null}
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="transition-[background-color] duration-150 hover:bg-primary/[0.04] motion-safe:active:brightness-[1.015]">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
