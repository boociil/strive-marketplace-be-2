/*
  Warnings:

  - Added the required column `variasiId` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "variasiId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_variasiId_fkey" FOREIGN KEY ("variasiId") REFERENCES "Variasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
