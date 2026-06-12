"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type React from "react";

import {
  getLineDetailStats,
  joinLineDetailLines,
  LINE_DETAIL_CHARS_PER_LINE,
  LINE_DETAIL_MAX_CHARS,
  printDetailFieldHint,
  printDetailLineInputClassName,
  sanitizeLineDetailLine,
  splitLineDetailLines,
} from "@/lib/orders/print-display";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PrintDetailFieldProps = {
  id: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PrintDetailField({
  id,
  name,
  label = "詳細（品名の右・印刷用）",
  value,
  onChange,
  placeholder = "例：型式・号機・エンジンNo.",
}: PrintDetailFieldProps) {
  const line1Ref = useRef<HTMLInputElement>(null);
  const line2Ref = useRef<HTMLInputElement>(null);
  const pendingFocusLine2 = useRef(false);
  // IME変換中は確定までonChangeで親stateを書き換えない（変換が中断され文字落ちするため）
  const composingLine1 = useRef(false);
  const composingLine2 = useRef(false);
  const [line1, line2] = useMemo(() => splitLineDetailLines(value), [value]);
  const stats = useMemo(() => getLineDetailStats(value), [value]);
  const showLine2Hint = stats.line1Len >= LINE_DETAIL_CHARS_PER_LINE && stats.line2Len === 0;

  const focusLine2 = useCallback(() => {
    const el = line2Ref.current;
    if (!el) {
      pendingFocusLine2.current = true;
      return;
    }
    el.focus();
    // 末尾にカーソルを置く
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  useLayoutEffect(() => {
    if (!pendingFocusLine2.current) return;
    pendingFocusLine2.current = false;
    const el = line2Ref.current;
    if (!el) return;
    el.focus();
    const timer = window.setTimeout(() => el.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [value, line1, line2]);

  const commitLine1 = useCallback(
    (rawValue: string) => {
      const typed = [...rawValue];
      const nextLine1 = typed.slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
      // 25字を超えた分は破棄せず2行目の先頭へ送る
      const overflow = typed.slice(LINE_DETAIL_CHARS_PER_LINE).join("");
      const nextLine2 = overflow ? sanitizeLineDetailLine(overflow + line2) : line2;
      onChange(joinLineDetailLines(nextLine1, nextLine2));
      if ([...nextLine1].length >= LINE_DETAIL_CHARS_PER_LINE) {
        focusLine2();
      }
    },
    [line2, onChange, focusLine2],
  );

  const handleLine1Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // 変換中はDOM側の生テキストを保持し、確定（compositionend）までstateを書き換えない
      if (composingLine1.current) return;
      commitLine1(e.target.value);
    },
    [commitLine1],
  );

  const handleLine1CompositionStart = useCallback(() => {
    composingLine1.current = true;
  }, []);

  const handleLine1CompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      composingLine1.current = false;
      // 確定値で初めてstateへ反映（変換中の文字落ちを防ぐ）
      commitLine1((e.target as HTMLInputElement).value);
    },
    [commitLine1],
  );

  const handleLine1KeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      e.stopPropagation();
      focusLine2();
    },
    [focusLine2],
  );

  const commitLine2 = useCallback(
    (rawValue: string) => {
      onChange(joinLineDetailLines(line1, rawValue));
    },
    [line1, onChange],
  );

  const handleLine2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (composingLine2.current) return;
      commitLine2(e.target.value);
    },
    [commitLine2],
  );

  const handleLine2CompositionStart = useCallback(() => {
    composingLine2.current = true;
  }, []);

  const handleLine2CompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      composingLine2.current = false;
      commitLine2((e.target as HTMLInputElement).value);
    },
    [commitLine2],
  );

  const handleLine2KeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="grid gap-1.5" data-print-detail-field>
      <Label className="text-sm font-medium text-foreground">{label}</Label>

      <div className="grid gap-1">
        <Label htmlFor={`${id}-line1`} className="text-xs font-normal text-muted-foreground">
          1行目（{LINE_DETAIL_CHARS_PER_LINE}字まで）
        </Label>
        <input
          ref={line1Ref}
          id={`${id}-line1`}
          type="text"
          value={line1}
          onChange={handleLine1Change}
          onCompositionStart={handleLine1CompositionStart}
          onCompositionEnd={handleLine1CompositionEnd}
          onKeyDown={handleLine1KeyDown}
          placeholder={placeholder}
          className={cn(printDetailLineInputClassName, stats.line1Len >= LINE_DETAIL_CHARS_PER_LINE && "border-amber-500/70")}
        />
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {stats.line1Len}/{LINE_DETAIL_CHARS_PER_LINE}字
          {stats.line1Len >= LINE_DETAIL_CHARS_PER_LINE ? "（満杯・Enterまたは2行目へ移動）" : null}
        </p>
      </div>

      <div className={cn("grid gap-1", showLine2Hint && "rounded-md border border-amber-400/60 bg-amber-50/50 p-2 dark:bg-amber-950/20")}>
        <Label htmlFor={`${id}-line2`} className="text-xs font-normal text-muted-foreground">
          2行目（{LINE_DETAIL_CHARS_PER_LINE}字まで・任意）
          {showLine2Hint ? <span className="ml-1 font-medium text-amber-700 dark:text-amber-400">← 続きはここに入力</span> : null}
        </Label>
        <input
          ref={line2Ref}
          id={`${id}-line2`}
          type="text"
          value={line2}
          onChange={handleLine2Change}
          onCompositionStart={handleLine2CompositionStart}
          onCompositionEnd={handleLine2CompositionEnd}
          onKeyDown={handleLine2KeyDown}
          placeholder="例：註文済み数量１個へ変更"
          className={cn(printDetailLineInputClassName, stats.line2Len >= LINE_DETAIL_CHARS_PER_LINE && "border-amber-500/70")}
        />
        <p className="text-[10px] text-muted-foreground tabular-nums">{stats.line2Len}/{LINE_DETAIL_CHARS_PER_LINE}字</p>
      </div>

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <p className={cn("text-xs tabular-nums", stats.isFull ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
        合計 {stats.used}/{LINE_DETAIL_MAX_CHARS}字
        {stats.isFull ? "（上限です。続きはコメント欄へ）" : `（残り${stats.remaining}字）`}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">{printDetailFieldHint}</p>
    </div>
  );
}
