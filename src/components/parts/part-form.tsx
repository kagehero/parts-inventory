"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Part } from "@prisma/client";

import { createPart, deletePart, updatePart } from "@/features/parts/actions";
import { useActionResultTransition } from "@/hooks/use-action-result-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function decimalField(v?: { toString(): string } | null) {
  if (!v) return "";
  try {
    return v.toString();
  } catch {
    return "";
  }
}

type Props = {
  part?: Part;
  embedded?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
};

export function PartForm({ part, embedded, onSaved, onCancel }: Props) {
  const router = useRouter();
  const editing = !!part?.id;

  const { pending, errorMessage, run } = useActionResultTransition();

  const inner = (
    <>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <form
        id="part-form"
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          run(
            () =>
              editing && part?.id ? updatePart(part.id, formData) : createPart(formData),
            {
              okMessage: "保存しました",
              onSuccess: () => {
                if (!editing) onSaved?.();
                if (!embedded) router.push("/dashboard/parts");
                router.refresh();
              },
            },
          );
        }}
      >
        <div className="md:col-span-2 grid gap-2">
          <Label htmlFor="name" showRequired>
            部品名
          </Label>
          <Input id="name" name="name" defaultValue={part?.name ?? ""} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="oemPartNo">純正パーツNo</Label>
          <Input id="oemPartNo" name="oemPartNo" defaultValue={part?.oemPartNo ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="aftermarketNo">社外パーツNo</Label>
          <Input id="aftermarketNo" name="aftermarketNo" defaultValue={part?.aftermarketNo ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="oemListPrice">純正定価</Label>
          <Input id="oemListPrice" name="oemListPrice" defaultValue={decimalField(part?.oemListPrice)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="purchasePrice">仕入価格</Label>
          <Input id="purchasePrice" name="purchasePrice" defaultValue={decimalField(part?.purchasePrice)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="salePrice">販売価格</Label>
          <Input id="salePrice" name="salePrice" defaultValue={decimalField(part?.salePrice)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="markupRate">掛け率（例: 0.15）</Label>
          <Input id="markupRate" name="markupRate" defaultValue={decimalField(part?.markupRate)} />
        </div>
        <div className="md:col-span-2 grid gap-2">
          <Label htmlFor="compatibleModels">使用型式</Label>
          <Input
            id="compatibleModels"
            name="compatibleModels"
            defaultValue={part?.compatibleModels ?? ""}
            placeholder="例: XX-710 / XX-730"
          />
        </div>
        <div className="grid gap-2 md:col-span-2 rounded-md border border-border/60 bg-muted/20 px-3 py-3">
          <Label className="text-muted-foreground">現在庫</Label>
          {editing ? (
            <>
              <p className="text-lg font-semibold tabular-nums">{part?.currentQty ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                在庫はマスタから直接は変更しません。入荷（注文の受入）で増え、出庫（使用登録）で減ります。履歴は「在庫・履歴」で確認できます。
              </p>
              <Button variant="ghost" size="sm" className="h-auto justify-start p-0 text-xs" asChild>
                <Link href="/dashboard/inventory">在庫・履歴へ</Link>
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">新規登録時の在庫は 0 です。入荷処理後に増えます。</p>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="submit"
          form="part-form"
          disabled={pending}
          className="transition-transform active:scale-[0.985]"
        >
          {pending ? "保存中..." : "保存"}
        </Button>
        {!embedded ? (
          <Button variant="outline" type="button" asChild disabled={pending}>
            <Link href="/dashboard/parts">一覧へ戻る</Link>
          </Button>
        ) : (
          <Button variant="outline" type="button" disabled={pending} onClick={() => onCancel?.()}>
            閉じる
          </Button>
        )}
        {editing && part?.id ? (
          <Button
            variant="destructive"
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("削除してもよいですか？（利用済みの場合は削除できません）")) return;
              run(() => deletePart(part.id), {
                okMessage: "削除しました",
                onSuccess: () => {
                  router.push("/dashboard/parts");
                  router.refresh();
                },
              });
            }}
          >
            削除
          </Button>
        ) : null}
      </div>
    </>
  );

  if (embedded) return <div className="space-y-5">{inner}</div>;

  return (
    <Card className="max-w-3xl border-border/85 shadow-[0_1px_32px_-16px_rgba(67,56,202,0.35)] backdrop-blur-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/25">
        <CardTitle className="text-lg font-semibold tracking-tight">{editing ? "部品編集" : "部品新規"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">{inner}</CardContent>
    </Card>
  );
}
