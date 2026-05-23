"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Settings2,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

import { dashboardNavGroups } from "@/lib/dashboard-nav-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 w-[276px] max-h-dvh flex-col border-r border-border/85 bg-card/92 text-[13px] shadow-[1px_0_32px_-20px_rgba(67,56,202,0.65)] backdrop-blur-md supports-[backdrop-filter]:bg-card/82">
      <div className="flex shrink-0 items-center gap-3 px-5 py-[18px]">
        <motion.div
          layout
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15 shadow-inner shadow-indigo-200/35"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Settings2 className="h-5 w-5" aria-hidden />
        </motion.div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">部品在庫管理</p>
          <p className="text-[11px] text-muted-foreground">インディゴコンソール</p>
        </div>
      </div>
      <Separator className="shrink-0 bg-border/85" />
      <nav
        aria-label="メインメニュー"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-3 py-5"
      >
        {dashboardNavGroups.map((group) => (
          <motion.div layout key={group.title} transition={{ duration: 0.18 }} className="shrink-0">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/90">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(String(item.href)));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href} prefetch>
                      <span
                        className={cn(
                          "motion-safe:active:scale-[0.993] relative flex items-center gap-2.5 rounded-lg px-3 py-[9px] font-medium outline-none ring-offset-background transition-[background,box-shadow,transform,color] duration-160",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/35"
                            : "text-foreground/78 hover:bg-primary/[0.07] hover:text-foreground hover:shadow-inner hover:shadow-indigo-100/50",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 opacity-95" aria-hidden />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ))}
      </nav>
      <Separator className="shrink-0 bg-border/85" />
      <div className="shrink-0 px-5 py-3">
        <Button
          variant="ghost"
          className="justify-start gap-2 px-3 text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive motion-safe:active:scale-[0.986]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="text-[13px]">ログアウト</span>
        </Button>
      </div>
    </aside>
  );
}
