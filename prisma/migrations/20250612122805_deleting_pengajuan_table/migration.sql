/*
  Warnings:

  - You are about to drop the `Pengajuan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pengajuan" DROP CONSTRAINT "Pengajuan_accBy_fkey";

-- DropForeignKey
ALTER TABLE "Pengajuan" DROP CONSTRAINT "Pengajuan_userId_fkey";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "acc_by" INTEGER,
ADD COLUMN     "status_pengajuan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "time_pengaujan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "time_terima" TIMESTAMP(3);

-- DropTable
DROP TABLE "Pengajuan";
