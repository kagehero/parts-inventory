"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function OrderDetailPrintBar({ orderId }: { orderId: string }) {
  return (
    <div className="sticky top-0 z-20 -mx-5 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-5 py-2.5 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/90 sm:-mx-8 sm:px-8">
      <p className="text-xs text-muted-foreground">注文書の印刷・PDF保存</p>
      <Button size="sm" asChild>
        <Link href={`/print/orders/${orderId}`} target="_blank" rel="noreferrer">
          印刷用表示
        </Link>
      </Button>
    </div>
  );
}
