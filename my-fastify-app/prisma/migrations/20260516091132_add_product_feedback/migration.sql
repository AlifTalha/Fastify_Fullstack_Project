-- CreateTable
CREATE TABLE "product_feedbacks" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_feedbacks_productId_idx" ON "product_feedbacks"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_feedbacks_productId_userId_key" ON "product_feedbacks"("productId", "userId");

-- AddForeignKey
ALTER TABLE "product_feedbacks" ADD CONSTRAINT "product_feedbacks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedbacks" ADD CONSTRAINT "product_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
