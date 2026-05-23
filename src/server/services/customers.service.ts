import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/server/action-guard";

export async function createCustomer(input: { name: string; municipality: string }) {
  return prisma.customer.create({ data: input });
}

export async function updateCustomer(id: string, input: { name: string; municipality: string }) {
  return prisma.customer.update({ where: { id }, data: input });
}

export async function listCustomersWithMachineCounts(take = 500) {
  return prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { machines: true } },
    },
    take,
  });
}

export async function listCustomersAlphabetical(take = 5000) {
  return prisma.customer.findMany({ orderBy: { name: "asc" }, take });
}

export async function getCustomerWithMachines(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      machines: { orderBy: { modelName: "asc" } },
    },
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  const dependents = await prisma.machine.count({ where: { customerId: id } });
  if (dependents) throw new ActionError("保有機が紐づいている顧客は削除できません");

  const issues = await prisma.usageHistory.count({ where: { customerId: id } });
  if (issues) throw new ActionError("出庫データに関連する顧客は削除できません");

  await prisma.customer.delete({ where: { id } });
}
