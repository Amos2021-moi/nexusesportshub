/*
  Warnings:

  - A unique constraint covering the columns `[seasonEntryId]` on the table `PlayerSeasonEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PlayerSeasonEntry" ADD COLUMN     "seasonEntryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonEntry_seasonEntryId_key" ON "PlayerSeasonEntry"("seasonEntryId");

-- AddForeignKey
ALTER TABLE "PlayerSeasonEntry" ADD CONSTRAINT "PlayerSeasonEntry_seasonEntryId_fkey" FOREIGN KEY ("seasonEntryId") REFERENCES "SeasonEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
