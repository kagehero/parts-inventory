"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Customer } from "@prisma/client";

import { createMachine } from "@/features/customers/actions";
import { notifyActionResult } from "@/lib/toast-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CustomerOption = Pick<Customer, "id" | "name" | "municipality">;

export function MachineUniversalForm({
  customers,
  embedded,
  onDone,
}: {
  customers: CustomerOption[];
  embedded?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (customers.length === 0) {
    return <p className="text-sm text-muted-foreground">先に顧客を作成してください。</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          setMessage(null);
          const res = await createMachine(fd);
          notifyActionResult(res, "登録しました");
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          form.reset();
          onDone?.();
          router.refresh();
        });
      }}
      className={
        embedded
          ? "max-w-xl space-y-3"
          : "max-w-xl space-y-3 rounded-lg border border-border bg-card p-5 shadow-inner shadow-indigo-100/35"
      }
    >
      <div className="space-y-1">
        <Label htmlFor="univ-customer" showRequired>
          顧客
        </Label>
        <select
          required
          id="univ-customer"
          name="customerId"
          className="h-10 w-full rounded-md border border-input px-3 text-[13px]"
          defaultValue={customers[0]?.id ?? ""}
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}／{c.municipality}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
        <div className="space-y-1">
          <Label htmlFor="univ-model" showRequired>
            型式
          </Label>
          <Input id="univ-model" name="modelName" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="univ-unit" showRequired>
            号機
          </Label>
          <Input id="univ-unit" name="unitNo" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "…" : "追加"}
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="univ-engine">エンジンNo</Label>
        <Input id="univ-engine" name="engineNo" />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
