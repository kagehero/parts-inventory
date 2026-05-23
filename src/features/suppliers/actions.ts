"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "@/server/services/suppliers.service";
import {
  parseForm,
  guardAction,
  requireUser,
  type ActionResult,
} from "@/lib/server/action-guard";

import { supplierCreateSchema, supplierIdSchema, supplierUpdateSchema } from "./schemas";

export async function createSupplierAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(supplierCreateSchema, Object.fromEntries(formData.entries()));
    const row = await createSupplier(parsed);
    revalidatePath("/dashboard/suppliers");
    return { id: row.id };
  });
}

export async function updateSupplierAction(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(supplierUpdateSchema, Object.fromEntries(formData.entries()));
    await updateSupplier(parsed);
    revalidatePath("/dashboard/suppliers");
    revalidatePath(`/dashboard/suppliers/${parsed.id}/edit`);
  });
}

export async function deleteSupplierAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = parseForm(supplierIdSchema, Object.fromEntries(formData.entries()));
  await deleteSupplier(parsed.id);
  revalidatePath("/dashboard/suppliers");
  redirect("/dashboard/suppliers");
}
