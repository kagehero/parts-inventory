"use client";

import { useCallback } from "react";

import {
  LINE_DETAIL_INPUT_MAX_CHARS,
  type LineDetailInputMode,
  getPrintDetailFieldHint,
  printDetailInputClassName,
  printDetailInputModeClass,
  sanitizeLineDetailInput,
} from "@/lib/orders/print-display";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PrintDetailFieldProps = {
  id: string;
  name?: string;
  label?: string;
  mode: LineDetailInputMode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PrintDetailField({
  id,
  name,
  label = "詳細（品名の右・印刷用）",
  mode,
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
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <Textarea
        id={id}
        name={name}
        rows={3}
        maxLength={LINE_DETAIL_INPUT_MAX_CHARS}
        className={cn(printDetailInputClassName, printDetailInputModeClass(mode))}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{getPrintDetailFieldHint(mode)}</p>
    </div>
  );
}
