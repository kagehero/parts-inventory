"use client";

import { useTransition, useState } from "react";

import { updateOutgoingSlipMemo } from "@/features/outgoing/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { slipId: string; memo: string | null };

export function OutgoingMemoEditor({ slipId, memo }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [text, setText] = useState(memo ?? "");

  return (
    <section id="memo" className="scroll-mt-28 rounded-lg border border-dashed border-muted px-4 py-4">
      <h2 className="text-sm font-semibold">伝票メモ（自由記載）</h2>
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("id", slipId);
          fd.set("memo", text);
          startTransition(async () => {
            setMessage(null);
            const res = await updateOutgoingSlipMemo(fd);
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            window.location.reload();
          });
        }}
      >
        <Label htmlFor="slip-memo" className="text-xs font-normal text-muted-foreground">
          出庫理由・メモなど（後から入力・変更できます）
        </Label>
        <Textarea
          id="slip-memo"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="任意のメモを記載してください"
        />
        {message ? <p className="text-xs text-destructive">{message}</p> : null}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中…" : "メモを保存"}
        </Button>
      </form>
    </section>
  );
}
