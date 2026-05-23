import Link from "next/link";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MotionFade } from "@/components/motion-fade";
import { PartForm } from "@/components/parts/part-form";

export default function PartsNewPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <DashboardHeader
        title="部品マスタ作成"
        description="入力は簡単な項目だけにしました。複雑な価格条件は備考または今後CSV連携してください。"
      />
      <MotionFade className="flex flex-1 flex-col gap-4 px-8 py-6">
        <PartForm />
        <Link className="text-sm text-muted-foreground underline" href="/dashboard/parts">
          一覧に戻る
        </Link>
      </MotionFade>
    </div>
  );
}
