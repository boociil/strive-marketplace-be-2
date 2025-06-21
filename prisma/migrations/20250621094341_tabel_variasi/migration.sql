/*
  Warnings:

  - You are about to drop the column `harga` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "harga",
DROP COLUMN "stock";

-- CreateTable
CREATE TABLE "Variasi" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "desc" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Variasi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Variasi" ADD CONSTRAINT "Variasi_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
