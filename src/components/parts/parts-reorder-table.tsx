"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { reorderParts } from "@/features/parts/actions";
import type { PartsTableRow } from "@/components/parts/parts-data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  data: PartsTableRow[];
};

export function PartsReorderTable({ data: initialData }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialData);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialData);
  }, [initialData]);

  const persistOrder = useCallback(
    (ordered: PartsTableRow[]) => {
      const fd = new FormData();
      fd.set("orderedIds", ordered.map((r) => r.id).join(","));
      startTransition(async () => {
        setMessage(null);
        const res = await reorderParts(fd);
        if (!res.ok) {
          setMessage(res.message);
          setRows(initialData);
          return;
        }
        router.refresh();
      });
    },
    [initialData, router],
  );

  function onDrop(targetIndex: number) {
    if (dragIndex === null) return;
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === targetIndex) return;

    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(targetIndex, 0, item!);
    setRows(next);
    persistOrder(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        行左の <span className="font-mono">⠿</span> をドラッグして並べ替えできます。変更は自動保存されます。
      </p>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="w-10 px-2 py-2" aria-label="並べ替え" />
              <th className="px-3 py-2 font-medium">部品名</th>
              <th className="px-3 py-2 font-medium">純正品番</th>
              <th className="px-3 py-2 font-medium">社外商番</th>
              <th className="px-3 py-2 font-medium">売価</th>
              <th className="px-3 py-2 font-medium">在庫</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                draggable={!pending}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(index);
                }}
                onDragLeave={() => setOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(index);
                }}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-b-0",
                  dragIndex === index && "opacity-50",
                  overIndex === index && dragIndex !== null && "bg-primary/5",
                )}
              >
                <td className="px-2 py-2 text-center text-muted-foreground">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 cursor-grab px-0 active:cursor-grabbing"
                    aria-label={`${row.name} を並べ替え`}
                    disabled={pending}
                  >
                    ⠿
                  </Button>
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/dashboard/parts/${row.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.oemPartNo}</td>
                <td className="px-3 py-2">{row.aftermarketNo}</td>
                <td className="px-3 py-2">{row.salePriceDisplay}</td>
                <td className="px-3 py-2 tabular-nums">{row.currentQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pending ? <p className="text-xs text-muted-foreground">並べ替えを保存中…</p> : null}
    </div>
  );
}
