import { DashboardContent, DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { OutgoingIssueForm } from "@/components/outgoing/outgoing-issue-form";
import { getOutgoingIssueFormData } from "@/server/services/usage-history.service";

export default async function OutgoingNewPage() {
  const { customers, machines, parts } = await getOutgoingIssueFormData();

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader
        title="出庫（使用）入力"
        description="部品リストは自由に増やせます。在庫不足のときは自動で処理を中止します。"
      />
      <DashboardContent className="px-8 py-6">
        <OutgoingIssueForm customers={customers} machines={machines} parts={parts} />
      </DashboardContent>
    </DashboardPageFrame>
  );
}
