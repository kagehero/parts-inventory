"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jpDateLabel } from "@/lib/utils";

export type OutgoingSlipSerialized = {
  id: string;
  issueDate: string;
  memo: string | null;
  customerName: string;
  municipalityLabel: string;
  machineLabel: string;
  lines: { id: string; partName: string; quantity: number }[];
};

const containerVariant = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.06,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function OutgoingFilteredBoard({ slips }: { slips: OutgoingSlipSerialized[] }) {
  const [q, setQ] = React.useState("");
  const norm = q.trim().toLowerCase();

  const filtered = React.useMemo(() => {
    if (!norm) return slips;
    return slips.filter((s) => {
      const blob = `${s.memo ?? ""} ${s.customerName} ${s.machineLabel} ${s.lines.map((l) => `${l.partName} ${l.quantity}`).join(" ")}`;
      return blob.toLowerCase().includes(norm);
    });
  }, [slips, norm]);

  return (
    <motion.div variants={containerVariant} initial="hidden" animate="visible" className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="顧客・機番・部品・備考で絞り込み…"
          className="max-w-full border-border bg-background shadow-inner shadow-indigo-100/30 sm:w-96"
          aria-label="絞り込み"
        />
        <Badge variant="secondary" className="tabular-nums shadow-sm">
          {filtered.length} / {slips.length} 件
        </Badge>
      </div>

      <div className="flex flex-col gap-6 pb-8">
        {filtered.map((slip) => (
          <motion.div
            variants={cardVariant}
            layout
            key={slip.id}
            transition={{ duration: 0.22 }}
            className="group rounded-xl border border-border/90 bg-card/95 p-4 shadow-[0_1px_28px_-16px_rgba(67,56,202,0.42)] backdrop-blur-sm motion-safe:hover:border-primary/25 motion-safe:hover:shadow-[0_8px_36px_-20px_rgba(67,56,202,0.35)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
              <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-semibold tracking-tight text-foreground">
                {jpDateLabel(new Date(slip.issueDate))}
              </span>
              <span className="text-muted-foreground">
                <span>{slip.customerName}</span>
                <span className="mx-1 text-border">/</span>
                <span>{slip.municipalityLabel}</span>
              </span>
              <span className="text-muted-foreground">{slip.machineLabel}</span>
              </div>
              <Link
                href={`/dashboard/outgoing/${slip.id}#memo`}
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                詳細・メモ
              </Link>
            </div>
            {slip.memo ? (
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">{slip.memo}</p>
            ) : null}

            <Table containerClassName="mt-4 border-muted/90 bg-muted/15">
              <TableHeader className="bg-muted/55">
                <TableRow className="hover:bg-transparent">
                  <TableHead>部品名</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slip.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.partName}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-destructive">
                      {line.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        ))}

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">該当する出庫がありません。</p>
        ) : null}

        <motion.div variants={cardVariant} className="text-center">
          <Link
            href="/dashboard/outgoing/new"
            className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            さらに出庫を登録
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
