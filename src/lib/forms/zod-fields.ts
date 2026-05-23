import { z } from "zod";

/**
 * FormData 由来の文字列：前後空白を削除し、空なら検証エラー（必須項目）
 */
export function zRequiredJp(fieldLabelJa: string) {
  return z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, `${fieldLabelJa}は必須です`));
}

/**
 * optional 項目：未定義または空文字は undefined に正規化
 */
export const zOptionalTrimmedEmptyToUndef = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v.trim() === "" ? undefined : v.trim()));

/** 入力があるときだけ email チェック（空なら OK） */
export function zOptionalTrimmedEmail(fieldLabelJa = "メールアドレス") {
  return zOptionalTrimmedEmptyToUndef.refine((v) => v === undefined || z.string().email().safeParse(v).success, {
    message: `${fieldLabelJa}の形式が正しくありません`,
  });
}
