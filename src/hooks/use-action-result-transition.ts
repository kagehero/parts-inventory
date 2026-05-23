"use client";

import { useCallback, useState, useTransition } from "react";

import type { ActionResult } from "@/lib/server/action-guard";
import { notifyActionResult } from "@/lib/toast-action";

type RunOptions = {
  okMessage?: string;
  onSuccess?: () => void;
};

/**
 * Standard client wrapper for server actions returning {@link ActionResult}:
 * transition pending flag, optional inline error message for forms, and Sonner toasts.
 */
export function useActionResultTransition() {
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback((task: () => Promise<ActionResult>, options?: RunOptions) => {
    startTransition(async () => {
      setErrorMessage(null);
      const res = await task();
      notifyActionResult(res, options?.okMessage ?? "保存しました");
      if (res.ok) options?.onSuccess?.();
      else setErrorMessage(res.message);
    });
  }, []);

  return { pending, errorMessage, setErrorMessage, run };
}
