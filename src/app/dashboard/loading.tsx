import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col">
      <div className="border-b border-border/80 bg-background/90 px-4 py-4 sm:px-8 sm:py-6">
        <DashboardShellSkeleton.Header />
      </div>
      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
        <DashboardShellSkeleton.CardGrid />
      </div>
    </div>
  );
}
