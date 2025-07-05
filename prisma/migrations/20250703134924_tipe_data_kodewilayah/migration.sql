/*
  Warnings:

  - The primary key for the `Desa` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Kabupaten` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Kecamatan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Provinsi` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Alamat" DROP CONSTRAINT "Alamat_kodeProv_fkey";

-- DropForeignKey
ALTER TABLE "Alamat" DROP CONSTRAINT "Alamat_kodeProv_kodeKab_fkey";

-- DropForeignKey
ALTER TABLE "Alamat" DROP CONSTRAINT "Alamat_kodeProv_kodeKab_kodeKec_fkey";

-- DropForeignKey
ALTER TABLE "Alamat" DROP CONSTRAINT "Alamat_kodeProv_kodeKab_kodeKec_kodeDesa_fkey";

-- DropForeignKey
ALTER TABLE "Desa" DROP CONSTRAINT "Desa_kodeProv_kodeKab_kodeKec_fkey";

-- DropForeignKey
ALTER TABLE "Kabupaten" DROP CONSTRAINT "Kabupaten_kodeProv_fkey";

-- DropForeignKey
ALTER TABLE "Kecamatan" DROP CONSTRAINT "Kecamatan_kodeProv_kodeKab_fkey";

-- AlterTable
ALTER TABLE "Alamat" ALTER COLUMN "kodeDesa" SET DATA TYPE TEXT,
ALTER COLUMN "kodeKab" SET DATA TYPE TEXT,
ALTER COLUMN "kodeKec" SET DATA TYPE TEXT,
ALTER COLUMN "kodeProv" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Desa" DROP CONSTRAINT "Desa_pkey",
ALTER COLUMN "kodeProv" SET DATA TYPE TEXT,
ALTER COLUMN "kodeKab" SET DATA TYPE TEXT,
ALTER COLUMN "kodeKec" SET DATA TYPE TEXT,
ALTER COLUMN "kode" SET DATA TYPE TEXT,
ADD CONSTRAINT "Desa_pkey" PRIMARY KEY ("kodeProv", "kodeKab", "kodeKec", "kode");

-- AlterTable
ALTER TABLE "Kabupaten" DROP CONSTRAINT "Kabupaten_pkey",
ALTER COLUMN "kodeProv" SET DATA TYPE TEXT,
ALTER COLUMN "kode" SET DATA TYPE TEXT,
ADD CONSTRAINT "Kabupaten_pkey" PRIMARY KEY ("kodeProv", "kode");

-- AlterTable
ALTER TABLE "Kecamatan" DROP CONSTRAINT "Kecamatan_pkey",
ALTER COLUMN "kodeProv" SET DATA TYPE TEXT,
ALTER COLUMN "kodeKab" SET DATA TYPE TEXT,
ALTER COLUMN "kode" SET DATA TYPE TEXT,
ADD CONSTRAINT "Kecamatan_pkey" PRIMARY KEY ("kodeProv", "kodeKab", "kode");

-- AlterTable
ALTER TABLE "Provinsi" DROP CONSTRAINT "Provinsi_pkey",
ALTER COLUMN "kode" SET DATA TYPE TEXT,
ADD CONSTRAINT "Provinsi_pkey" PRIMARY KEY ("kode");

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
