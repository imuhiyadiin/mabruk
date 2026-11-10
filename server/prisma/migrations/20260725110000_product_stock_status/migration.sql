CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'INACTIVE', 'DELETED');
ALTER TABLE "Product" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE';
UPDATE "Product" SET "status" = 'OUT_OF_STOCK' WHERE "quantity" <= 0;
CREATE INDEX "Product_status_quantity_idx" ON "Product"("status", "quantity");
