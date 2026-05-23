"use client";

import * as React from "react";

import { CustomerQuickForm } from "@/components/customers/customer-quick-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function CustomerCreateDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 transition-transform active:scale-[0.985]">
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          顧客を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>顧客の登録</DialogTitle>
          <DialogDescription>名称と町村のみを入力します。後から詳細を編集できます。</DialogDescription>
        </DialogHeader>
        <CustomerQuickForm embedded onFinish={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
