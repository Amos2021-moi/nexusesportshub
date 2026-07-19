/*
  Warnings:

  - You are about to drop the `ScheduledMaintenance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ScheduledMaintenance";

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);
