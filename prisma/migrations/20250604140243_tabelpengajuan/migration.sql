-- CreateTable
CREATE TABLE "Pengajuan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL,
    "accBy" INTEGER NOT NULL,

    CONSTRAINT "Pengajuan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pengajuan" ADD CONSTRAINT "Pengajuan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pengajuan" ADD CONSTRAINT "Pengajuan_accBy_fkey" FOREIGN KEY ("accBy") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
