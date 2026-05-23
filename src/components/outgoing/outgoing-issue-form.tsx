"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Customer, Machine } from "@prisma/client";

import { createOutgoingIssue } from "@/features/outgoing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { OutgoingFormValues } from "@/features/outgoing/schemas";

export type PartsOption = { id: string; name: string; currentQty: number };

type Props = {
  customers: Customer[];
  machines: (Machine & { customer: Customer })[];
  parts: PartsOption[];
};

type LineState =
  | { id: number; kind: "master"; partId: string; quantity: number }
  | {
      id: number;
      kind: "adHoc";
      quantity: number;
      itemName: string;
      partNo: string;
      machineModel: string;
      machineUnitNo: string;
      machineEngineNo: string;
    };

export function OutgoingIssueForm(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [lines, setLines] = useState<LineState[]>(() => [
    {
      id: Date.now(),
      kind: "master",
      partId: props.parts[0]?.id ?? "",
      quantity: 1,
    },
  ]);

  const canSubmit =
    lines.length > 0 &&
    lines.every((l) => {
      if (l.kind === "master") {
        return props.parts.length > 0 && !!l.partId && l.quantity > 0;
      }
      return l.itemName.trim().length > 0 && l.quantity > 0;
    });

  function toPayloadLines(): OutgoingFormValues["lines"] {
    return lines.map((l) => {
      if (l.kind === "master") {
        return { kind: "master" as const, partId: l.partId, quantity: l.quantity };
      }
      return {
        kind: "adHoc" as const,
        quantity: l.quantity,
        itemName: l.itemName.trim(),
        partNo: l.partNo.trim() || undefined,
        machineModel: l.machineModel.trim() || undefined,
        machineUnitNo: l.machineUnitNo.trim() || undefined,
        machineEngineNo: l.machineEngineNo.trim() || undefined,
      };
    });
  }

  return (
    <form
      className="max-w-5xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const fd = new FormData(e.currentTarget);
        fd.set("lines", JSON.stringify(toPayloadLines()));

        startTransition(async () => {
          setMessage(null);
          const res = await createOutgoingIssue(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          router.push("/dashboard/outgoing");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="issueDate" showRequired>
            出庫日
          </Label>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">顧客（任意）</Label>
          <select id="customerId" name="customerId" className="h-10 w-full rounded-md border border-input px-3 text-sm">
            <option value="">未選択</option>
            {props.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}／{c.municipality}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="machineId">保有機（任意）</Label>
          <select id="machineId" name="machineId" className="h-10 w-full rounded-md border border-input px-3 text-sm">
            <option value="">未選択</option>
            {props.machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.customer.name} · {m.modelName}／{m.unitNo}
                {m.engineNo ? ` (${m.engineNo})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="memo">メモ（任意）</Label>
          <Textarea id="memo" name="memo" rows={3} />
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">出庫明細</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setLines((prev) =>
                  prev.concat([
                    {
                      id: Date.now(),
                      kind: "master",
                      partId: props.parts[0]?.id ?? "",
                      quantity: 1,
                    },
                  ]),
                )
              }
            >
              行追加（マスタ）
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLines((prev) =>
                  prev.concat([
                    {
                      id: Date.now(),
                      kind: "adHoc",
                      quantity: 1,
                      itemName: "",
                      partNo: "",
                      machineModel: "",
                      machineUnitNo: "",
                      machineEngineNo: "",
                    },
                  ]),
                )
              }
            >
              行追加（品番不明・臨時）
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          伝票未到着で在庫のみ減らす場合は「臨時」行で品名を入れてください。在庫は不足分でも記録されます（マイナス在庫になり得ます）。
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>種別</TableHead>
              <TableHead>内容</TableHead>
              <TableHead className="w-28">数量</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="align-top text-xs">
                  {line.kind === "master" ? "マスタ" : "臨時"}
                </TableCell>
                <TableCell className="align-top">
                  {line.kind === "master" ? (
                    <select
                      className="h-10 w-full max-w-xl rounded-md border border-input px-3 text-[13px]"
                      value={line.partId}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l) => (l.id === line.id ? { ...l, partId: e.target.value } : l)),
                        )
                      }
                    >
                      {props.parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}（在庫 {p.currentQty}）
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="品名 *"
                        value={line.itemName}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l) =>
                              l.id === line.id && l.kind === "adHoc" ? { ...l, itemName: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="品番（任意）"
                        value={line.partNo}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l) =>
                              l.id === line.id && l.kind === "adHoc" ? { ...l, partNo: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="型式"
                        value={line.machineModel}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l) =>
                              l.id === line.id && l.kind === "adHoc" ? { ...l, machineModel: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <Input
                        placeholder="号機"
                        value={line.machineUnitNo}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l) =>
                              l.id === line.id && l.kind === "adHoc" ? { ...l, machineUnitNo: e.target.value } : l,
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.id === line.id ? { ...l, quantity: Number(e.target.value) || 1 } : l,
                        ),
                      )
                    }
                  />
                </TableCell>
                <TableCell className="align-top text-right">
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((row) => row.id !== line.id))}
                  >
                    削除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {props.parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          部品マスタが空です。「臨時」行のみで出庫するか、
          <Link href="/dashboard/parts/new" className="underline">
            部品登録へ
          </Link>
        </p>
      ) : null}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSubmit || pending}>
          {pending ? "処理中..." : "出庫を登録"}
        </Button>
        <Button variant="ghost" type="button" asChild disabled={pending}>
          <Link href="/dashboard/outgoing">戻る</Link>
        </Button>
      </div>
    </form>
  );
}
