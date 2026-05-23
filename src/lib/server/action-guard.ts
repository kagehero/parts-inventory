import type { Session } from "next-auth";

import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { auth } from "@/auth";

export class ActionError extends Error {
  constructor(
    message: string,
    public code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export async function requireUser(): Promise<{ id: string; role: string; session: Session }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !session) throw new ActionError("ログイン情報が確認できません", "UNAUTHORIZED");
  return { id, role: session.user.role ?? "USER", session };
}

export function parseForm<T>(
  schema: z.ZodType<T>,
  formData: FormData | Record<string, unknown>,
): T {
  const obj =
    formData instanceof FormData
      ? Object.fromEntries(formData.entries())
      : formData;

  const result = schema.safeParse(obj);

  if (!result.success) {
    const flattened = result.error.flatten();
    const fieldMessages = Object.values(flattened.fieldErrors).flatMap((errs) =>
      Array.isArray(errs) ? errs : [],
    );
    const firstField = fieldMessages[0];
    const fallback = result.error.issues[0]?.message;
    throw new ActionError(firstField ?? fallback ?? "入力内容を確認してください");
  }

  return result.data;
}

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export async function guardAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof ActionError) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "サーバーで処理に失敗しました。時間をおいて再度お試しください。" };
  }
}
