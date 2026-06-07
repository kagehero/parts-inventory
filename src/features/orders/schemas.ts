import { z } from "zod";

import { zOptionalTrimmedEmail, zOptionalTrimmedEmptyToUndef, zRequiredJp } from "@/lib/forms/zod-fields";
import {
  LINE_DETAIL_CHARS_PER_LINE,
  LINE_DETAIL_MAX_CHARS,
  LINE_DETAIL_MAX_LINES,
} from "@/lib/orders/print-display";

const zLineDetailOptional = zOptionalTrimmedEmptyToUndef.refine(
  (v) => v === undefined || [...v].length <= LINE_DETAIL_MAX_CHARS,
  {
    message: `詳細は${LINE_DETAIL_CHARS_PER_LINE}字×${LINE_DETAIL_MAX_LINES}行（${LINE_DETAIL_MAX_CHARS}字）までです。続きはコメント欄へ`,
  },
);

const printPartNoModeSchema = z.enum(["AUTO_AFTERMARKET", "AUTO_OEM", "NONE", "CUSTOM"]);

export const orderHeaderSchema = z.object({
  supplierId: z.string().optional(),
  supplierName: zRequiredJp("発注先"),
  supplierFax: zOptionalTrimmedEmptyToUndef,
  supplierHonorific: zOptionalTrimmedEmptyToUndef,
  supplierContactName: zOptionalTrimmedEmptyToUndef,
  memo: zOptionalTrimmedEmptyToUndef,
  printComment: zOptionalTrimmedEmptyToUndef,
  documentType: z.enum(["PURCHASE_ORDER", "QUOTE_REQUEST"]).optional(),
  contactName: zRequiredJp("発注元担当者名"),
  contactPhone: zOptionalTrimmedEmptyToUndef,
  contactEmail: zOptionalTrimmedEmail("連絡先（メール）"),
});

export const orderLineAppendSchema = z
  .object({
    orderId: z.string().min(1),
    lineMode: z.enum(["MASTER", "FREE_TEXT"]),
    partId: z.string().optional(),
    printPartNoMode: printPartNoModeSchema.optional(),
    printPartNoOverride: z.string().optional(),
    orderedQty: z.coerce
      .number({ invalid_type_error: "数量は数値で入力してください", required_error: "数量を入力してください" })
      .int("数量は整数で入力してください")
      .positive("数量は1以上にしてください"),
    unitCost: z.string().optional(),
    freeItemName: z.string().optional(),
    freePartNo: z.string().optional(),
    machineModel: z.string().optional(),
    machineUnitNo: z.string().optional(),
    machineEngineNo: z.string().optional(),
    lineDetail: zLineDetailOptional,
    endCustomerName: z.string().optional(),
    lineNote: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.lineMode === "MASTER" && (!val.partId || val.partId.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "部品を選択してください" });
    }
    if (val.lineMode === "FREE_TEXT" && (!val.freeItemName || val.freeItemName.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "品名を入力してください" });
    }
    if (
      val.lineMode === "MASTER" &&
      val.printPartNoMode === "CUSTOM" &&
      (!val.printPartNoOverride || val.printPartNoOverride.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "直接指定の場合は品番を入力してください",
        path: ["printPartNoOverride"],
      });
    }
  });

/** @deprecated use orderLineAppendSchema */
export const orderLineSchema = orderLineAppendSchema;

export const receiveLineSchema = z.object({
  orderLineId: z.string().min(1),
  quantity: z.coerce
    .number({
      invalid_type_error: "数量は数値で入力してください",
      required_error: "数量を入力してください",
    })
    .int("数量は整数で入力してください")
    .positive("数量は1以上にしてください"),
});

export const orderHeaderUpdateSchema = z.object({
  orderId: z.string().min(1),
  supplierId: z.string().optional(),
  supplierName: zRequiredJp("発注先"),
  supplierFax: zOptionalTrimmedEmptyToUndef,
  supplierHonorific: zOptionalTrimmedEmptyToUndef,
  supplierContactName: zOptionalTrimmedEmptyToUndef,
  memo: zOptionalTrimmedEmptyToUndef,
  printComment: zOptionalTrimmedEmptyToUndef,
  documentType: z.enum(["PURCHASE_ORDER", "QUOTE_REQUEST"]).optional(),
  contactName: zRequiredJp("発注元担当者名"),
  contactPhone: zOptionalTrimmedEmptyToUndef,
  contactEmail: zOptionalTrimmedEmail("連絡先（メール）"),
  quoteReplyAmount: z.string().optional(),
  quoteReplyLeadTime: z.string().optional(),
});

export const orderLineUpdateSchema = z
  .object({
    orderLineId: z.string().min(1),
    orderedQty: z.coerce
      .number({ invalid_type_error: "数量は数値で入力してください", required_error: "数量を入力してください" })
      .int("数量は整数で入力してください")
      .positive("数量は1以上にしてください"),
    lineNote: z.string().optional(),
    printPartNoMode: printPartNoModeSchema.optional(),
    printPartNoOverride: z.string().optional(),
    freePartNo: z.string().optional(),
    freeItemName: z.string().optional(),
    lineDetail: zLineDetailOptional,
    endCustomerName: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.printPartNoMode === "CUSTOM" && (!val.printPartNoOverride || val.printPartNoOverride.trim() === "")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "直接指定の場合は品番を入力してください", path: ["printPartNoOverride"] });
    }
  });

export const orderLineIdSchema = z.object({
  orderLineId: z.string().min(1),
});

/** 注文共有メール：送信先は必須（画面上で明示入力） */
export const orderShareEmailSchema = z.object({
  orderId: z.string().transform((v) => v.trim()).pipe(z.string().min(1, "注文が指定されていません")),
  to: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "送信先メールは必須です").email("メールアドレスの形式が正しくありません")),
});
