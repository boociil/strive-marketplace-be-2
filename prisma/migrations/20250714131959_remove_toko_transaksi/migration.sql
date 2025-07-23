/*
  Warnings:

  - You are about to drop the column `tokoId` on the `Transaksi` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaksi" DROP CONSTRAINT "Transaksi_tokoId_fkey";

-- AlterTable
ALTER TABLE "Transaksi" DROP COLUMN "tokoId";
