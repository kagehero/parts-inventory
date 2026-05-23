"use client";

import { useTransition, useState } from "react";

import { sendOrderShareEmail } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrderShareEmailPanel({
  orderId,
  defaultTo,
}: {
  orderId: string;
  defaultTo: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-2 rounded-lg border border-border/80 bg-card/40 px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setMessage(null);
          const res = await sendOrderShareEmail(fd);
          setMessage(res.ok ? "送信処理が完了しました。" : res.message);
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm font-semibold">注文書URLをメールで共有</p>
      <p className="text-xs text-muted-foreground">
        Resend利用時は .env に RESEND_API_KEY と MAIL_FROM を設定してください。送信先は必須です（共有のたびに入力してください）。
      </p>
      <div className="space-y-1">
        <Label htmlFor="order-share-email-to" showRequired className="text-xs">
          送信先メール
        </Label>
        <Input
          id="order-share-email-to"
          name="to"
          type="email"
          required
          placeholder={defaultTo ? `例：${defaultTo}` : "例：supplier@example.com"}
          defaultValue={defaultTo ?? ""}
        />
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "送信中…" : "メール送信"}
      </Button>
    </form>
  );
}
