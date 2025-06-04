/*
  Warnings:

  - You are about to drop the column `alamat` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Users` table. All the data in the column will be lost.
  - Added the required column `gender` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "alamat",
DROP COLUMN "username",
ADD COLUMN     "gender" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Alamat" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provinsi" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kode_pos" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "catatan" TEXT NOT NULL,

    CONSTRAINT "Alamat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Alamat" ADD CONSTRAINT "Alamat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
