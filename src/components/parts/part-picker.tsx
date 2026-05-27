"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { fetchPartPickerRow, searchPartsForPicker } from "@/features/parts/actions";
import type { PartPickerRow } from "@/server/services/parts.service";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatPartLabel(part: PartPickerRow): string {
  const nos = [part.oemPartNo, part.aftermarketNo].filter(Boolean).join(" / ");
  return nos ? `${part.name}（${nos}）— 在庫 ${part.currentQty}` : `${part.name} — 在庫 ${part.currentQty}`;
}

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (partId: string, part: PartPickerRow | null) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export function PartPicker({
  id: idProp,
  name = "partId",
  value,
  onChange,
  required,
  disabled,
  placeholder = "部品名・品番で検索…",
  className,
  inputClassName,
}: Props) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listboxId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PartPickerRow[]>([]);
  const [selected, setSelected] = useState<PartPickerRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applySelection = useCallback(
    (part: PartPickerRow | null) => {
      setSelected(part);
      onChange(part?.id ?? "", part);
      if (part) {
        setQuery(part.name);
      }
    },
    [onChange],
  );

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;

    let cancelled = false;
    (async () => {
      const res = await fetchPartPickerRow(value);
      if (cancelled) return;
      if (res.ok && res.data) {
        applySelection(res.data);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value, selected?.id, applySelection]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      const res = await searchPartsForPicker(query);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.message);
        setResults([]);
        return;
      }
      const rows = res.data ?? [];
      setResults(rows);
      if (!value && rows[0] && query.trim() === "") {
        applySelection(rows[0]);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open, value, applySelection]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative grid gap-1", className)}>
      <input type="hidden" name={name} value={value} required={required} />

      <Input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        className={cn("h-10 text-[13px]", inputClassName)}
        value={open ? query : selected ? formatPartLabel(selected) : query}
        onFocus={() => {
          setOpen(true);
          setQuery(selected?.name ?? "");
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
        >
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">検索中…</p>
          ) : error ? (
            <p className="px-3 py-2 text-xs text-destructive">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">該当する部品がありません</p>
          ) : (
            results.map((part) => (
              <button
                key={part.id}
                type="button"
                role="option"
                aria-selected={part.id === value}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-[13px] hover:bg-muted/80",
                  part.id === value && "bg-primary/10",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  applySelection(part);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{part.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {[part.oemPartNo, part.aftermarketNo].filter(Boolean).join(" / ") || "品番未登録"} · 在庫{" "}
                  {part.currentQty}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );

}
