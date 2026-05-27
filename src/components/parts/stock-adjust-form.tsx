"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { adjustPartStock } from "@/features/parts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  partId: string;
  partName: string;
  currentQty: number;
  compact?: boolean;
  className?: string;
};

export function StockAdjustForm({ partId, partName, currentQty, compact, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className={cn(
        compact ? "flex flex-wrap items-end gap-2" : "grid gap-3 rounded-md border border-border/70 bg-muted/10 p-3",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("partId", partId);
        fd.set("delta", delta);
        fd.set("note", note.trim());
        startTransition(async () => {
          setMessage(null);
          const res = await adjustPartStock(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          setDelta("");
          setNote("");
          router.refresh();
        });
      }}
    >
      {!compact ? (
        <div>
          <p className="text-sm font-medium">在庫の手動調整</p>
          <p className="text-xs text-muted-foreground">
            {partName} — 現在庫 {currentQty}。増減量は整数（例: +5 / -2）。履歴は「棚卸・調整」として記録されます。
          </p>
        </div>
      ) : null}

      <div className={cn("grid gap-1", compact ? "min-w-[88px]" : undefined)}>
        {!compact ? (
          <Label htmlFor={`adjust-delta-${partId}`} showRequired>
            増減量
          </Label>
        ) : (
          <Label htmlFor={`adjust-delta-${partId}`} className="sr-only">
            増減量
          </Label>
        )}
        <Input
          id={`adjust-delta-${partId}`}
          type="number"
          step="1"
          required
          placeholder={compact ? "±数量" : "例: 3 または -1"}
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          className={compact ? "h-9 w-24 text-sm" : undefined}
        />
      </div>

      <div className={cn("grid gap-1", compact ? "min-w-[140px] flex-1" : undefined)}>
        <Label htmlFor={`adjust-note-${partId}`} className={compact ? "sr-only" : undefined}>
          理由（任意）
        </Label>
        <Input
          id={`adjust-note-${partId}`}
          name="note"
          placeholder={compact ? "理由" : "例: 棚卸差異"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={compact ? "h-9 text-sm" : undefined}
        />
      </div>

      <Button type="submit" size={compact ? "sm" : "default"} disabled={pending} className={compact ? "h-9" : undefined}>
        {pending ? "処理中…" : "調整"}
      </Button>

      {message ? (
        <p className={cn("text-sm text-destructive", compact ? "basis-full" : undefined)}>{message}</p>
      ) : null}
    </form>
  );
}
