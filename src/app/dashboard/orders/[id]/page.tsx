import { notFound } from "next/navigation";
import Link from "next/link";

import { DashboardPageFrame, DashboardContent } from "@/components/layout/dashboard-page-frame";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { ReceiveLineControl } from "@/components/orders/receive-line-control";
import { AppendOrderLineForm } from "@/components/orders/append-order-line-form";
import { OrderDetailPrintBar } from "@/components/orders/order-detail-print-bar";
import { OrderReferenceLinks } from "@/components/orders/order-reference-links";
import { OrderHeaderEditForm } from "@/components/orders/order-header-edit-form";
import { OrderLineManage } from "@/components/orders/order-line-manage";
import { OrderAttachmentsPanel } from "@/components/orders/order-attachments-panel";
import { OrderShareEmailPanel } from "@/components/orders/order-share-email-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderStatusLabel, orderLineStatusLabel, orderDocumentTypeLabel } from "@/lib/labels";
import { resolvePrintPartNo } from "@/lib/orders/print-display";
import { jpDateLabel } from "@/lib/utils";
import { getOrderWithLines } from "@/server/services/orders.service";
import { listSuppliersAlphabetical } from "@/server/services/suppliers.service";

type ParamsPromise = Promise<{ id: string }>;

export default async function OrderDetailPage(props: { params: ParamsPromise }) {
  const { id } = await props.params;

  const [order, suppliers] = await Promise.all([
    getOrderWithLines(id),
    listSuppliersAlphabetical(),
  ]);

  if (!order) return notFound();

  const canModify = order.status !== "CANCELLED";
  const showReceive = order.documentType === "PURCHASE_ORDER";

  return (
    <DashboardPageFrame minHeight="screen">
      <DashboardHeader
        title="注文明細／注文書"
        description={`${orderDocumentTypeLabel[order.documentType]}・${orderStatusLabel[order.status]}／相手先：${order.supplierName ?? "—"}${order.supplierHonorific?.trim() ? ` ${order.supplierHonorific.trim()}` : ""}`}
        actions={
          <Link href="/dashboard/orders" className="text-xs uppercase tracking-wide underline">
            ← 一覧
          </Link>
        }
      />

      <DashboardContent className="gap-6 px-8 py-6">
        <OrderDetailPrintBar orderId={order.id} />
        <OrderReferenceLinks />
        {(!order.supplierName || !order.contactName) && canModify ? (
          <div className="rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>発注先または発注元担当者名が未入力です。</strong>
            <br />
            下の「注文ヘッダ・連絡先の編集」欄から入力・保存してください（発注元担当者名は必須、発注先担当者名は任意）。
          </div>
        ) : null}
        {canModify && order.lines.length === 0 ? (
          <div className="rounded-lg border border-blue-400/50 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 dark:bg-blue-950/25 dark:text-blue-100">
            <strong>明細がまだありません。</strong>
            <br />
            下の「明細を追加」から部品を登録してから「印刷用表示」を開いてください。
          </div>
        ) : null}
        <div className="grid gap-1 text-sm">
          <p>注文日：{jpDateLabel(order.orderDate)}</p>
          <p>
            発注元担当：{order.contactName ?? "—"}／TEL {order.contactPhone ?? "—"}／{order.contactEmail ?? "—"}
          </p>
          <p>
            発注先担当：{order.supplierContactName?.trim() || "—"}／FAX {order.supplierFax ?? "—"}
          </p>
          {order.documentType === "QUOTE_REQUEST" ? (
            <p className="text-xs text-amber-800">
              見積依頼書です。入荷処理は「注文書」に切り替えたうえでマスタ紐付け行のみ可能です。
            </p>
          ) : null}
          <p className="whitespace-pre-line text-muted-foreground">
            社内メモ：{order.memo?.trim() || "—"}
          </p>
          {order.printComment?.trim() ? (
            <p className="whitespace-pre-line text-muted-foreground">
              印刷コメント：{order.printComment.trim()}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <OrderShareEmailPanel orderId={order.id} defaultTo={order.contactEmail} />
          {canModify ? <OrderAttachmentsPanel orderId={order.id} /> : null}
        </div>

        {order.attachments.length ? (
          <ul className="text-sm text-muted-foreground">
            添付ファイル：
            {order.attachments.map((a) => (
              <li key={a.id} className="ml-4 list-disc">
                <a href={a.fileUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                  {a.fileName}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {canModify ? (
          <OrderHeaderEditForm
            orderId={order.id}
            supplierId={order.supplierId}
            supplierName={order.supplierName}
            supplierFax={order.supplierFax}
            supplierHonorific={order.supplierHonorific}
            memo={order.memo}
            printComment={order.printComment}
            documentType={order.documentType}
            contactName={order.contactName}
            contactPhone={order.contactPhone}
            contactEmail={order.contactEmail}
            supplierContactName={order.supplierContactName}
            quoteReplyAmount={order.quoteReplyAmount?.toString() ?? ""}
            quoteReplyLeadTime={order.quoteReplyLeadTime}
            suppliers={suppliers.map((s) => ({
              id: s.id,
              companyName: s.companyName,
              attn: s.attn,
              fax: s.fax,
              phone: s.phone,
              email: s.email,
            }))}
          />
        ) : null}

        {canModify && order.lines.every((l) => l.receivedQty === 0) ? (
          <CancelOrderButton orderId={order.id} />
        ) : null}

        <section className="space-y-3 rounded-lg border border-dashed border-muted px-4 py-4">
          <h2 className="text-sm font-semibold">明細を追加</h2>

          {!canModify ? (
            <p className="text-xs text-muted-foreground">取消済みの注文です。</p>
          ) : (
            <AppendOrderLineForm orderId={order.id} />
          )}
        </section>

        <Table containerClassName="border-muted">
          <TableHeader>
            <TableRow>
              <TableHead>状態</TableHead>
              <TableHead>品目</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>{showReceive ? "入荷 / 編集" : "編集"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => {
              const remaining = line.orderedQty - line.receivedQty;
              const labelName =
                line.lineSource === "FREE_TEXT"
                  ? (line.freeItemName ?? "（自由記述）")
                  : (line.part?.name ?? "—");
              const subParts: string[] = [];
              if (line.lineSource === "FREE_TEXT") {
                if (line.freePartNo?.trim()) subParts.push(line.freePartNo.trim());
              } else {
                subParts.push(`印刷品番: ${resolvePrintPartNo(line)}`);
              }
              const sub =
                line.lineSource === "FREE_TEXT" && subParts.length === 0
                  ? "品番・機体情報は注文書参照"
                  : subParts.join(" · ");
              const lineNote = line.lineNote?.trim();
              const canReceiveLine = showReceive && !!line.partId;

              return (
                <TableRow key={line.id}>
                  <TableCell>{orderLineStatusLabel[line.lineStatus]}</TableCell>
                  <TableCell className="align-top">
                    <div className="text-base font-semibold">{labelName}</div>
                    {sub ? <div className="text-sm text-muted-foreground">{sub}</div> : null}
                    {lineNote ? (
                      <div className="text-xs text-muted-foreground">社内メモ：{lineNote}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="font-semibold">
                      {line.orderedQty}/{line.receivedQty}
                    </div>
                    <div className="text-xs text-muted-foreground">残 {remaining}</div>
                  </TableCell>
                  <TableCell className="min-w-[280px] align-top">
                    {!canModify ? (
                      "—"
                    ) : line.receivedQty > 0 ? (
                      "—"
                    ) : (
                      <div className="space-y-3">
                        {canReceiveLine ? (
                          <ReceiveLineControl orderLineId={line.id} remaining={remaining} />
                        ) : null}
                        {!line.partId ? (
                          <p className="text-xs text-muted-foreground">
                            マスタ未連携行（FAX用・入荷は別途マスタ行で）
                          </p>
                        ) : null}
                        <OrderLineManage
                          lineId={line.id}
                          lineSource={line.lineSource}
                          orderedQty={line.orderedQty}
                          receivedQty={line.receivedQty}
                          lineNote={line.lineNote}
                          lineDetail={line.lineDetail}
                          endCustomerName={line.endCustomerName}
                          printPartNoMode={line.printPartNoMode}
                          printPartNoOverride={line.printPartNoOverride}
                          freePartNo={line.freePartNo}
                          freeItemName={line.freeItemName}
                          oemPartNo={line.part?.oemPartNo ?? null}
                          aftermarketNo={line.part?.aftermarketNo ?? null}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DashboardContent>
    </DashboardPageFrame>
  );
}
