-- Phase 2.5: FAX帳票向けフィールド

ALTER TABLE "orders" ADD COLUMN "printComment" TEXT;

ALTER TABLE "order_lines" ADD COLUMN "lineDetail" TEXT;
ALTER TABLE "order_lines" ADD COLUMN "endCustomerName" TEXT;
