"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";

export function DashboardHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-border/80 bg-background/88 px-5 py-[18px] shadow-[0_1px_36px_-20px_rgba(67,56,202,0.42)] backdrop-blur-md sm:px-8 sm:py-6">
      <div className="pointer-events-none absolute inset-y-6 right-[12%] hidden w-px rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent sm:block" aria-hidden />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-1.5"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground/90">現在の画面</p>
          <h1 className="text-[clamp(20px,2.55vw,24px)] font-semibold leading-tight tracking-tight text-slate-900">
            {title}
          </h1>
          {description ? <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">{description}</p> : null}
        </motion.div>
        <Separator className="sm:hidden bg-border/90" />

        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="flex shrink-0 flex-wrap items-center gap-2 [&_button]:shadow-sm [&_a]:transition-transform [&_a]:motion-safe:active:scale-[0.986]"
        >
          {actions}
        </motion.div>
      </div>
    </header>
  );
}
