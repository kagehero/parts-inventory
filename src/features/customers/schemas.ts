import { z } from "zod";

import { zOptionalTrimmedEmptyToUndef, zRequiredJp } from "@/lib/forms/zod-fields";

export const customerFormSchema = z.object({
  name: zRequiredJp("顧客名"),
  municipality: zRequiredJp("所在地（町村名）"),
});

export const ownedMachineSchema = z.object({
  customerId: z.string().min(1, "顧客を選択してください"),
  modelName: zRequiredJp("型式"),
  unitNo: zRequiredJp("号機"),
  engineNo: zOptionalTrimmedEmptyToUndef,
});

export const machineUpdateSchema = z.object({
  machineId: z.string().min(1),
  customerId: z.string().min(1).optional(),
  modelName: zRequiredJp("型式"),
  unitNo: zRequiredJp("号機"),
  engineNo: zOptionalTrimmedEmptyToUndef,
});
