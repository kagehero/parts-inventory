import Link from "next/link";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { MotionFade } from "@/components/motion-fade";
import { Button } from "@/components/ui/button";
import { jpDateLabel } from "@/lib/utils";
import { getDashboardKpis } from "@/server/services/dashboard-metrics.service";

export default async function DashboardPage() {
  const metrics = await getDashboardKpis();

  return (
    <main className="flex min-h-[70vh] flex-1 flex-col">
      <div className="border-b border-border/90 bg-background/95 px-5 py-[18px] shadow-[inset_0_-1px_0_hsl(var(--border)/0.5)] backdrop-blur-sm sm:px-8">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Overview</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[24px]">ダッシュボード</h1>
            <p className="max-w-xl text-[13px] text-muted-foreground">ご利用日 {jpDateLabel(new Date())}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="shadow-inner shadow-indigo-100/30">
              <Link href="/dashboard/parts/new">部品登録（全画面）</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/outgoing/new">出庫登録</Link>
            </Button>
          </div>
        </div>
      </div>

      <MotionFade className="flex-1 space-y-10 px-5 py-8 sm:px-8">
        <DashboardOverview
          parts={metrics.parts}
          qty={metrics.qty}
          openOrders={metrics.openOrders}
          movesToday={metrics.movesToday}
          stockDisplay={metrics.stockDisplay}
        />
      </MotionFade>
    </main>
  );
}
