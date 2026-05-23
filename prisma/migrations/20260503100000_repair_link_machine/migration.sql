-- AlterTable
ALTER TABLE "repair_histories" ADD COLUMN "machineId" TEXT;

-- CreateIndex
CREATE INDEX "repair_histories_machineId_idx" ON "repair_histories"("machineId");

-- AddForeignKey
ALTER TABLE "repair_histories" ADD CONSTRAINT "repair_histories_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
