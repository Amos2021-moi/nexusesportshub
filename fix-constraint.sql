DELETE FROM "LeagueSettings" 
WHERE id NOT IN (
  SELECT DISTINCT ON ("seasonId") id
  FROM "LeagueSettings"
  ORDER BY "seasonId", "updatedAt" DESC
);

ALTER TABLE "LeagueSettings" 
ADD CONSTRAINT "LeagueSettings_seasonId_key" UNIQUE ("seasonId");