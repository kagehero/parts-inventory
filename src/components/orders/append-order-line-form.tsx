"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderLinePrintPartNoMode } from "@prisma/client";

import { appendOrderLine } from "@/features/orders/actions";
import type { PartPickerRow } from "@/server/services/parts.service";
import { PartPicker } from "@/components/parts/part-picker";
import { OrderReferenceLinks } from "@/components/orders/order-reference-links";
import { PrintDetailField } from "@/components/orders/print-detail-field";
import { printPartNoModeLabels, resolvePrintPartNo, sanitizeLineDetailInput } from "@/lib/orders/print-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AppendOrderLineForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"MASTER" | "FREE_TEXT">("MASTER");
  const [partId, setPartId] = useState("");
  const [selectedPart, setSelectedPart] = useState<PartPickerRow | null>(null);
  const [qty, setQty] = useState(1);
  const [partNoMode, setPartNoMode] = useState<OrderLinePrintPartNoMode>("AUTO_AFTERMARKET");
  const [partNoOverride, setPartNoOverride] = useState("");
  const [lineDetail, setLineDetail] = useState("");
  const [endCustomerName, setEndCustomerName] = useState("");

  const previewLine =
    mode === "MASTER" && selectedPart
      ? {
          lineSource: "MASTER" as const,
          freePartNo: null,
          freeItemName: null,
          machineModel: null,
          machineUnitNo: null,
          machineEngineNo: null,
          printPartNoMode: partNoMode,
          printPartNoOverride: partNoOverride,
          lineDetail,
          endCustomerName,
          part: {
            name: selectedPart.name,
            oemPartNo: selectedPart.oemPartNo,
            aftermarketNo: selectedPart.aftermarketNo,
            compatibleModels: null,
          },
        }
      : null;

  const masterReady = mode !== "MASTER" || !!partId;

  return (
    <div className="grid gap-4 md:max-w-2xl">
      <OrderReferenceLinks />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "MASTER" ? "default" : "outline"}
          onClick={() => setMode("MASTER")}
        >
          マスタから選択
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "FREE_TEXT" ? "default" : "outline"}
          onClick={() => setMode("FREE_TEXT")}
        >
          直接入力（品名・品番・機体情報）
        </Button>
      </div>

      <form
        key={mode}
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          fd.delete("partId");
          fd.set("orderId", orderId);
          fd.set("lineMode", mode);
          if (mode === "MASTER") {
            fd.set("partId", partId.trim());
            fd.set("printPartNoMode", partNoMode);
            if (partNoMode === "CUSTOM") {
              fd.set("printPartNoOverride", partNoOverride);
            }
          }
          fd.set("lineDetail", sanitizeLineDetailInput(lineDetail));
          fd.set("endCustomerName", endCustomerName.trim());
          const lineNoteVal = fd.get("lineNote");
          if (typeof lineNoteVal === "string") {
            fd.set("lineNote", lineNoteVal.trim());
          }
          startTransition(async () => {
            setMessage(null);
            const result = await appendOrderLine(fd);
            if (!result.ok) {
              setMessage(result.message);
              return;
            }
            form.reset();
            setQty(1);
            setPartNoMode("AUTO_AFTERMARKET");
            setPartNoOverride("");
            setLineDetail("");
            setEndCustomerName("");
            router.refresh();
          });
        }}
      >
        {mode === "MASTER" ? (
          <>
            <div className="grid gap-1">
              <Label htmlFor="part-picker-append" className="text-xs text-muted-foreground font-normal" showRequired>
                対象品目（検索）
              </Label>
              <PartPicker
                id="part-picker-append"
                value={partId}
                onChange={(id, part) => {
                  setPartId(id);
                  setSelectedPart(part);
                }}
                required={mode === "MASTER"}
              />
            </div>

            {selectedPart ? (
              <div className="grid gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                <p className="text-sm font-medium text-foreground">{selectedPart.name}</p>
                <PrintDetailField
                  id="lineDetailAppend"
                  name="lineDetail"
                  value={lineDetail}
                  onChange={setLineDetail}
                />
                <div className="grid gap-1">
                  <Label htmlFor="endCustomerAppend" className="text-xs text-muted-foreground font-normal">
                    お客様名（仕切単価の右・印刷用）
                  </Label>
                  <Input
                    id="endCustomerAppend"
                    name="endCustomerName"
                    value={endCustomerName}
                    onChange={(e) => setEndCustomerName(e.target.value)}
                    placeholder="例：花園"
                  />
                </div>
              <div className="grid gap-2 rounded border border-dashed border-border/70 bg-muted/10 p-2">
                <Label htmlFor="append-partno-mode" className="text-xs font-normal">
                  印刷用品番
                </Label>
                <select
                  id="append-partno-mode"
                  name="printPartNoMode"
                  className="h-9 rounded-md border border-input px-2 text-xs"
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
                  マスタ: 純正 {selectedPart.oemPartNo || "—"} ／ 社外 {selectedPart.aftermarketNo || "—"}
                </p>
                {partNoMode === "CUSTOM" ? (
                  <Input
                    name="printPartNoOverride"
                    className="h-8 text-xs"
                    value={partNoOverride}
                    onChange={(e) => setPartNoOverride(e.target.value)}
                    placeholder="この注文だけの品番"
                    required
                  />
                ) : null}
                {previewLine ? (
                  <p className="text-[10px] font-medium text-foreground">
                    印刷プレビュー: {resolvePrintPartNo(previewLine)}
                  </p>
                ) : null}
              </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                部品名・品番で検索して選択してください。マスタが空の場合は「直接入力」に切り替えてください。
              </p>
            )}
          </>
        ) : (
          <div className="grid gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 sm:grid-cols-2">
            <div className="grid gap-1 sm:col-span-2">
              <Label
                htmlFor="freeItemName-append"
                className="text-xs text-muted-foreground font-normal"
                showRequired
              >
                品名
              </Label>
              <Input id="freeItemName-append" name="freeItemName" required={mode === "FREE_TEXT"} placeholder="例：Vベルト A-52" />
            </div>
            <div className="sm:col-span-2">
              <PrintDetailField
                id="lineDetailAppend"
                name="lineDetail"
                value={lineDetail}
                onChange={setLineDetail}
              />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="endCustomerAppendFree" className="text-xs text-muted-foreground font-normal">
                お客様名（仕切単価の右・印刷用）
              </Label>
              <Input
                id="endCustomerAppendFree"
                name="endCustomerName"
                value={endCustomerName}
                onChange={(e) => setEndCustomerName(e.target.value)}
                placeholder="例：花園"
              />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">品番（不明なら空欄）</Label>
              <Input name="freePartNo" placeholder="OEM / 社外品番" />
            </div>
          </div>
        )}

        <div className="grid gap-1">
          <Label htmlFor="lineNoteAppend" className="text-xs text-muted-foreground font-normal">
            社内メモ（任意・印刷に含めません）
          </Label>
          <Textarea id="lineNoteAppend" name="lineNote" rows={2} placeholder="社内用メモ" />
        </div>

        <div className="grid gap-3 md:grid-cols-[150px_auto] md:items-end">
          <div className="grid gap-1">
            <Label htmlFor="orderedQty" className="text-xs text-muted-foreground font-normal" showRequired>
              数量
            </Label>
            <Input
              id="orderedQty"
              name="orderedQty"
              type="number"
              required
              min={1}
              step="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <Button type="submit" disabled={pending || !masterReady}>
            {pending ? "処理中..." : "行を追加"}
          </Button>
        </div>
        <div className="grid gap-1 md:col-span-full">
          <p className="text-xs text-muted-foreground">
            定価・仕切単価・納期は印刷書類では発注先記入用の空欄になります（ここでは入力不要）。
          </p>
        </div>
        {message ? <p className="text-sm text-destructive">{message}</p> : null}
      </form>
    </div>
  );
}
