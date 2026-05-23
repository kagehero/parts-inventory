import path from "path";

import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUploadRoot } from "@/lib/storage/local";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const record = await prisma.repairHistory.findUnique({ where: { id } });

  if (!record) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (record.storageKind === "BLOB" && record.pdfUrl.startsWith("https://")) {
    return NextResponse.redirect(record.pdfUrl, 302);
  }

  const abs = path.join(getUploadRoot(), record.storedFileKey);

  try {
    const buf = await readFile(abs);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": record.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.fileName)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 404 });
  }
}
