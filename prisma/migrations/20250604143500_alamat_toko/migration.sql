-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "alamat_toko" INTEGER,
ALTER COLUMN "gender" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_alamat_toko_fkey" FOREIGN KEY ("alamat_toko") REFERENCES "Alamat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
