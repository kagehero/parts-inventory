"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "__none__";

export type RepairMachineOption = { id: string; label: string };

type Props = {
  machines: RepairMachineOption[];
  initialMachineId?: string | null;
};

export function RepairPdfForm({ machines, initialMachineId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const defaultMachine = useMemo(() => {
    if (!initialMachineId?.trim()) return NONE;
    return machines.some((m) => m.id === initialMachineId) ? initialMachineId : NONE;
  }, [initialMachineId, machines]);

  const [machineValue, setMachineValue] = useState(defaultMachine);

  useEffect(() => {
    setMachineValue(defaultMachine);
  }, [defaultMachine]);

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        startTransition(async () => {
          setMessage(null);
          const fd = new FormData(form);
          if (machineValue && machineValue !== NONE) {
            fd.set("machineId", machineValue);
          } else {
            fd.delete("machineId");
          }
          try {
            const res = await fetch("/api/uploads/repair-pdf", {
              method: "POST",
              body: fd,
            });
            const body = (await res.json().catch(() => null)) as { message?: string } | null;
            if (!res.ok) {
              setMessage(
                typeof body?.message === "string" ? body.message : "アップロードに失敗しました (PDFのみ / サイズ確認)",
              );
              return;
            }
            form.reset();
            setMachineValue(NONE);
            router.push("/dashboard/repairs");
            router.refresh();
          } catch {
            setMessage("ネットワークエラーが発生しました");
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title" showRequired>
          タイトル
        </Label>
        <Input id="title" name="title" required placeholder="伝票概要など" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="repair-machine">保有機（任意）</Label>
        <Select value={machineValue} onValueChange={setMachineValue}>
          <SelectTrigger id="repair-machine" className="w-full">
            <SelectValue placeholder="紐づけなし" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>紐づけなし</SelectItem>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground">保有機ごとに一覧・検索しやすくなります。</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="repairDate">日付</Label>
        <Input id="repairDate" type="date" name="repairDate" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file" showRequired>
          修理伝票PDF
        </Label>
        <Input id="file" name="file" type="file" accept="application/pdf" required />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "処理中..." : "アップロード"}
        </Button>
        <Button variant="ghost" type="button" asChild disabled={pending}>
          <Link href="/dashboard/repairs">一覧へ</Link>
        </Button>
      </div>
    </form>
  );
}
