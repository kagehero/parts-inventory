import { DashboardChrome } from "@/components/layout/dashboard-chrome";

export const dynamic = "force-dynamic";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
