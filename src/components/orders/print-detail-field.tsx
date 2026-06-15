"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  // Chromeはcompositionendがchangeより先に発火する。compositionendで確定commitした直後、
  // 同じ生値でchangeが再commitすると、line2クロージャが古いまま走りあふれ分を二重適用して
  // 直前の確定結果を壊す。compositionendで確定した生値を覚えておき、直後に同じ値のchangeが
  // 来たら再commitを抑止する（値で判定するのでChrome以外の発火順でも誤爆しない）。
  const lastCompositionEndValueLine1 = useRef<string | null>(null);
  const [line1, line2] = useMemo(() => splitLineDetailLines(value), [value]);
  // controlled inputの値は確定済みstateから作るが、IME変換中はDOMの生テキストを尊重するため
  // ローカルのドラフトを表示に使う。変換していないときだけpropsへ追従させる。
  const [draft1, setDraft1] = useState(line1);
  const [draft2, setDraft2] = useState(line2);
  // commit時に参照すべきは「いま画面に見えている内容（draft）」であって、非同期に遅れて届く
  // value由来のline1/line2クロージャではない。refで常に最新のdraftを読めるようにし、
  // 連続入力・あふれ送り時の取りこぼし・ズレを防ぐ。
  const draft1Ref = useRef(draft1);
  draft1Ref.current = draft1;
  const draft2Ref = useRef(draft2);
  draft2Ref.current = draft2;
  useEffect(() => {
    if (!composingLine1.current) setDraft1(line1);
  }, [line1]);
  useEffect(() => {
    if (!composingLine2.current) setDraft2(line2);
  }, [line2]);
  // カウンタは「いま入力欄に見えている文字（draft）」から数える。
  // valueから数えると、IME変換中・あふれ処理中に表示と数がズレて「25/25」なのに
  // 実際は21字…のような嘘表示になる。表示と数は必ず同じソースから出す。
  const stats = useMemo(() => getLineDetailStats(joinLineDetailLines(draft1, draft2)), [draft1, draft2]);
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
    // moveFocus: 25字に達したとき2行目へ移すか。入力途中（変換中・タイプ中）は移さない
    (rawValue: string, moveFocus: boolean) => {
      // 既存の2行目は「いま画面に見えている内容（draft2）」を真とする。
      const currentLine2 = draft2Ref.current;
      const typed = [...rawValue];
      const nextLine1 = typed.slice(0, LINE_DETAIL_CHARS_PER_LINE).join("");
      // 25字を超えた分は破棄せず2行目の先頭へ送る
      const overflow = typed.slice(LINE_DETAIL_CHARS_PER_LINE).join("");
      const nextLine2 = overflow ? sanitizeLineDetailLine(overflow + currentLine2) : currentLine2;
      // 表示（draft）も即同期する。useEffectの非同期同期に頼ると、連続入力時に
      // commitLine1のline2クロージャが古いまま再実行され、あふれた文字が落ちる。
      setDraft1(nextLine1);
      if (overflow) setDraft2(nextLine2);
      onChange(joinLineDetailLines(nextLine1, nextLine2));
      // あふれた（overflowがある）ときだけ自動で2行目へ。25字ちょうどでは奪わない。
      if (moveFocus && overflow) {
        focusLine2();
      }
    },
    [onChange, focusLine2],
  );

  const handleLine1Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // 表示は常にDOMの生テキストへ追従させる（変換前の文字も画面に残す）
      setDraft1(e.target.value);
      // 変換中は親stateを書き換えない（確定＝compositionendまで待つ）
      if (composingLine1.current) return;
      // compositionend直後にChromeが投げてくるchange（＝同じ確定値）はcompositionendで反映済み。
      // ここで再commitすると古いline2クロージャであふれ分を二重適用してしまうのでスキップ。
      if (lastCompositionEndValueLine1.current === e.target.value) {
        lastCompositionEndValueLine1.current = null;
        return;
      }
      // 確定値と違う通常タイプが来たら抑止フラグは無効化する。
      lastCompositionEndValueLine1.current = null;
      // タイプ中（change）はフォーカスを奪わない＝末尾の文字落ちを防ぐ
      commitLine1(e.target.value, false);
    },
    [commitLine1],
  );

  const handleLine1CompositionStart = useCallback(() => {
    composingLine1.current = true;
  }, []);

  const handleLine1CompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      composingLine1.current = false;
      const raw = (e.target as HTMLInputElement).value;
      // 直後にChromeが投げる同値changeのcommitを抑止する目印（値で判定）。
      lastCompositionEndValueLine1.current = raw;
      setDraft1(raw);
      // 確定値で初めてstateへ反映（変換中の文字落ちを防ぐ）。
      // 確定後にあふれていれば2行目へ送ってからフォーカス移動して良い。
      commitLine1(raw, true);
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
      // 1行目も「いま画面に見えている内容（draft1）」を真とする。
      onChange(joinLineDetailLines(draft1Ref.current, rawValue));
    },
    [onChange],
  );

  const handleLine2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft2(e.target.value);
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
      const raw = (e.target as HTMLInputElement).value;
      setDraft2(raw);
      commitLine2(raw);
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
          value={draft1}
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
          value={draft2}
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
