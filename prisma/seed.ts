import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash: hash,
      role: "ADMIN",
      name: "管理者",
    },
    create: {
      email: "admin@example.com",
      name: "管理者",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      passwordHash: hash,
      role: "USER",
      name: "一般",
    },
    create: {
      email: "user@example.com",
      name: "一般",
      passwordHash: hash,
      role: "USER",
    },
  });

  let customer =
    (await prisma.customer.findFirst({ where: { name: "サンプル顧客" } })) ??
    (await prisma.customer.create({
      data: {
        name: "サンプル顧客",
        municipality: "兵庫県〇〇町",
      },
    }));

  const existingMachine = await prisma.machine.findFirst({
    where: {
      customerId: customer.id,
      modelName: "SM-720",
      unitNo: "001",
    },
  });

  if (!existingMachine) {
    await prisma.machine.create({
      data: {
        customerId: customer.id,
        modelName: "SM-720",
        unitNo: "001",
        engineNo: "ENG-9001",
      },
    });
  }

  const dupPart = await prisma.part.findFirst({ where: { name: "サンプル部品ベルト" } });

  if (!dupPart) {
    await prisma.part.create({
      data: {
        name: "サンプル部品ベルト",
        oemPartNo: "OEM-0001",
        aftermarketNo: "AFM-AAA",
        oemListPrice: 9800,
        purchasePrice: 5200,
        salePrice: 7800,
        compatibleModels: "SM-710 / SM-720",
        markupRate: 0.15,
        currentQty: 0,
      },
    });
  }

  console.info(`Seed OK. Demo password (unless SEED_ADMIN_PASSWORD set): ${password}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
