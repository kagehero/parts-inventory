import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { OrderHeaderCreateForm } from "@/components/orders/order-header-create-form";
import { listSuppliersAlphabetical } from "@/server/services/suppliers.service";

export default async function OrdersNewPage() {
  const suppliers = await listSuppliersAlphabetical();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader title="注文ヘッダ登録" description="書類種別・担当連絡先を入力後、次ページでマスタ／自由記述の明細・添付・印刷・共有が可能です。" />
      <MotionFade className="flex flex-1 flex-col gap-6 px-8 py-6">
        <OrderHeaderCreateForm
          suppliers={suppliers.map((s) => ({
            id: s.id,
            companyName: s.companyName,
            attn: s.attn,
            fax: s.fax,
            phone: s.phone,
            email: s.email,
          }))}
        />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/orders">
          一覧に戻る
        </Link>
      </MotionFade>
    </div>
  );
}
