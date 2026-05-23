import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

import { getUploadRoot } from "@/lib/storage/local";

export type StoredBinary = {
  storageKind: "LOCAL" | "BLOB";
  /** Public blob URL, or empty until LOCAL row gets an id (caller sets fileUrl). */
  fileUrl: string;
  /** LOCAL: relative path under upload root; BLOB: URL for `del()`. */
  storageRef: string;
};

export async function storeBufferPublic(
  buf: Buffer,
  folder: "repairs" | "orders",
  originalName: string,
  contentType: string,
): Promise<StoredBinary> {
  const ext = path.extname(originalName) || "";
  const base = `${Date.now().toString(36)}_${crypto.randomBytes(8).toString("hex")}${ext}`;
  const pathname = path.posix.join(folder, base);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(pathname, buf, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: contentType || "application/octet-stream",
    });
    return { storageKind: "BLOB", fileUrl: blob.url, storageRef: blob.url };
  }

  const root = getUploadRoot();
  const dir = path.join(root, folder);
  await mkdir(dir, { recursive: true });
  const abs = path.join(dir, base);
  await writeFile(abs, buf);
  return {
    storageKind: "LOCAL",
    fileUrl: "",
    storageRef: path.posix.join(folder, base),
  };
}
