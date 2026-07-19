/*
  Warnings:

  - You are about to drop the column `endTime` on the `Maintenance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seasonEntryId]` on the table `LeagueEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('NOT_ENROLLED', 'PAYMENT_PENDING', 'ACTIVE', 'SUSPENDED', 'REFUNDED');

-- AlterTable
ALTER TABLE "LeagueEntry" ADD COLUMN     "seasonEntryId" TEXT;

-- AlterTable
ALTER TABLE "Maintenance" DROP COLUMN "endTime",
ADD COLUMN     "scheduledEnd" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SeasonEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'NOT_ENROLLED',
    "entryFee" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "phoneNumber" TEXT,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "transactionId" TEXT,
    "mpesaReceipt" TEXT,
    "resultCode" INTEGER,
    "resultDesc" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizePool" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalCollected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryFee" DOUBLE PRECISION NOT NULL,
    "registeredPlayers" INTEGER NOT NULL DEFAULT 0,
    "championReward" DOUBLE PRECISION NOT NULL,
    "runnerReward" DOUBLE PRECISION NOT NULL,
    "topScorerReward" DOUBLE PRECISION NOT NULL,
    "platformReserve" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrizePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonEntryId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeasonEntry_userId_idx" ON "SeasonEntry"("userId");

-- CreateIndex
CREATE INDEX "SeasonEntry_seasonId_idx" ON "SeasonEntry"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonEntry_status_idx" ON "SeasonEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonEntry_userId_seasonId_key" ON "SeasonEntry"("userId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PrizePool_seasonId_key" ON "PrizePool"("seasonId");

-- CreateIndex
CREATE INDEX "PaymentAudit_userId_idx" ON "PaymentAudit"("userId");

-- CreateIndex
CREATE INDEX "PaymentAudit_seasonEntryId_idx" ON "PaymentAudit"("seasonEntryId");

-- CreateIndex
CREATE INDEX "PaymentAudit_createdAt_idx" ON "PaymentAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueEntry_seasonEntryId_key" ON "LeagueEntry"("seasonEntryId");

-- AddForeignKey
ALTER TABLE "LeagueEntry" ADD CONSTRAINT "LeagueEntry_seasonEntryId_fkey" FOREIGN KEY ("seasonEntryId") REFERENCES "SeasonEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonEntry" ADD CONSTRAINT "SeasonEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonEntry" ADD CONSTRAINT "SeasonEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrizePool" ADD CONSTRAINT "PrizePool_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_seasonEntryId_fkey" FOREIGN KEY ("seasonEntryId") REFERENCES "SeasonEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
