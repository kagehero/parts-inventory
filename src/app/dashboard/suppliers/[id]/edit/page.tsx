import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { SupplierEditForm } from "@/components/suppliers/supplier-edit-form";
import { getSupplier } from "@/server/services/suppliers.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function SupplierEditPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader title="仕入先の編集" description={supplier.companyName} />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <SupplierEditForm supplier={supplier} />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/suppliers">
          ← 一覧へ
        </Link>
      </MotionFade>
    </div>
  );
}
