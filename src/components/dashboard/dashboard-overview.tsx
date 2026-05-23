"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Boxes, PackageOpen, Truck, Warehouse } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardOverview({
  parts,
  qty,
  openOrders,
  movesToday,
  stockDisplay,
}: {
  parts: number;
  qty: number;
  openOrders: number;
  movesToday: number;
  stockDisplay: string;
}) {
  const cards = [
    { title: "マスタ商品目", metric: parts, Icon: Boxes, hint: "" },
    { title: "総在庫数量", metric: qty, Icon: Warehouse, hint: "" },
    { title: "未完の注文", metric: openOrders, Icon: Truck, hint: "" },
    { title: "本日の仕訳件数", metric: movesToday, Icon: PackageOpen, hint: "InventoryLog／今日" },
  ];

  const listVariant = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.div variants={listVariant} initial="hidden" animate="visible" className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, metric, Icon, hint }) => (
          <motion.div variants={itemVariant} key={title}>
            <Card className="border-border/90 bg-card/92 shadow-[0_10px_50px_-32px_rgba(67,56,202,0.82)] backdrop-blur-sm motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-xl motion-safe:hover:shadow-primary/15 transition-[transform,box-shadow] duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {title}
                </CardTitle>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{metric}</p>
                {hint ? <p className="mt-3 text-[11px] text-muted-foreground">{hint}</p> : (
                  <p className="mt-3 text-[11px] text-muted-foreground opacity-75">自動集計値</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <motion.div variants={itemVariant}>
        <Card className="border-primary/25 bg-card/93 shadow-[0_18px_64px_-30px_rgba(67,56,202,0.62)] backdrop-blur-sm">
          <CardHeader className="border-b border-border/65 bg-muted/25">
            <CardTitle className="text-[15px] font-semibold">仕入評価額の目安（掛売価未反映）</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-[15px] leading-relaxed text-muted-foreground">{stockDisplay}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild className="shadow-inner shadow-indigo-100/35">
                <Link href="/dashboard/parts/new">部品を登録</Link>
              </Button>
              <Button size="sm" asChild className="shadow-inner shadow-white/70">
                <Link href="/dashboard/outgoing/new">出庫登録へ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
