"use client";

import { useState, useTransition } from "react";

import { receiveOrderLine } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReceiveLineControl({ orderLineId, remaining }: { orderLineId: string; remaining: number }) {
  const [qty, setQty] = useState(Math.min(1, remaining));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (remaining <= 0) {
    return <span className="text-xs text-muted-foreground">入荷完了</span>;
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("orderLineId", orderLineId);
        fd.set("quantity", String(qty));
        startTransition(async () => {
          setMessage(null);
          const res = await receiveOrderLine(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          window.location.reload();
        });
      }}
    >
      <Input
        type="number"
        className="h-9 w-24 text-right"
        min={1}
        max={remaining}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
      <Button size="sm" type="submit" disabled={pending}>
        {pending ? "..." : "入荷処理"}
      </Button>
    </form>
  );
}
