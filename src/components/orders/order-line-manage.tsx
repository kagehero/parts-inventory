"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { OrderLinePrintPartNoMode, OrderLineSource } from "@prisma/client";

import { deleteOrderLine, updateOrderLine } from "@/features/orders/actions";
import {
  printDetailFieldHint,
  printDetailInputClassName,
  printPartNoModeLabels,
  resolvePrintPartNo,
} from "@/lib/orders/print-display";
import { notifyActionResult } from "@/lib/toast-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  lineId: string;
  lineSource: OrderLineSource;
  orderedQty: number;
  receivedQty: number;
  lineNote: string | null;
  lineDetail: string | null;
  endCustomerName: string | null;
  printPartNoMode: OrderLinePrintPartNoMode;
  printPartNoOverride: string | null;
  freePartNo: string | null;
  freeItemName: string | null;
  oemPartNo: string | null;
  aftermarketNo: string | null;
};

export function OrderLineManage({
  lineId,
  lineSource,
  orderedQty,
  receivedQty,
  lineNote,
  lineDetail: initialLineDetail,
  endCustomerName: initialEndCustomerName,
  printPartNoMode: initialMode,
  printPartNoOverride: initialOverride,
  freePartNo: initialFreePartNo,
  freeItemName: initialFreeItemName,
  oemPartNo,
  aftermarketNo,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [qty, setQty] = useState(orderedQty);
  const [note, setNote] = useState(lineNote ?? "");
  const [lineDetail, setLineDetail] = useState(initialLineDetail ?? "");
  const [endCustomerName, setEndCustomerName] = useState(initialEndCustomerName ?? "");
  const [partNoMode, setPartNoMode] = useState<OrderLinePrintPartNoMode>(initialMode);
  const [partNoOverride, setPartNoOverride] = useState(initialOverride ?? "");
  const [freePartNo, setFreePartNo] = useState(initialFreePartNo ?? "");
  const [freeItemName, setFreeItemName] = useState(initialFreeItemName ?? "");

  useEffect(() => {
    setQty(orderedQty);
    setNote(lineNote ?? "");
    setLineDetail(initialLineDetail ?? "");
    setEndCustomerName(initialEndCustomerName ?? "");
    setPartNoMode(initialMode);
    setPartNoOverride(initialOverride ?? "");
    setFreePartNo(initialFreePartNo ?? "");
    setFreeItemName(initialFreeItemName ?? "");
  }, [
    orderedQty,
    lineNote,
    initialLineDetail,
    initialEndCustomerName,
    initialMode,
    initialOverride,
    initialFreePartNo,
    initialFreeItemName,
  ]);

  if (receivedQty > 0) return null;

  const previewLine =
    lineSource === "FREE_TEXT"
      ? {
          lineSource: "FREE_TEXT" as const,
          freePartNo,
          freeItemName,
          machineModel: null,
          machineUnitNo: null,
          machineEngineNo: null,
          lineDetail,
          endCustomerName,
          printPartNoMode: partNoMode,
          printPartNoOverride: null,
          part: null,
        }
      : {
          lineSource: "MASTER" as const,
          freePartNo: null,
          freeItemName: null,
          machineModel: null,
          machineUnitNo: null,
          machineEngineNo: null,
          lineDetail,
          endCustomerName,
          printPartNoMode: partNoMode,
          printPartNoOverride: partNoOverride,
          part: {
            name: "",
            oemPartNo,
            aftermarketNo,
            compatibleModels: null,
          },
        };

  return (
    <div className="rounded-md border border-border/80 bg-muted/15 px-3 py-3">
      <p className="mb-2 text-xs font-semibold text-foreground">明細の編集</p>
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        「詳細」は印刷の詳細欄に出ます。入力後は<strong className="font-semibold text-foreground">「更新（印刷に反映）」</strong>
        を押してください（「保存」ボタンはありません）。社内メモは印刷されません。
      </p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("orderLineId", lineId);
          fd.set("orderedQty", String(qty));
          fd.set("lineNote", note);
          fd.set("lineDetail", lineDetail);
          fd.set("endCustomerName", endCustomerName);
          fd.set("printPartNoMode", partNoMode);
          if (lineSource === "FREE_TEXT") {
            fd.set("freePartNo", freePartNo);
            fd.set("freeItemName", freeItemName);
          } else if (partNoMode === "CUSTOM") {
            fd.set("printPartNoOverride", partNoOverride);
          }
          startTransition(async () => {
            setMessage(null);
            const res = await updateOrderLine(fd);
            notifyActionResult(res, "明細を更新しました（印刷用表示にも反映されます）");
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="grid gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
          <div className="grid gap-1">
            <Label htmlFor={`line-detail-${lineId}`} className="text-xs font-medium text-foreground">
              詳細（品名の右・印刷用）
            </Label>
            <Textarea
              id={`line-detail-${lineId}`}
              className={printDetailInputClassName}
              rows={2}
              value={lineDetail}
              onChange={(e) => setLineDetail(e.target.value)}
              placeholder="例：型式・号機・エンジンNo.／受注後1〜2日入荷 など"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">{printDetailFieldHint}</p>
          </div>
          <div className="grid gap-1">
            <Label htmlFor={`end-customer-${lineId}`} className="text-xs font-normal">
              お客様名（仕切単価の右・印刷用）
            </Label>
            <Input
              id={`end-customer-${lineId}`}
              className="h-8 text-xs"
              value={endCustomerName}
              onChange={(e) => setEndCustomerName(e.target.value)}
              placeholder="例：花園"
            />
          </div>
        </div>

        {lineSource === "FREE_TEXT" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor={`free-item-${lineId}`} showRequired className="text-xs font-normal">
                品名
              </Label>
              <Input
                id={`free-item-${lineId}`}
                className="h-8 text-xs"
                value={freeItemName}
                onChange={(e) => setFreeItemName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor={`free-partno-${lineId}`} className="text-xs font-normal">
                品番（印刷用）
              </Label>
              <Input
                id={`free-partno-${lineId}`}
                className="h-8 text-xs"
                value={freePartNo}
                onChange={(e) => setFreePartNo(e.target.value)}
                placeholder="任意"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 rounded border border-dashed border-border/70 bg-background/50 p-2">
            <Label htmlFor={`partno-mode-${lineId}`} className="text-xs font-normal">
              印刷用品番
            </Label>
            <select
              id={`partno-mode-${lineId}`}
              className="h-8 rounded-md border border-input px-2 text-xs"
              value={partNoMode}
              onChange={(e) => setPartNoMode(e.target.value as OrderLinePrintPartNoMode)}
            >
              {(Object.keys(printPartNoModeLabels) as OrderLinePrintPartNoMode[]).map((m) => (
                <option key={m} value={m}>
                  {printPartNoModeLabels[m]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">
              マスタ: 純正 {oemPartNo || "—"} ／ 社外 {aftermarketNo || "—"}
            </p>
            {partNoMode === "CUSTOM" ? (
              <Input
                className="h-8 text-xs"
                value={partNoOverride}
                onChange={(e) => setPartNoOverride(e.target.value)}
                placeholder="この注文だけの品番"
                required
              />
            ) : null}
            <p className="text-[10px] font-medium text-foreground">
              印刷プレビュー: {resolvePrintPartNo(previewLine)}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`order-line-qty-${lineId}`} showRequired className="text-xs text-muted-foreground font-normal">
              発注数
            </Label>
            <Input
              id={`order-line-qty-${lineId}`}
              type="number"
              className="h-8 w-24 text-right"
              required
              min={receivedQty || 1}
              step="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <Button type="submit" size="sm" variant="default" disabled={pending}>
            {pending ? "保存中…" : "更新（印刷に反映）"}
          </Button>
        </div>

        <div className="grid gap-1">
          <Label htmlFor={`order-line-note-${lineId}`} className="text-xs text-muted-foreground font-normal">
            社内メモ（任意・印刷に含めません）
          </Label>
          <Textarea
            id={`order-line-note-${lineId}`}
            rows={2}
            className="min-h-[56px] text-xs"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="社内用メモ"
          />
        </div>
        {message ? <p className="text-xs text-destructive">{message}</p> : null}
      </form>
      <form
        className="mt-3 border-t border-border/60 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!confirm("この明細行を削除しますか？")) return;
          const fd = new FormData();
          fd.set("orderLineId", lineId);
          startTransition(async () => {
            setMessage(null);
            const res = await deleteOrderLine(fd);
            notifyActionResult(res, "明細を削除しました");
            if (!res.ok) {
              setMessage(res.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <Button type="submit" size="sm" variant="destructive" disabled={pending}>
          行を削除
        </Button>
      </form>
    </div>
  );
}
