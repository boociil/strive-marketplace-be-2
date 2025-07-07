/*
  Warnings:

  - You are about to drop the column `catatan` on the `Alamat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Alamat" DROP COLUMN "catatan",
ADD COLUMN     "bangunan" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nama" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notelp" TEXT NOT NULL DEFAULT '';
