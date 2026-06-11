"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";

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
  const [line1, line2] = useMemo(() => splitLineDetailLines(value), [value]);
  const stats = useMemo(() => getLineDetailStats(value), [value]);
  const showLine2Hint = stats.line1Len >= LINE_DETAIL_CHARS_PER_LINE && stats.line2Len === 0;

  const scheduleFocusLine2 = useCallback(() => {
    pendingFocusLine2.current = true;
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

  const handleLine1Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextLine1 = e.target.value;
      onChange(joinLineDetailLines(nextLine1, line2));
      if ([...sanitizeLineDetailLine(nextLine1)].length >= LINE_DETAIL_CHARS_PER_LINE) {
        scheduleFocusLine2();
      }
    },
    [line2, onChange, scheduleFocusLine2],
  );

  const handleLine1KeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      e.stopPropagation();
      scheduleFocusLine2();
    },
    [scheduleFocusLine2],
  );

  const handleLine2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(joinLineDetailLines(line1, e.target.value));
    },
    [line1, onChange],
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
