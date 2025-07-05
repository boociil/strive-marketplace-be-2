/*
  Warnings:

  - You are about to drop the column `desa` on the `Alamat` table. All the data in the column will be lost.
  - You are about to drop the column `kabupaten` on the `Alamat` table. All the data in the column will be lost.
  - You are about to drop the column `kecamatan` on the `Alamat` table. All the data in the column will be lost.
  - You are about to drop the column `kode_pos` on the `Alamat` table. All the data in the column will be lost.
  - You are about to drop the column `provinsi` on the `Alamat` table. All the data in the column will be lost.
  - Added the required column `kodeDesa` to the `Alamat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kodeKab` to the `Alamat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kodeKec` to the `Alamat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kodeProv` to the `Alamat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Alamat" DROP COLUMN "desa",
DROP COLUMN "kabupaten",
DROP COLUMN "kecamatan",
DROP COLUMN "kode_pos",
DROP COLUMN "provinsi",
ADD COLUMN     "kodeDesa" INTEGER NOT NULL,
ADD COLUMN     "kodeKab" INTEGER NOT NULL,
ADD COLUMN     "kodeKec" INTEGER NOT NULL,
ADD COLUMN     "kodeProv" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Provinsi" (
    "kode" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Provinsi_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "Kabupaten" (
    "kodeProv" INTEGER NOT NULL,
    "kode" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Kabupaten_pkey" PRIMARY KEY ("kodeProv","kode")
);

-- CreateTable
CREATE TABLE "Kecamatan" (
    "kodeProv" INTEGER NOT NULL,
    "kodeKab" INTEGER NOT NULL,
    "kode" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Kecamatan_pkey" PRIMARY KEY ("kodeProv","kodeKab","kode")
);

-- CreateTable
CREATE TABLE "Desa" (
    "kodeProv" INTEGER NOT NULL,
    "kodeKab" INTEGER NOT NULL,
    "kodeKec" INTEGER NOT NULL,
    "kode" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Desa_pkey" PRIMARY KEY ("kodeProv","kodeKab","kodeKec","kode")
);

-- AddForeignKey
ALTER TABLE "Alamat" ADD CONSTRAINT "Alamat_kodeProv_fkey" FOREIGN KEY ("kodeProv") REFERENCES "Provinsi"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alamat" ADD CONSTRAINT "Alamat_kodeProv_kodeKab_fkey" FOREIGN KEY ("kodeProv", "kodeKab") REFERENCES "Kabupaten"("kodeProv", "kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alamat" ADD CONSTRAINT "Alamat_kodeProv_kodeKab_kodeKec_fkey" FOREIGN KEY ("kodeProv", "kodeKab", "kodeKec") REFERENCES "Kecamatan"("kodeProv", "kodeKab", "kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alamat" ADD CONSTRAINT "Alamat_kodeProv_kodeKab_kodeKec_kodeDesa_fkey" FOREIGN KEY ("kodeProv", "kodeKab", "kodeKec", "kodeDesa") REFERENCES "Desa"("kodeProv", "kodeKab", "kodeKec", "kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kabupaten" ADD CONSTRAINT "Kabupaten_kodeProv_fkey" FOREIGN KEY ("kodeProv") REFERENCES "Provinsi"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kecamatan" ADD CONSTRAINT "Kecamatan_kodeProv_kodeKab_fkey" FOREIGN KEY ("kodeProv", "kodeKab") REFERENCES "Kabupaten"("kodeProv", "kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desa" ADD CONSTRAINT "Desa_kodeProv_kodeKab_kodeKec_fkey" FOREIGN KEY ("kodeProv", "kodeKab", "kodeKec") REFERENCES "Kecamatan"("kodeProv", "kodeKab", "kode") ON DELETE RESTRICT ON UPDATE CASCADE;
