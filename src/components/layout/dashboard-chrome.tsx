"use client";

import { usePathname } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dashboard-chrome-root flex h-dvh min-h-0 overflow-hidden bg-gradient-to-br from-muted/70 via-background to-background">
      <div className="dashboard-chrome-sidebar hidden h-dvh min-h-0 shrink-0 overflow-hidden lg:flex">
        <Sidebar />
      </div>
      <div className="dashboard-chrome-main-pane flex min-h-0 flex-1 flex-col overflow-hidden">
        <MobileNav pathname={pathname} />
        <div className="dashboard-chrome-main-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
