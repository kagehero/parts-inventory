"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createOrderHeader } from "@/features/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type SupplierPickerRow = {
  id: string;
  companyName: string;
  attn: string | null;
  fax: string | null;
  phone: string | null;
  email: string | null;
};

export function OrderHeaderCreateForm({
  initialError,
  suppliers,
}: {
  initialError?: string | null;
  suppliers: SupplierPickerRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(initialError ?? null);

  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierFax, setSupplierFax] = useState("");
  const [supplierHonorific, setSupplierHonorific] = useState("御中");
  const [supplierContactName, setSupplierContactName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          setMessage(null);
          const res = await createOrderHeader(formData);
          if (!res.ok) {
            setMessage(res.message);
            return;
          }
          if (res.data?.id) {
            router.push(`/dashboard/orders/${res.data.id}`);
            router.refresh();
          }
        });
      }}
    >
      <input type="hidden" name="supplierId" value={supplierId} />

      <div className="space-y-2">
        <Label htmlFor="documentType">書類種別</Label>
        <select
          id="documentType"
          name="documentType"
          className="h-10 w-full rounded-md border border-input px-3 text-sm"
          defaultValue="PURCHASE_ORDER"
        >
          <option value="PURCHASE_ORDER">注文書</option>
          <option value="QUOTE_REQUEST">見積依頼</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierPick">仕入先マスタ（任意）</Label>
        <select
          id="supplierPick"
          className="h-10 w-full rounded-md border border-input px-3 text-sm"
          value={supplierId}
          onChange={(e) => {
            const id = e.target.value;
            setSupplierId(id);
            const row = suppliers.find((s) => s.id === id);
            if (!row) {
              return;
            }
            setSupplierName(row.companyName);
            setSupplierFax(row.fax ?? "");
            setSupplierContactName(row.attn ?? "");
            setContactPhone(row.phone ?? "");
            setContactEmail(row.email ?? "");
          }}
        >
          <option value="">選択しない（下で手入力）</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.companyName}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          マスタは
          <Link href="/dashboard/suppliers" className="underline">
            仕入先マスタ
          </Link>
          で登録できます。発注元担当者名は必須、発注先担当者名は任意です。
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierContactName">発注先担当者名（任意）</Label>
        <Input
          id="supplierContactName"
          name="supplierContactName"
          value={supplierContactName}
          onChange={(e) => setSupplierContactName(e.target.value)}
          placeholder="相手方ご担当者（印刷用・任意）"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierName" showRequired>
          発注先（社名など）
        </Label>
        <Input
          id="supplierName"
          name="supplierName"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          placeholder="会社名"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierHonorific">発注先の敬称（印刷に表示）</Label>
        <select
          id="supplierHonorific"
          name="supplierHonorific"
          className="h-10 w-full rounded-md border border-input px-3 text-sm"
          value={supplierHonorific}
          onChange={(e) => setSupplierHonorific(e.target.value)}
        >
          <option value="御中">御中</option>
          <option value="様">様</option>
          <option value="">（付けない）</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierFax">発注先FAX</Label>
        <Input
          id="supplierFax"
          name="supplierFax"
          type="tel"
          value={supplierFax}
          onChange={(e) => setSupplierFax(e.target.value)}
          placeholder="任意"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactName" showRequired>
          発注元担当者名
        </Label>
        <Input
          id="contactName"
          name="contactName"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="氏名"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPhone">連絡先（携帯）</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="090-xxxx-xxxx"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">連絡先（メール）</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="memo">備考メモ</Label>
        <Textarea id="memo" name="memo" rows={4} placeholder="伝票備考など" />
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "作成中..." : "作成して明細へ"}
      </Button>
    </form>
  );
}
