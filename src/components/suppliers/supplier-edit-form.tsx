"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { updateSupplierAction } from "@/features/suppliers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Row = {
  id: string;
  companyName: string;
  attn: string | null;
  fax: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
};

export function SupplierEditForm({ supplier }: { supplier: Row }) {
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
          const res = await updateSupplierAction(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          router.push("/dashboard/suppliers");
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="id" value={supplier.id} />
      <div className="space-y-1">
        <Label htmlFor="companyName" showRequired>
          会社名
        </Label>
        <Input id="companyName" name="companyName" required defaultValue={supplier.companyName} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="attn">ご担当／窓口</Label>
        <Input id="attn" name="attn" defaultValue={supplier.attn ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="fax">FAX</Label>
        <Input id="fax" name="fax" type="tel" defaultValue={supplier.fax ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">電話</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={supplier.phone ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">メール</Label>
        <Input id="email" name="email" type="email" defaultValue={supplier.email ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="memo">社内メモ</Label>
        <Textarea id="memo" name="memo" rows={3} defaultValue={supplier.memo ?? ""} />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
