import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

export async function listSuppliersAlphabetical() {
  return prisma.supplier.findMany({
    orderBy: { companyName: "asc" },
  });
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({ where: { id } });
}

export async function createSupplier(input: {
  companyName: string;
  attn?: string | null;
  fax?: string | null;
  phone?: string | null;
  email?: string | null;
  memo?: string | null;
}) {
  return prisma.supplier.create({
    data: {
      companyName: input.companyName.trim(),
      attn: input.attn?.trim() || null,
      fax: input.fax?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      memo: input.memo?.trim() || null,
    },
  });
}

export async function updateSupplier(input: {
  id: string;
  companyName: string;
  attn?: string | null;
  fax?: string | null;
  phone?: string | null;
  email?: string | null;
  memo?: string | null;
}): Promise<void> {
  const row = await prisma.supplier.findUnique({ where: { id: input.id } });
  if (!row) throw new ActionError("仕入先が見つかりません");

  await prisma.supplier.update({
    where: { id: input.id },
    data: {
      companyName: input.companyName.trim(),
      attn: input.attn?.trim() || null,
      fax: input.fax?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      memo: input.memo?.trim() || null,
    },
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const n = await prisma.order.count({ where: { supplierId: id } });
  if (n > 0) throw new ActionError("注文で参照されている仕入先は削除できません");

  await prisma.supplier.delete({ where: { id } });
}
