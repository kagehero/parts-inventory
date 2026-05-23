"use client";

import { useTransition, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { OrderLinePrintPartNoMode } from "@prisma/client";

import { appendOrderLine } from "@/features/orders/actions";
import { printPartNoModeLabels, resolvePrintPartNo } from "@/lib/orders/print-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PartSel = {
  id: string;
  name: string;
  currentQty: number;
  oemPartNo: string | null;
  aftermarketNo: string | null;
};

export function AppendOrderLineForm({
  orderId,
  parts,
}: {
  orderId: string;
  parts: PartSel[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"MASTER" | "FREE_TEXT">("MASTER");
  const [partId, setPartId] = useState(() => parts[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [partNoMode, setPartNoMode] = useState<OrderLinePrintPartNoMode>("AUTO_AFTERMARKET");
  const [partNoOverride, setPartNoOverride] = useState("");
  const [lineDetail, setLineDetail] = useState("");
  const [endCustomerName, setEndCustomerName] = useState("");

  const selectedPart = useMemo(
    () => parts.find((p) => p.id === partId) ?? null,
    [parts, partId],
  );

  useEffect(() => {
    if (mode !== "MASTER") return;
    if (parts.length === 0) {
      setPartId("");
      return;
    }
    if (!partId || !parts.some((p) => p.id === partId)) {
      setPartId(parts[0]!.id);
    }
  }, [mode, parts, partId]);

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

  return (
    <div className="grid gap-4 md:max-w-2xl">
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
            {parts.length === 0 ? (
              <p className="text-xs text-destructive">
                部品マスタが空です。直接入力に切り替えるか、先に部品登録してください。
              </p>
            ) : (
              <>
                <div className="grid gap-1">
                  <Label htmlFor="part-select" className="text-xs text-muted-foreground font-normal" showRequired>
                    対象品目
                  </Label>
                  <select
                    id="part-select"
                    name="partId"
                    required={mode === "MASTER"}
                    className="h-10 rounded-md border border-input px-2 text-[13px]"
                    value={partId}
                    onChange={(e) => setPartId(e.target.value)}
                  >
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}（現在庫 {p.currentQty}）
                      </option>
                    ))}
                  </select>
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
                    マスタ: 純正 {selectedPart?.oemPartNo || "—"} ／ 社外 {selectedPart?.aftermarketNo || "—"}
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
              </>
            )}
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">品番（不明なら空欄）</Label>
              <Input name="freePartNo" placeholder="OEM / 社外品番" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">仕様機 型式</Label>
              <Input name="machineModel" placeholder="例：SM-720" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">号機</Label>
              <Input name="machineUnitNo" placeholder="例：001" />
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">エンジン No.</Label>
              <Input name="machineEngineNo" placeholder="任意" />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="lineDetailAppend" className="text-xs text-muted-foreground font-normal">
              詳細（品名の右・印刷用）
            </Label>
            <Textarea
              id="lineDetailAppend"
              name="lineDetail"
              rows={2}
              value={lineDetail}
              onChange={(e) => setLineDetail(e.target.value)}
              placeholder="例：型式・号機・エンジンNo.／受注後1〜2日入荷 など"
            />
          </div>
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
        </div>

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
          <Button type="submit" disabled={pending || (mode === "MASTER" && parts.length === 0)}>
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
