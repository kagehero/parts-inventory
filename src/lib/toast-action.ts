import { toast } from "sonner";

import type { ActionResult } from "@/lib/server/action-guard";

export function notifyActionResult(res: ActionResult, okMessage = "保存しました") {
  if (res.ok) {
    toast.success(okMessage);
    return true;
  }
  toast.error(res.message);
  return false;
}
