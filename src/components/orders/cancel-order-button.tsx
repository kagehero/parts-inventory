"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelOrder, deleteOrder } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
  /** 取消済みなら「注文取消」は出さず「完全削除」のみ表示 */
  isCancelled?: boolean;
};

export function CancelOrderButton({ orderId, isCancelled = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    // 誤タップ防止に2段階で確認（完全削除は元に戻せない）
    if (!confirm("この注文を完全削除します。元に戻せません。よろしいですか？")) return;
    if (!confirm("本当に完全削除しますか？（注文書・明細・添付がすべて消えます）")) return;

    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      router.replace("/dashboard/orders");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {!isCancelled ? (
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
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="border-destructive/50 text-destructive hover:bg-destructive/10"
        disabled={pending}
        onClick={handleDelete}
      >
        完全削除
      </Button>
    </div>
  );
}
