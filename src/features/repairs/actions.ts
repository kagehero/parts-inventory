"use server";

import { revalidatePath } from "next/cache";

import * as RepairsService from "@/server/services/repairs.service";

import { guardAction, requireUser, type ActionResult } from "@/lib/server/action-guard";

export async function deleteRepairRecord(recordId: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();

    const { machineId } = await RepairsService.deleteRepairRecord(recordId);

    revalidatePath("/dashboard/repairs");
    if (machineId) {
      revalidatePath(`/dashboard/machines/${machineId}`);
    }
  });
}
