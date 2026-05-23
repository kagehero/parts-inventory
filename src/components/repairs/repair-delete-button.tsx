"use client";

import { useRouter } from "next/navigation";

import { deleteRepairRecord } from "@/features/repairs/actions";
import { useActionResultTransition } from "@/hooks/use-action-result-transition";
import { Button } from "@/components/ui/button";

export function RepairDeleteButton({ recordId }: { recordId: string }) {
  const router = useRouter();
  const { pending, run } = useActionResultTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("この記録とファイルを削除してもよいですか？")) return;
        run(() => deleteRepairRecord(recordId), { okMessage: "削除しました", onSuccess: () => router.refresh() });
      }}
    >
      {pending ? "…" : "削除"}
    </Button>
  );
}
