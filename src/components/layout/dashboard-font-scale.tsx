"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** ダッシュボード表示時のみ本文 rem を約125%に（印刷プレビュー画面は除外） */
export function DashboardFontScale() {
  const pathname = usePathname();
  const isPrintView = pathname.endsWith("/print");

  useEffect(() => {
    if (isPrintView) {
      document.documentElement.classList.remove("dashboard-text-125");
      return;
    }
    document.documentElement.classList.add("dashboard-text-125");
    return () => {
      document.documentElement.classList.remove("dashboard-text-125");
    };
  }, [isPrintView]);

  return null;
}
