-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderLineStatus" AS ENUM ('ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "InventoryLogType" AS ENUM ('PURCHASE_IN', 'USAGE_OUT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "unitNo" TEXT NOT NULL,
    "engineNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oemPartNo" TEXT,
    "aftermarketNo" TEXT,
    "oemListPrice" DECIMAL(12,2),
    "purchasePrice" DECIMAL(12,2),
    "salePrice" DECIMAL(12,2),
    "compatibleModels" TEXT,
    "markupRate" DECIMAL(6,4),
    "currentQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "supplierName" TEXT,
    "memo" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "orderedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2),
    "lineStatus" "OrderLineStatus" NOT NULL DEFAULT 'ORDERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "logType" "InventoryLogType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderLineId" TEXT,
    "usageLineId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_histories" (
    "id" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "machineId" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_history_lines" (
    "id" TEXT NOT NULL,
    "usageHistoryId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_history_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_histories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "repairDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT NOT NULL DEFAULT '',
    "storedFileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_municipality_idx" ON "customers"("municipality");

-- CreateIndex
CREATE INDEX "machines_customerId_idx" ON "machines"("customerId");

-- CreateIndex
CREATE INDEX "machines_modelName_idx" ON "machines"("modelName");

-- CreateIndex
CREATE INDEX "machines_unitNo_idx" ON "machines"("unitNo");

-- CreateIndex
CREATE INDEX "machines_engineNo_idx" ON "machines"("engineNo");

-- CreateIndex
CREATE UNIQUE INDEX "machines_customerId_modelName_unitNo_key" ON "machines"("customerId", "modelName", "unitNo");

-- CreateIndex
CREATE INDEX "parts_name_idx" ON "parts"("name");

-- CreateIndex
CREATE INDEX "parts_oemPartNo_idx" ON "parts"("oemPartNo");

-- CreateIndex
CREATE INDEX "parts_aftermarketNo_idx" ON "parts"("aftermarketNo");

-- CreateIndex
CREATE INDEX "parts_compatibleModels_idx" ON "parts"("compatibleModels");

-- CreateIndex
CREATE INDEX "orders_orderDate_idx" ON "orders"("orderDate");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_supplierName_idx" ON "orders"("supplierName");

-- CreateIndex
CREATE INDEX "order_lines_orderId_idx" ON "order_lines"("orderId");

-- CreateIndex
CREATE INDEX "order_lines_partId_idx" ON "order_lines"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_logs_usageLineId_key" ON "inventory_logs"("usageLineId");

-- CreateIndex
CREATE INDEX "inventory_logs_partId_idx" ON "inventory_logs"("partId");

-- CreateIndex
CREATE INDEX "inventory_logs_occurredAt_idx" ON "inventory_logs"("occurredAt");

-- CreateIndex
CREATE INDEX "inventory_logs_logType_idx" ON "inventory_logs"("logType");

-- CreateIndex
CREATE INDEX "inventory_logs_orderLineId_idx" ON "inventory_logs"("orderLineId");

-- CreateIndex
CREATE INDEX "usage_histories_issueDate_idx" ON "usage_histories"("issueDate");

-- CreateIndex
CREATE INDEX "usage_histories_customerId_idx" ON "usage_histories"("customerId");

-- CreateIndex
CREATE INDEX "usage_histories_machineId_idx" ON "usage_histories"("machineId");

-- CreateIndex
CREATE INDEX "usage_history_lines_usageHistoryId_idx" ON "usage_history_lines"("usageHistoryId");

-- CreateIndex
CREATE INDEX "usage_history_lines_partId_idx" ON "usage_history_lines"("partId");

-- CreateIndex
CREATE INDEX "repair_histories_repairDate_idx" ON "repair_histories"("repairDate");

-- CreateIndex
CREATE INDEX "repair_histories_title_idx" ON "repair_histories"("title");

-- CreateIndex
CREATE INDEX "repair_histories_storedFileKey_idx" ON "repair_histories"("storedFileKey");

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "order_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_usageLineId_fkey" FOREIGN KEY ("usageLineId") REFERENCES "usage_history_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_histories" ADD CONSTRAINT "usage_histories_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_histories" ADD CONSTRAINT "usage_histories_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_history_lines" ADD CONSTRAINT "usage_history_lines_usageHistoryId_fkey" FOREIGN KEY ("usageHistoryId") REFERENCES "usage_histories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_history_lines" ADD CONSTRAINT "usage_history_lines_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

