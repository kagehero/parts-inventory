import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import * as OrdersService from "@/server/services/orders.service";
import { storeBufferPublic } from "@/lib/storage/binary-upload";

const MAX_BYTES = 12 * 1024 * 1024;

const metaSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "invalid_content_type" }, { status: 400 });
  }

  const form = await req.formData();
  const orderId = String(form.get("orderId") ?? "");
  const meta = metaSchema.safeParse({ orderId });
  if (!meta.success) {
    return NextResponse.json({ ok: false, error: "validation", message: "注文IDが不正です" }, { status: 400 });
  }

  const ord = await OrdersService.getOrderWithLines(meta.data.orderId);
  if (!ord) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_size" }, { status: 400 });
  }

  const uploadedName = typeof (file as File).name === "string" ? (file as File).name : "attachment";
  const mimeType = file.type || "application/octet-stream";

  let stored: Awaited<ReturnType<typeof storeBufferPublic>>;
  try {
    stored = await storeBufferPublic(buf, "orders", uploadedName, mimeType);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "storage", message: "保存に失敗しました。BLOB_READ_WRITE_TOKEN またはディスク権限を確認してください。" },
      { status: 500 },
    );
  }

  if (stored.storageKind === "BLOB") {
    await OrdersService.createOrderAttachmentRecord({
      orderId: ord.id,
      fileName: uploadedName,
      mimeType,
      fileSize: buf.byteLength,
      storageKind: "BLOB",
      fileUrl: stored.fileUrl,
      storageRef: stored.storageRef,
    });
  } else {
    await OrdersService.createOrderAttachmentRecord({
      orderId: ord.id,
      fileName: uploadedName,
      mimeType,
      fileSize: buf.byteLength,
      storageKind: "LOCAL",
      fileUrl: "",
      storageRef: stored.storageRef,
    });
  }

  return NextResponse.json({ ok: true });
}
