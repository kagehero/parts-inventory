"use client";

import { useTransition } from "react";

import { cancelOrder } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("未入荷の注文のみ取消できます。実行しますか？")) return;

        startTransition(async () => {
          const result = await cancelOrder(orderId);
          if (!result.ok) {
            alert(result.message);
          }
          window.location.reload();
        });
      }}
    >
      注文取消
    </Button>
  );
}
