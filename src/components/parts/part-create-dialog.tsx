"use client";

import Link from "next/link";
import { useState } from "react";

import { PartForm } from "@/components/parts/part-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PartCreateDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button size="sm">部品を登録</Button>}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-5rem)] max-w-3xl gap-6 overflow-hidden p-6 sm:p-8">
        <DialogHeader className="space-y-1 pr-6 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">部品を登録</DialogTitle>
          <DialogDescription>マスタ項目を入力して保存してください。現在庫は履歴にも残ります。</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(70dvh,calc(100dvh-17rem))] overflow-y-auto pr-2">
          <PartForm embedded onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/dashboard/parts/new" className="underline-offset-4 hover:text-foreground hover:underline">
            全画面フォームへ
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
