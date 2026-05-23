import { z } from "zod";

import { zOptionalTrimmedEmptyToUndef, zRequiredJp } from "@/lib/forms/zod-fields";

export const outgoingLineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("master"),
    partId: z.string().min(1),
    quantity: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("adHoc"),
    quantity: z.number().int().positive(),
    itemName: z.string().min(1),
    partNo: z.string().optional(),
    machineModel: z.string().optional(),
    machineUnitNo: z.string().optional(),
    machineEngineNo: z.string().optional(),
  }),
]);

const isoDateJp = z
  .string()
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00`)), { message: "出庫日の形式が正しくありません" });

export const outgoingFormSchema = z.object({
  issueDate: zRequiredJp("出庫日").pipe(isoDateJp),
  customerId: z.string().optional(),
  machineId: z.string().optional(),
  memo: zOptionalTrimmedEmptyToUndef,
  lines: z.array(outgoingLineSchema).min(1, "最低1明細が必要です"),
});

export type OutgoingFormValues = z.infer<typeof outgoingFormSchema>;

export const outgoingSlipMemoSchema = z.object({
  id: z.string().min(1),
  memo: z.string().optional(),
});
