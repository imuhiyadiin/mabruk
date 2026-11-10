CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'CARD', 'VISA', 'MASTER_CARD');

ALTER TABLE "Payment" RENAME COLUMN "totalAmount" TO "amount";
ALTER TABLE "Payment" DROP COLUMN "balance";
ALTER TABLE "Payment" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';
ALTER TABLE "Payment" ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Payment" ADD COLUMN "transactionId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paymentIntentId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "description" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paidAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");
CREATE UNIQUE INDEX "Payment_paymentIntentId_key" ON "Payment"("paymentIntentId");
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
