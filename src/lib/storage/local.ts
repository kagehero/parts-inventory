import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export function getUploadRoot() {
  const root = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "repairs");
  return path.resolve(root);
}

export async function saveRepairPdf(
  buf: Buffer,
  originalFileName: string,
): Promise<{ key: string; absolutePath: string }> {
  const root = getUploadRoot();
  await mkdir(root, { recursive: true });
  const ext = path.extname(originalFileName) || ".pdf";
  const key = `${Date.now().toString(36)}_${crypto.randomBytes(8).toString("hex")}${ext}`;
  const absolutePath = path.join(root, key);
  await writeFile(absolutePath, buf);
  return { key, absolutePath };
}
