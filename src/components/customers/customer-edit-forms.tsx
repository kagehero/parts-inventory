"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Customer } from "@prisma/client";

import { deleteCustomer, updateCustomer } from "@/features/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerEditForms({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [pendingEdit, editTransition] = useTransition();
  const [pendingDelete, deleteTransition] = useTransition();
  const [editMessage, setEditMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-lg border p-5 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          editTransition(async () => {
            setEditMessage(null);
            const res = await updateCustomer(customer.id, fd);
            if (!res.ok) {
              setEditMessage(res.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name" showRequired>
            顧客名
          </Label>
          <Input id="name" name="name" defaultValue={customer.name} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="municipality" showRequired>
            所在地（町村名）
          </Label>
          <Input id="municipality" name="municipality" defaultValue={customer.municipality} required />
        </div>
        {editMessage ? <p className="text-sm text-destructive">{editMessage}</p> : null}
        <Button type="submit" disabled={pendingEdit}>
          {pendingEdit ? "更新中..." : "保存"}
        </Button>
      </form>

      <Button
        type="button"
        variant="destructive"
        disabled={pendingDelete}
        onClick={() =>
          deleteTransition(async () => {
            if (!confirm("関連するデータが無いときのみ削除できます。続行しますか？")) return;
            const result = await deleteCustomer(customer.id);
            if (!result.ok) {
              alert(result.message);
              return;
            }
            router.push("/dashboard/customers");
            router.refresh();
          })
        }
      >
        顧客を削除（注意）
      </Button>

      <Link href="/dashboard/customers" className="text-sm text-muted-foreground underline">
        一覧へ戻る
      </Link>
    </div>
  );
}
