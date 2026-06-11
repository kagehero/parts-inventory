import type { KeyboardEvent } from "react";

/** 入力欄の Enter でフォーム送信しない（保存はボタンクリックのみ） */
export function blockEnterFormSubmit(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
  const target = e.target;
  if (target instanceof HTMLTextAreaElement) return;
  if (target instanceof HTMLButtonElement) return;
  if (target instanceof HTMLSelectElement) return;
  e.preventDefault();
  if (target instanceof HTMLElement && target.closest("[data-print-detail-field]")) return;
}
