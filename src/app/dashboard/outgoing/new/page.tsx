import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { OutgoingIssueForm } from "@/components/outgoing/outgoing-issue-form";
import { getOutgoingIssueFormData } from "@/server/services/usage-history.service";

export default async function OutgoingNewPage() {
  const { customers, machines } = await getOutgoingIssueFormData();

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader
        title="出庫（使用）入力"
        description="部品は検索して選択できます。明細行は自由に増やせます。"
      />
      <DashboardContent className="px-8 py-6">
        <OutgoingIssueForm customers={customers} machines={machines} />
      </DashboardContent>
    </DashboardPageFrame>
  );
}
