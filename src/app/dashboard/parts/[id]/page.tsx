import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardPageFrame, DashboardContent } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PartForm } from "@/components/parts/part-form";
import { findPartById } from "@/server/services/parts.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function PartDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;

  const part = await findPartById(id);

  if (!part) return notFound();

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader title="部品を編集" description={part.name} />
      <DashboardContent className="px-8 py-6">
        <nav className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard/inventory" className="underline hover:text-primary">
            ← 在庫一覧へ
          </Link>
          <Link href={`/dashboard/parts/${part.id}/ledger`} className="font-medium text-primary underline">
            「{part.name}」の入出庫履歴一覧を開く
          </Link>
        </nav>
        <PartForm part={part} />
      </DashboardContent>
    </DashboardPageFrame>
  );
}
