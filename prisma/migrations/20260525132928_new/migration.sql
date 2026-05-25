/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `PaymentSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PaymentSetting" ADD COLUMN     "transactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSetting_transactionId_key" ON "PaymentSetting"("transactionId");
