/*
  Warnings:

  - You are about to drop the column `time_pengaujan` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "time_pengaujan",
ADD COLUMN     "time_pengajuan" TIMESTAMP(3);
