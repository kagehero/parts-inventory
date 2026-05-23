import { z } from "zod";

import {
  zOptionalTrimmedEmail,
  zOptionalTrimmedEmptyToUndef,
  zRequiredJp,
} from "@/lib/forms/zod-fields";

export const supplierCreateSchema = z.object({
  companyName: zRequiredJp("会社名"),
  attn: zOptionalTrimmedEmptyToUndef,
  fax: zOptionalTrimmedEmptyToUndef,
  phone: zOptionalTrimmedEmptyToUndef,
  email: zOptionalTrimmedEmail("メールアドレス"),
  memo: zOptionalTrimmedEmptyToUndef,
});

export const supplierUpdateSchema = supplierCreateSchema.extend({
  id: z.string().min(1),
});

export const supplierIdSchema = z.object({
  id: z.string().min(1),
});
