"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function OrderAttachmentsPanel({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-muted px-4 py-3">
      <p className="text-sm font-semibold">写真・資料を添付</p>
      <p className="text-xs text-muted-foreground">
        Vercel 本番では <code className="rounded bg-muted px-1">BLOB_READ_WRITE_TOKEN</code> の設定が必要です。
      </p>
      <input ref={inputRef} type="file" className="block text-sm" accept="image/*,.pdf" />
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => {
          const el = inputRef.current;
          const f = el?.files?.[0];
          if (!f) {
            setMessage("ファイルを選んでください");
            return;
          }
          const fd = new FormData();
          fd.set("orderId", orderId);
          fd.set("file", f);
          startTransition(async () => {
            setMessage(null);
            const res = await fetch("/api/uploads/order-attachment", {
              method: "POST",
              body: fd,
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok || !j.ok) {
              setMessage((j as { message?: string }).message ?? "アップロードに失敗しました");
              return;
            }
            el!.value = "";
            router.refresh();
          });
        }}
      >
        {pending ? "送信中…" : "アップロード"}
      </Button>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
