"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import * as React from "react";

import { dashboardNavGroups } from "@/lib/dashboard-nav-config";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function NavSections({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const close = React.useCallback(() => onNavigate?.(), [onNavigate]);

  return (
    <nav className="flex flex-col gap-5 px-4 py-2">
      {dashboardNavGroups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(String(item.href)));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      onClick={() => close()}
                      className={
                        active
                          ? "flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm motion-safe:active:scale-[0.995]"
                          : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-muted/95 hover:text-foreground"
                      }
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Mobile drawer + breadcrumb cue for narrow viewports */
export function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="dashboard-chrome-mobile-nav flex items-center justify-between gap-3 border-b border-border/85 bg-background/90 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
      <motion.div
        layout
        className="min-w-0 flex-1"
        transition={{ duration: 0.2 }}
      >
        <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Menu</p>
        <p className="truncate text-sm font-semibold text-foreground/95">業務コンソール</p>
      </motion.div>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-border/90 bg-card shadow-inner shadow-indigo-100/35 transition-colors hover:bg-primary/[0.08]"
            aria-label="メニューを開く"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(284px,calc(100vw-42px))] border-r border-border bg-card p-0">
          <div className="border-b border-border/80 px-4 py-4">
            <SheetTitle className="text-[15px] font-semibold">部品在庫管理</SheetTitle>
            <p className="text-xs text-muted-foreground">タップで画面を移動</p>
          </div>
          <div className="max-h-[calc(100dvh-7.5rem)] overflow-y-auto py-3">
            <NavSections pathname={pathname} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
