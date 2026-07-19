-- CreateEnum
CREATE TYPE "SquadType" AS ENUM ('MAIN', 'SEASONAL', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('GENERAL', 'SQUAD_SHARE', 'ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "TournamentType" AS ENUM ('SINGLE_ELIM', 'DOUBLE_ELIM');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('PRESEASON', 'REGISTRATION', 'FIXTURE_LOCK', 'LIVE', 'ENDED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationSentAt" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "resetPasswordSentAt" TIMESTAMP(3),
    "resetPasswordExpiresAt" TIMESTAMP(3),
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationPreferences" JSONB,
    "lastEmailSentAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "class" TEXT,
    "bio" TEXT,
    "favoriteClub" TEXT,
    "preferredFormation" TEXT,
    "preferredPlaystyle" TEXT,
    "profilePicture" TEXT,
    "bannerImage" TEXT,
    "whatsappNumber" TEXT,
    "whatsappVisible" BOOLEAN NOT NULL DEFAULT true,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "totalDraws" INTEGER NOT NULL DEFAULT 0,
    "totalLosses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT DEFAULT 'Africa/Nairobi',
    "availableFrom" TEXT,
    "availableTo" TEXT,
    "verifiedBadge" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "manOfTheMatch" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'PRESEASON',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seasonId" TEXT,
    "type" "TournamentType" NOT NULL DEFAULT 'SINGLE_ELIM',
    "status" "TournamentStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "homePlayerId" TEXT NOT NULL,
    "awayPlayerId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proposedBy" TEXT,
    "proposedDate" TIMESTAMP(3),
    "schedulingNotes" TEXT,
    "schedulingStatus" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "evidenceImage" TEXT,
    "submittedBy" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'LEAGUE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentMatchId" TEXT,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueEntry" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeagueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SquadType" NOT NULL DEFAULT 'MAIN',
    "screenshot" TEXT NOT NULL,
    "formation" TEXT NOT NULL,
    "teamStrength" INTEGER NOT NULL,
    "playstyle" TEXT NOT NULL,
    "seasonId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "type" "PostType" NOT NULL DEFAULT 'GENERAL',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CUSTOM',
    "icon" TEXT,
    "winnerId" TEXT NOT NULL,
    "description" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallOfFame" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "imageUrl" TEXT,
    "inductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HallOfFame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "authorId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "bracket" TEXT NOT NULL DEFAULT 'WINNERS',
    "homePlayerId" TEXT,
    "awayPlayerId" TEXT,
    "winnerId" TEXT,
    "nextMatchId" TEXT,
    "loserMatchId" TEXT,
    "resultId" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentParticipant" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seed" INTEGER,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "size" INTEGER NOT NULL DEFAULT 0,
    "filePath" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "restoredAt" TIMESTAMP(3),
    "restoredBy" TEXT,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestoreLog" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "restoredBy" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "RestoreLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "time" TEXT NOT NULL DEFAULT '02:00',
    "keepDaily" INTEGER NOT NULL DEFAULT 7,
    "keepWeekly" INTEGER NOT NULL DEFAULT 4,
    "keepMonthly" INTEGER NOT NULL DEFAULT 3,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reportedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledMaintenance" (
    "id" TEXT NOT NULL,
    "endTime" TIMESTAMP(3),
    "message" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_profileId_key" ON "PlayerStats"("profileId");

-- CreateIndex
CREATE INDEX "Fixture_seasonId_idx" ON "Fixture"("seasonId");

-- CreateIndex
CREATE INDEX "Fixture_homePlayerId_idx" ON "Fixture"("homePlayerId");

-- CreateIndex
CREATE INDEX "Fixture_awayPlayerId_idx" ON "Fixture"("awayPlayerId");

-- CreateIndex
CREATE INDEX "Fixture_status_idx" ON "Fixture"("status");

-- CreateIndex
CREATE INDEX "Fixture_scheduledDate_idx" ON "Fixture"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "Result_fixtureId_key" ON "Result"("fixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_tournamentMatchId_key" ON "Result"("tournamentMatchId");

-- CreateIndex
CREATE INDEX "Result_fixtureId_idx" ON "Result"("fixtureId");

-- CreateIndex
CREATE INDEX "Result_approved_idx" ON "Result"("approved");

-- CreateIndex
CREATE INDEX "Result_createdAt_idx" ON "Result"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueEntry_seasonId_playerId_key" ON "LeagueEntry"("seasonId", "playerId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_type_idx" ON "Post"("type");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Like_postId_userId_key" ON "Like"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Award_seasonId_category_winnerId_key" ON "Award"("seasonId", "category", "winnerId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_resultId_key" ON "TournamentMatch"("resultId");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournamentId_idx" ON "TournamentMatch"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentMatch_status_idx" ON "TournamentMatch"("status");

-- CreateIndex
CREATE INDEX "TournamentMatch_round_idx" ON "TournamentMatch"("round");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentParticipant_tournamentId_playerId_key" ON "TournamentParticipant"("tournamentId", "playerId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_userId_category_key_key" ON "Setting"("userId", "category", "key");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_awayPlayerId_fkey" FOREIGN KEY ("awayPlayerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homePlayerId_fkey" FOREIGN KEY ("homePlayerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_tournamentMatchId_fkey" FOREIGN KEY ("tournamentMatchId") REFERENCES "TournamentMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueEntry" ADD CONSTRAINT "LeagueEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueEntry" ADD CONSTRAINT "LeagueEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallOfFame" ADD CONSTRAINT "HallOfFame_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallOfFame" ADD CONSTRAINT "HallOfFame_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_awayPlayerId_fkey" FOREIGN KEY ("awayPlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_homePlayerId_fkey" FOREIGN KEY ("homePlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMatch" ADD CONSTRAINT "TournamentMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentParticipant" ADD CONSTRAINT "TournamentParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreLog" ADD CONSTRAINT "RestoreLog_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "Backup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreLog" ADD CONSTRAINT "RestoreLog_restoredBy_fkey" FOREIGN KEY ("restoredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
