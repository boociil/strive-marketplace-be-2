/*
  Warnings:

  - You are about to drop the column `alamat_toko` on the `Users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_alamat_toko_fkey";

-- AlterTable
ALTER TABLE "Alamat" ADD COLUMN     "is_default" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_toko" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "alamat_toko";
