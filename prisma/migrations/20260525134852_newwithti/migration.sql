/*
  Warnings:

  - You are about to drop the column `transactionId` on the `PaymentSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PaymentSetting_transactionId_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "PaymentMethodSetting" ADD COLUMN     "transactionIdRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PaymentSetting" DROP COLUMN "transactionId";

-- CreateIndex
CREATE UNIQUE INDEX "Order_transactionId_key" ON "Order"("transactionId");
