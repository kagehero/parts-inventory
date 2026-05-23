import { Skeleton } from "@/components/ui/skeleton";

export const DashboardShellSkeleton = {
  Header() {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    );
  },

  Toolbar() {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
    );
  },

  CardGrid() {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={String(i)} className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
            <Skeleton className="mb-4 h-3 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>
    );
  },

  Table() {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={String(i)} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  },
};
