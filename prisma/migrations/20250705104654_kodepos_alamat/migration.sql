/*
  Warnings:

  - Added the required column `kodePos` to the `Alamat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Alamat" ADD COLUMN     "kodePos" TEXT NOT NULL;
