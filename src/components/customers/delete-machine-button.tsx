"use client";

import { useRouter } from "next/navigation";

import { deleteMachine } from "@/features/customers/actions";
import { useActionResultTransition } from "@/hooks/use-action-result-transition";
import { Button } from "@/components/ui/button";

export function DeleteMachineButton({ machineId }: { machineId: string }) {
  const router = useRouter();
  const { pending, run } = useActionResultTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("この保有機情報を削除してもよろしいですか？")) return;
        run(() => deleteMachine(machineId), { okMessage: "削除しました", onSuccess: () => router.refresh() });
      }}
    >
      削除
    </Button>
  );
}
