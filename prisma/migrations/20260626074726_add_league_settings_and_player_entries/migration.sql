-- CreateTable
CREATE TABLE "LeagueSettings" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "paymentRequired" BOOLEAN NOT NULL DEFAULT false,
    "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentReceipt" TEXT,
    "paymentMethod" TEXT,
    "paymentPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeasonEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueSettings_seasonId_key" ON "LeagueSettings"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerSeasonEntry_userId_idx" ON "PlayerSeasonEntry"("userId");

-- CreateIndex
CREATE INDEX "PlayerSeasonEntry_seasonId_idx" ON "PlayerSeasonEntry"("seasonId");

-- CreateIndex
CREATE INDEX "PlayerSeasonEntry_hasPaid_idx" ON "PlayerSeasonEntry"("hasPaid");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonEntry_userId_seasonId_key" ON "PlayerSeasonEntry"("userId", "seasonId");

-- AddForeignKey
ALTER TABLE "LeagueSettings" ADD CONSTRAINT "LeagueSettings_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonEntry" ADD CONSTRAINT "PlayerSeasonEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonEntry" ADD CONSTRAINT "PlayerSeasonEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
