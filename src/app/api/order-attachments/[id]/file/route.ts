import path from "path";

import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import * as OrdersService from "@/server/services/orders.service";
import { getUploadRoot } from "@/lib/storage/local";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const att = await OrdersService.getOrderAttachmentById(id);

  if (!att) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (att.storageKind === "BLOB" && att.fileUrl.startsWith("https://")) {
    return NextResponse.redirect(att.fileUrl, 302);
  }

  const abs = path.join(getUploadRoot(), att.storageRef);

  try {
    const buf = await readFile(abs);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(att.fileName)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 404 });
  }
}
