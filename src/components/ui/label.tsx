"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Asterisk } from "lucide-react";

import { cn } from "@/lib/utils";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

/** アイコン＋強調バッジで「必須」を示すマーカー（`Label` の `showRequired` から自動付与される想定でも単体利用可） */
export function RequiredFieldBadge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-required-badge=""
      {...props}
      title="この項目は必須入力です。"
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded border px-1 py-[1px] shadow-[inset_0_1px_0_0_hsla(48,96%,76%,0.12)] dark:shadow-none",
        "border-amber-600/50 bg-gradient-to-br from-amber-500/[0.18] to-amber-600/[0.1]",
        "text-[10px] font-semibold leading-none tracking-tight text-amber-950 dark:text-amber-50",
        "dark:border-amber-400/48 dark:from-amber-400/[0.14] dark:to-amber-500/[0.08]",
        className,
      )}
    >
      <Asterisk className="size-2.5 shrink-0 -translate-y-px opacity-90" aria-hidden />
      <span>必須</span>
    </span>
  );
}

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & {
    /**
     * 必須項目であることを視覚的に示す（強調バッジ＋アスタリスク）。
     * ブラウザの検証とも併用する場合は、対応する入力に `required` を付けてください。
     */
    showRequired?: boolean;
  };

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, showRequired, children, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        labelVariants(),
        showRequired && "inline-flex flex-wrap items-center gap-x-2 gap-y-1",
        className,
      )}
      {...props}
    >
      {children}
      {showRequired ? <RequiredFieldBadge /> : null}
    </LabelPrimitive.Root>
  ),
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
