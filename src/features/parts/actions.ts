"use server";

import { revalidatePath } from "next/cache";

import * as PartsService from "@/server/services/parts.service";

import { prisma } from "@/lib/db";
import { adjustPartStockSchema, partFormSchema, reorderPartsSchema } from "@/features/parts/schemas";
import {
  parseForm,
  requireUser,
  guardAction,
  ActionError,
  type ActionResult,
} from "@/lib/server/action-guard";
import { toOptionalDecimal } from "@/lib/decimal";

function hydratePartWrite(input: Record<string, FormDataEntryValue>): PartsService.PartWriteInput {
  const parsed = parseForm(partFormSchema, input);
  return {
    name: parsed.name.trim(),
    oemPartNo: parsed.oemPartNo?.trim() || undefined,
    aftermarketNo: parsed.aftermarketNo?.trim() || undefined,
    oemListPrice: toOptionalDecimal(parsed.oemListPrice ?? undefined),
    purchasePrice: toOptionalDecimal(parsed.purchasePrice ?? undefined),
    salePrice: toOptionalDecimal(parsed.salePrice ?? undefined),
    compatibleModels:
      parsed.compatibleModels?.trim() === "" ? undefined : parsed.compatibleModels?.trim(),
    markupRate: toOptionalDecimal(parsed.markupRate ?? undefined),
  };
}

export async function createPart(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const payload = hydratePartWrite(Object.fromEntries(formData.entries()));

    await PartsService.createPart(payload);

    revalidatePath("/dashboard/parts");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/outgoing");
  });
}

export async function updatePart(partId: string, formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const prev = await prisma.part.findUnique({ where: { id: partId } });
    if (!prev) throw new ActionError("部品が見つかりません");

    const payload = hydratePartWrite(Object.fromEntries(formData.entries()));

    await PartsService.updatePart(partId, payload);

    revalidatePath("/dashboard/parts");
    revalidatePath(`/dashboard/parts/${partId}`);
    revalidatePath("/dashboard/inventory");
  });
}

export async function deletePart(partId: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    await PartsService.deletePart(partId);

    revalidatePath("/dashboard/parts");
    revalidatePath("/dashboard/inventory");
  });
}

export async function searchPartsForPicker(query: string): Promise<ActionResult<PartsService.PartPickerRow[]>> {
  return guardAction(async () => {
    await requireUser();
    const rows = await PartsService.searchPartsForPicker({ query, take: 40 });
    return rows;
  });
}

export async function fetchPartPickerRow(partId: string): Promise<ActionResult<PartsService.PartPickerRow | null>> {
  return guardAction(async () => {
    await requireUser();
    return PartsService.getPartPickerRow(partId);
  });
}

export async function reorderParts(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const raw = formData.get("orderedIds");
    const result = reorderPartsSchema.safeParse({ orderedIds: typeof raw === "string" ? raw : "" });
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "並べ替えデータが不正です";
      throw new ActionError(msg);
    }
    await PartsService.reorderParts(result.data.orderedIds);

    revalidatePath("/dashboard/parts");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/outgoing");
  });
}

export async function adjustPartStock(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(adjustPartStockSchema, Object.fromEntries(formData.entries()));

    await PartsService.adjustPartStock({
      partId: parsed.partId,
      delta: parsed.delta,
      note: parsed.note?.trim() || null,
    });

    revalidatePath("/dashboard/parts");
    revalidatePath(`/dashboard/parts/${parsed.partId}`);
    revalidatePath(`/dashboard/parts/${parsed.partId}/ledger`);
    revalidatePath("/dashboard/inventory");
  });
}
