-- Phase 2: 印刷向け品番モード・発注先担当者

CREATE TYPE "OrderLinePrintPartNoMode" AS ENUM ('AUTO_AFTERMARKET', 'AUTO_OEM', 'NONE', 'CUSTOM');

ALTER TABLE "orders" ADD COLUMN "supplierContactName" TEXT;

ALTER TABLE "order_lines" ADD COLUMN "printPartNoMode" "OrderLinePrintPartNoMode" NOT NULL DEFAULT 'AUTO_AFTERMARKET';
ALTER TABLE "order_lines" ADD COLUMN "printPartNoOverride" TEXT;
