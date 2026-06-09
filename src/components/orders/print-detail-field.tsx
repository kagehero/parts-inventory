"use client";

import { useCallback } from "react";

import {
  LINE_DETAIL_MAX_CHARS,
  printDetailFieldHint,
  printDetailInputClassName,
  sanitizeLineDetailInput,
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
  placeholder = "例：型式・号機・エンジンNo.／受注後1〜2日入荷 など",
}: PrintDetailFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(sanitizeLineDetailInput(e.target.value));
    },
    [onChange],
  );

  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <textarea
        id={id}
        name={name}
        rows={2}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          printDetailInputClassName,
          "rounded-md border border-input bg-background shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{printDetailFieldHint}</p>
    </div>
  );
}
