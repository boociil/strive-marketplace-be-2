/*
  Warnings:

  - You are about to drop the column `productId` on the `Transaksi` table. All the data in the column will be lost.
  - Added the required column `harga` to the `Transaksi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Transaksi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaksi" DROP CONSTRAINT "Transaksi_productId_fkey";

-- AlterTable
ALTER TABLE "Transaksi" DROP COLUMN "productId",
ADD COLUMN     "harga" INTEGER NOT NULL,
ADD COLUMN     "listIdProduk" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL;
