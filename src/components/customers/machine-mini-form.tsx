"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Customer } from "@prisma/client";

import { createMachine } from "@/features/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MachineMiniForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="rounded-lg border p-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        fd.set("customerId", customer.id);
        startTransition(async () => {
          setMessage(null);
          const res = await createMachine(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="customerId" value={customer.id} />
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-1">
          <Label htmlFor="modelName" showRequired>
            型式
          </Label>
          <Input id="modelName" name="modelName" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="unitNo" showRequired>
            号機
          </Label>
          <Input id="unitNo" name="unitNo" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "…" : "追加"}
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="engineNo">エンジンNo</Label>
        <Input id="engineNo" name="engineNo" />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
