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
