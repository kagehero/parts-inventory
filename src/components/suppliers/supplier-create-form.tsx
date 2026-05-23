"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupplierAction } from "@/features/suppliers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SupplierCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="max-w-xl space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setMessage(null);
          const res = await createSupplierAction(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          router.push("/dashboard/suppliers");
          router.refresh();
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="companyName" showRequired>
          会社名
        </Label>
        <Input id="companyName" name="companyName" required placeholder="株式会社◯◯" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="attn">ご担当／窓口</Label>
        <Input id="attn" name="attn" placeholder="御中・氏名など" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="fax">FAX</Label>
        <Input id="fax" name="fax" type="tel" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">電話</Label>
        <Input id="phone" name="phone" type="tel" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">メール</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="memo">社内メモ</Label>
        <Textarea id="memo" name="memo" rows={3} />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "登録中…" : "登録する"}
      </Button>
    </form>
  );
}
