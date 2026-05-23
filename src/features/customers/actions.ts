"use server";

import { revalidatePath } from "next/cache";

import * as CustomersService from "@/server/services/customers.service";
import * as MachinesService from "@/server/services/machines.service";

import { ownedMachineSchema, customerFormSchema, machineUpdateSchema } from "@/features/customers/schemas";
import { parseForm, guardAction, requireUser, type ActionResult } from "@/lib/server/action-guard";

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(customerFormSchema, Object.fromEntries(formData.entries()));

    await CustomersService.createCustomer(parsed);

    revalidatePath("/dashboard/customers");
  });
}

export async function updateCustomer(id: string, formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(customerFormSchema, Object.fromEntries(formData.entries()));

    await CustomersService.updateCustomer(id, parsed);

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    revalidatePath("/dashboard/machines");
  });
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    await CustomersService.deleteCustomer(id);

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/machines");
  });
}

export async function createMachine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(ownedMachineSchema, Object.fromEntries(formData.entries()));

    await MachinesService.createMachine(parsed);

    revalidatePath("/dashboard/machines");
  });
}

export async function updateMachine(formData: FormData): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();
    const parsed = parseForm(machineUpdateSchema, Object.fromEntries(formData.entries()));

    await MachinesService.updateMachine(parsed.machineId, {
      customerId: parsed.customerId,
      modelName: parsed.modelName,
      unitNo: parsed.unitNo,
      engineNo: parsed.engineNo,
    });

    revalidatePath("/dashboard/machines");
    revalidatePath("/dashboard/customers");
  });
}

export async function deleteMachine(machineId: string): Promise<ActionResult> {
  return guardAction(async () => {
    await requireUser();

    await MachinesService.deleteMachine(machineId);

    revalidatePath("/dashboard/machines");
    revalidatePath("/dashboard/customers");
  });
}
