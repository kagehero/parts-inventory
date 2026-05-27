import { z } from "zod";

import { zOptionalTrimmedEmptyToUndef, zRequiredJp } from "@/lib/forms/zod-fields";

export const partFormSchema = z.object({
  name: zRequiredJp("部品名"),
  oemPartNo: zOptionalTrimmedEmptyToUndef,
  aftermarketNo: zOptionalTrimmedEmptyToUndef,
  oemListPrice: zOptionalTrimmedEmptyToUndef,
  purchasePrice: zOptionalTrimmedEmptyToUndef,
  salePrice: zOptionalTrimmedEmptyToUndef,
  compatibleModels: z.union([z.string(), z.undefined()]).transform((s) =>
    s === undefined ? undefined : s.trim() === "" ? undefined : s.trim(),
  ),
  markupRate: zOptionalTrimmedEmptyToUndef,
});

export const reorderPartsSchema = z.object({
  orderedIds: z
    .string()
    .min(1)
    .transform((raw) =>
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(1)).min(1, "並べ替える部品がありません")),
});

export const adjustPartStockSchema = z.object({
  partId: z.string().min(1),
  delta: z.coerce
    .number({ invalid_type_error: "数量は数値で入力してください", required_error: "数量を入力してください" })
    .int("数量は整数で入力してください")
    .refine((n) => n !== 0, "増減量は0以外にしてください"),
  note: zOptionalTrimmedEmptyToUndef,
});
