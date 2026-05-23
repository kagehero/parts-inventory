import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { SupplierCreateForm } from "@/components/suppliers/supplier-create-form";

export default function SuppliersNewPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader title="仕入先の新規登録" description="注文作成時に転記する宛先情報を登録します。" />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <SupplierCreateForm />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/suppliers">
          ← 一覧へ
        </Link>
      </MotionFade>
    </div>
  );
}
