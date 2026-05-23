-- CreateEnum
CREATE TYPE "OrderDocumentType" AS ENUM ('PURCHASE_ORDER', 'QUOTE_REQUEST');

CREATE TYPE "OrderLineSource" AS ENUM ('MASTER', 'FREE_TEXT');

CREATE TYPE "FileStorageKind" AS ENUM ('LOCAL', 'BLOB');

-- AlterTable
ALTER TABLE "parts" ADD COLUMN "isAdHoc" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "orders" ADD COLUMN "documentType" "OrderDocumentType" NOT NULL DEFAULT 'PURCHASE_ORDER';
ALTER TABLE "orders" ADD COLUMN "contactName" TEXT;
ALTER TABLE "orders" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "orders" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "orders" ADD COLUMN "quoteReplyAmount" DECIMAL(12, 2);
ALTER TABLE "orders" ADD COLUMN "quoteReplyLeadTime" TEXT;

ALTER TABLE "order_lines" ADD COLUMN "lineSource" "OrderLineSource" NOT NULL DEFAULT 'MASTER';
ALTER TABLE "order_lines" ADD COLUMN "freeItemName" TEXT;
ALTER TABLE "order_lines" ADD COLUMN "freePartNo" TEXT;
ALTER TABLE "order_lines" ADD COLUMN "machineModel" TEXT;
ALTER TABLE "order_lines" ADD COLUMN "machineUnitNo" TEXT;
ALTER TABLE "order_lines" ADD COLUMN "machineEngineNo" TEXT;

ALTER TABLE "order_lines" ALTER COLUMN "partId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "order_attachments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKind" "FileStorageKind" NOT NULL DEFAULT 'LOCAL',
    "fileUrl" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_attachments_orderId_idx" ON "order_attachments"("orderId");

ALTER TABLE "order_attachments" ADD CONSTRAINT "order_attachments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "repair_histories" ADD COLUMN "storageKind" "FileStorageKind" NOT NULL DEFAULT 'LOCAL';

-- Allow part master cleanup: order lines may reference deleted parts only when nullable FK
ALTER TABLE "order_lines" DROP CONSTRAINT IF EXISTS "order_lines_partId_fkey";
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "orders_documentType_idx" ON "orders"("documentType");
