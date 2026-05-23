"use server";

import { revalidatePath } from "next/cache";

import * as UsageHistoryService from "@/server/services/usage-history.service";

import { outgoingFormSchema, outgoingSlipMemoSchema } from "@/features/outgoing/schemas";
import {
  guardAction,
  parseForm,
  requireUser,
  ActionError,
  type ActionResult,
} from "@/lib/server/action-guard";

export async function createOutgoingIssue(formData: FormData) {
  return guardAction(async () => {
    await requireUser();

    const entries = Object.fromEntries(formData.entries());
    const linesRaw = entries.lines;

    let linesUnknown: unknown;
    if (typeof linesRaw !== "string") {
      throw new ActionError("明細情報が送信されていません");
    }
    try {
      linesUnknown = JSON.parse(linesRaw);
    } catch {
      throw new ActionError("明細データが壊れています（再入力してください）");
    }

    const parsed = parseForm(outgoingFormSchema, {
      ...entries,
      lines: linesUnknown,
    });

    await UsageHistoryService.createUsageSlip({
      issueDate: new Date(parsed.issueDate),
      customerId: parsed.customerId?.trim() ? parsed.customerId : undefined,
      machineId: parsed.machineId?.trim() ? parsed.machineId : undefined,
      memo: parsed.memo?.trim() ? parsed.memo.trim() : undefined,
      lines: parsed.lines,
    });

    revalidatePath("/dashboard/outgoing");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/parts", "layout");
  });
}

export async function updateOutgoingSlipMemo(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();

    const parsed = parseForm(outgoingSlipMemoSchema, Object.fromEntries(formData.entries()));

    await UsageHistoryService.updateUsageSlipMemo({
      id: parsed.id,
      memo: (parsed.memo ?? "").trim() || null,
    });

    revalidatePath("/dashboard/outgoing");
    revalidatePath(`/dashboard/outgoing/${parsed.id}`);
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/parts", "layout");
  });
}
