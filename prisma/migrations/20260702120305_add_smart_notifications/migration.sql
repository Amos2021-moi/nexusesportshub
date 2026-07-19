/*
  Warnings:

  - A unique constraint covering the columns `[playerStatId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropIndex
DROP INDEX "Notification_read_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'IN_APP',
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "priorityLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "playerStatId" TEXT;

-- CreateTable
CREATE TABLE "PlayerStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1200,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "form" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ELORating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1200,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "form" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ELORating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushQuietHours" JSONB,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" TEXT NOT NULL DEFAULT 'DAILY',
    "minPriorityPush" INTEGER NOT NULL DEFAULT 70,
    "minPriorityInApp" INTEGER NOT NULL DEFAULT 30,
    "matchReminders" BOOLEAN NOT NULL DEFAULT true,
    "resultApproved" BOOLEAN NOT NULL DEFAULT true,
    "tournamentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "newsAlerts" BOOLEAN NOT NULL DEFAULT true,
    "communityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_userId_key" ON "PlayerStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ELORating_userId_key" ON "ELORating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_priorityLevel_idx" ON "Notification"("priorityLevel");

-- CreateIndex
CREATE UNIQUE INDEX "User_playerStatId_key" ON "User"("playerStatId");

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ELORating" ADD CONSTRAINT "ELORating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
