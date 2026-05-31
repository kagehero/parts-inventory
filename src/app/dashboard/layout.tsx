import { DashboardChrome } from "@/components/layout/dashboard-chrome";
import { DashboardFontScale } from "@/components/layout/dashboard-font-scale";

export const dynamic = "force-dynamic";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardFontScale />
      <DashboardChrome>{children}</DashboardChrome>
    </>
  );
}
