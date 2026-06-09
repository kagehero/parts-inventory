"use client";

import { useTransition, useState } from "react";

import { updateOrderHeader } from "@/features/orders/actions";
import type { OrderDocumentType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { SupplierPickerRow } from "./order-header-create-form";

type Props = {
  orderId: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierFax: string | null;
  supplierHonorific: string | null;
  memo: string | null;
  printComment: string | null;
  documentType: OrderDocumentType;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  supplierContactName: string | null;
  quoteReplyAmount: string;
  quoteReplyLeadTime: string | null;
  suppliers: SupplierPickerRow[];
  disabled?: boolean;
};

export function OrderHeaderEditForm({
  orderId,
  supplierId: initialSupplierId,
  supplierName: initialSupplierName,
  supplierFax: initialSupplierFax,
  supplierHonorific: initialHonorific,
  memo,
  printComment,
  documentType,
  contactName,
  contactPhone,
  contactEmail,
  supplierContactName,
  quoteReplyAmount,
  quoteReplyLeadTime,
  suppliers,
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [supplierName, setSupplierName] = useState(initialSupplierName ?? "");
  const [supplierFax, setSupplierFax] = useState(initialSupplierFax ?? "");
  const [supplierHonorific, setSupplierHonorific] = useState(initialHonorific ?? "");
  const [hdrContactName, setHdrContactName] = useState(contactName ?? "");
  const [hdrSupplierContactName, setHdrSupplierContactName] = useState(supplierContactName ?? "");
  const [hdrContactPhone, setHdrContactPhone] = useState(contactPhone ?? "");
  const [hdrContactEmail, setHdrContactEmail] = useState(contactEmail ?? "");

  if (disabled) return null;

  return (
    <form
      className="max-w-xl space-y-3 rounded-lg border border-dashed border-muted px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("orderId", orderId);
        startTransition(async () => {
          setMessage(null);
          const res = await updateOrderHeader(fd);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          window.location.reload();
        });
      }}
    >
      <p className="text-sm font-semibold">注文ヘッダ・連絡先の編集</p>
      <div className="space-y-1">
        <Label htmlFor="hdr-doc">書類種別</Label>
        <select
          id="hdr-doc"
          name="documentType"
          className="h-10 w-full rounded-md border border-input px-2 text-sm"
          defaultValue={documentType}
        >
          <option value="PURCHASE_ORDER">注文書</option>
          <option value="QUOTE_REQUEST">見積依頼</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="hdr-supplier-pick">仕入先マスタ（任意）</Label>
        <select
          id="hdr-supplier-pick"
          name="supplierId"
          className="h-10 w-full rounded-md border border-input px-2 text-sm"
          value={supplierId}
          onChange={(e) => {
            const id = e.target.value;
            setSupplierId(id);
            const row = suppliers.find((s) => s.id === id);
            if (!row) return;
            setSupplierName(row.companyName);
            setSupplierFax(row.fax ?? "");
            setHdrSupplierContactName(row.attn ?? "");
            setHdrContactPhone(row.phone ?? "");
            setHdrContactEmail(row.email ?? "");
          }}
        >
          <option value="">マスタ未使用（手入力）</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.companyName}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          発注元担当者名は必須です。発注先担当者名は任意（印刷用）です。
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="hdr-supplier" showRequired>
          発注先
        </Label>
        <Input
          id="hdr-supplier"
          name="supplierName"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          placeholder="発注先名"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hdr-honorific">発注先の敬称（印刷）</Label>
        <select
          id="hdr-honorific"
          name="supplierHonorific"
          className="h-10 w-full rounded-md border border-input px-2 text-sm"
          value={supplierHonorific}
          onChange={(e) => setSupplierHonorific(e.target.value)}
        >
          <option value="御中">御中</option>
          <option value="様">様</option>
          <option value="">（付けない）</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="hdr-fax">発注先FAX</Label>
        <Input
          id="hdr-fax"
          name="supplierFax"
          type="tel"
          value={supplierFax}
          onChange={(e) => setSupplierFax(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hdr-supplier-contact">発注先担当者名（任意）</Label>
        <Input
          id="hdr-supplier-contact"
          name="supplierContactName"
          value={hdrSupplierContactName}
          onChange={(e) => setHdrSupplierContactName(e.target.value)}
          placeholder="相手方ご担当者"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="hdr-contact-name" showRequired>
          発注元担当者名
        </Label>
        <Input
          id="hdr-contact-name"
          name="contactName"
          value={hdrContactName}
          onChange={(e) => setHdrContactName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-phone">連絡先（携帯）</Label>
        <Input
          id="hdr-phone"
          name="contactPhone"
          type="tel"
          value={hdrContactPhone}
          onChange={(e) => setHdrContactPhone(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-email">連絡先（メール）</Label>
        <Input
          id="hdr-email"
          name="contactEmail"
          type="email"
          value={hdrContactEmail}
          onChange={(e) => setHdrContactEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-memo">社内メモ（印刷に含めません）</Label>
        <Textarea id="hdr-memo" name="memo" rows={2} defaultValue={memo ?? ""} placeholder="社内用の備考" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="hdr-print-comment">コメント（印刷用・下部欄）</Label>
        <Textarea
          id="hdr-print-comment"
          name="printComment"
          rows={4}
          defaultValue={printComment ?? ""}
          placeholder="注文書全体の特記事項、行の備考の続き、返信メモなど"
        />
        <p className="text-[11px] text-muted-foreground">
          FAX印刷の下部「コメント」欄に表示されます。入力後は下の<strong className="font-semibold text-foreground">「ヘッダを保存」</strong>
          を押してから印刷用表示を開いてください。
        </p>
      </div>
      <div className="rounded-md border border-dashed border-muted/80 bg-muted/20 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">見積回答（社内メモ・後から転記）</p>
        <div className="space-y-1">
          <Label htmlFor="hdr-quote-amt" className="text-xs font-normal text-muted-foreground">
            見積金額（税別など運用に合わせて）
          </Label>
          <Input
            id="hdr-quote-amt"
            name="quoteReplyAmount"
            defaultValue={quoteReplyAmount ?? ""}
            placeholder="例：125000"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hdr-quote-lead" className="text-xs font-normal text-muted-foreground">
            納期回答
          </Label>
          <Input
            id="hdr-quote-lead"
            name="quoteReplyLeadTime"
            defaultValue={quoteReplyLeadTime ?? ""}
            placeholder="例：受注後2週間"
          />
        </div>
      </div>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "保存中…" : "ヘッダを保存"}
      </Button>
    </form>
  );
}
