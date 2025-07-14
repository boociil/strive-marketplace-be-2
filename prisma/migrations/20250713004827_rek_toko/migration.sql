/*
  Warnings:

  - Added the required column `tokoId` to the `Transaksi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaksi" ADD COLUMN     "tokoId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "an_rek" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "rek_toko" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
