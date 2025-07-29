-- AlterTable
ALTER TABLE "Transaksi" ADD COLUMN     "no_resi" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tokoId" INTEGER;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "path_foto_toko" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Transaksi" ADD CONSTRAINT "Transaksi_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
