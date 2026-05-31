import { DashboardTabLink } from "@/components/layout/dashboard-tab-link";

export function OrderReferenceLinks({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"}>
      <span className="text-foreground/80">参照（別タブ）:</span>
      <DashboardTabLink href="/dashboard/parts" className="text-primary">
        部品マスタ
      </DashboardTabLink>
      <DashboardTabLink href="/dashboard/machines" className="text-primary">
        保有機
      </DashboardTabLink>
      <DashboardTabLink href="/dashboard/customers" className="text-primary">
        顧客
      </DashboardTabLink>
      <DashboardTabLink href="/dashboard/suppliers" className="text-primary">
        仕入先
      </DashboardTabLink>
    </div>
  );
}
