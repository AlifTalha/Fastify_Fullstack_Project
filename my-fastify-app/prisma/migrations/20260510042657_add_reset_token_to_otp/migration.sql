/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `password_reset_otps` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "password_reset_otps" ADD COLUMN     "resetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_otps_resetToken_key" ON "password_reset_otps"("resetToken");
