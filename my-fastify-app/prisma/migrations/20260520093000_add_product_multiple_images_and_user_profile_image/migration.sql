-- AlterTable
ALTER TABLE "users" ADD COLUMN "profileImageUrl" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill existing single imageUrl into imageUrls array
UPDATE "products"
SET "imageUrls" = ARRAY["imageUrl"]
WHERE "imageUrl" IS NOT NULL;

-- Ensure non-null array values
UPDATE "products"
SET "imageUrls" = ARRAY[]::TEXT[]
WHERE "imageUrls" IS NULL;

-- Enforce NOT NULL now that values are backfilled
ALTER TABLE "products" ALTER COLUMN "imageUrls" SET NOT NULL;
