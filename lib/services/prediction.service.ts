import { prisma } from "@/lib/prisma";
import { PlayerStats, HeadToHead, MatchPrediction } from "@/lib/types/prediction";

const K_FACTOR = 32;
const DEFAULT_ELO = 1200;

export class PredictionService {
  
  // ✅ Get player's ELO
  async getPlayerELO(userId: string): Promise<number> {
    const stats = await prisma.playerStat.findUnique({
      where: { userId }
    });
    return stats?.elo || DEFAULT_ELO;
  }

  // ✅ Update player ELO
  async updatePlayerELO(userId: string, newELO: number): Promise<void> {
    await prisma.playerStat.upsert({
      where: { userId },
      update: { elo: newELO },
      create: { userId, elo: newELO }
    });
  }

  // ✅ Calculate ELO rating for a player
  async calculateELO(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        homeFixtures: {
          where: { status: "COMPLETED" },
          include: { result: true }
        },
        awayFixtures: {
          where: { status: "COMPLETED" },
          include: { result: true }
        }
      }
    });

    if (!user) return DEFAULT_ELO;

    let elo = DEFAULT_ELO;
    const allMatches = [...user.homeFixtures, ...user.awayFixtures];

    for (const match of allMatches) {
      if (!match.result) continue;
      
      const isHome = match.homePlayerId === userId;
      const myScore = isHome ? match.result.homeScore : match.result.awayScore;
      const oppScore = isHome ? match.result.awayScore : match.result.homeScore;
      
      const opponentId = isHome ? match.awayPlayerId : match.homePlayerId;
      const opponentELO = await this.getPlayerELO(opponentId);
      const expectedScore = 1 / (1 + Math.pow(10, (opponentELO - elo) / 400));
      
      let actualScore = 0.5;
      if (myScore > oppScore) actualScore = 1;
      else if (myScore < oppScore) actualScore = 0;
      
      elo = elo + K_FACTOR * (actualScore - expectedScore);
    }

    return Math.round(elo);
  }

  // ✅ Get player's recent form (last 5 matches)
  async getForm(userId: string, limit: number = 5): Promise<("W" | "D" | "L")[]> {
    const fixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ],
        status: "COMPLETED",
        result: { isNot: null }
      },
      include: { result: true },
      orderBy: { scheduledDate: "desc" },
      take: limit
    });

    return fixtures.map(fixture => {
      const isHome = fixture.homePlayerId === userId;
      const myScore = isHome ? fixture.result!.homeScore : fixture.result!.awayScore;
      const oppScore = isHome ? fixture.result!.awayScore : fixture.result!.homeScore;
      
      if (myScore > oppScore) return "W";
      if (myScore < oppScore) return "L";
      return "D";
    });
  }

  // ✅ Get player's win rate
  async getWinRate(userId: string): Promise<number> {
    const fixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ],
        status: "COMPLETED",
        result: { isNot: null }
      },
      include: { result: true }
    });

    const totalMatches = fixtures.length;
    if (totalMatches === 0) return 0;

    let winCount = 0;
    for (const f of fixtures) {
      const isHome = f.homePlayerId === userId;
      const myScore = isHome ? f.result!.homeScore : f.result!.awayScore;
      const oppScore = isHome ? f.result!.awayScore : f.result!.homeScore;
      if (myScore > oppScore) winCount++;
    }

    return Math.round((winCount / totalMatches) * 100);
  }

  // ✅ Get Head-to-Head record
  async getHeadToHead(player1Id: string, player2Id: string): Promise<HeadToHead> {
    const matches = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: player1Id, awayPlayerId: player2Id },
          { homePlayerId: player2Id, awayPlayerId: player1Id }
        ],
        status: "COMPLETED",
        result: { isNot: null }
      },
      include: { result: true }
    });

    let homeWins = 0, awayWins = 0, draws = 0;
    const lastFive: string[] = [];

    for (const match of matches.slice(-5)) {
      const isP1Home = match.homePlayerId === player1Id;
      const p1Score = isP1Home ? match.result!.homeScore : match.result!.awayScore;
      const p2Score = isP1Home ? match.result!.awayScore : match.result!.homeScore;
      
      if (p1Score > p2Score) {
        homeWins++;
        lastFive.push("W");
      } else if (p2Score > p1Score) {
        awayWins++;
        lastFive.push("L");
      } else {
        draws++;
        lastFive.push("D");
      }
    }

    return {
      homeWins,
      awayWins,
      draws,
      total: matches.length,
      lastFive: lastFive.slice(-5)
    };
  }

  // ✅ Calculate prediction for a match
  async calculatePrediction(matchId: string): Promise<MatchPrediction> {
    const match = await prisma.fixture.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: { include: { profile: true } },
        awayPlayer: { include: { profile: true } }
      }
    });

    if (!match) throw new Error("Match not found");

    const homeId = match.homePlayerId;
    const awayId = match.awayPlayerId;

    const [homeELO, awayELO, homeForm, awayForm, h2h, homeWinRate, awayWinRate] = await Promise.all([
      this.getPlayerELO(homeId),
      this.getPlayerELO(awayId),
      this.getForm(homeId),
      this.getForm(awayId),
      this.getHeadToHead(homeId, awayId),
      this.getWinRate(homeId),
      this.getWinRate(awayId)
    ]);

    const homeFormScore = homeForm.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
    const awayFormScore = awayForm.reduce((sum, r) => sum + (r === "W" ? 3 : r === "D" ? 1 : 0), 0);
    const maxFormScore = 15;
    const homeFormPercent = (homeFormScore / maxFormScore) * 100;
    const awayFormPercent = (awayFormScore / maxFormScore) * 100;

    const h2hTotal = h2h.homeWins + h2h.awayWins + h2h.draws;
    const homeH2HPercent = h2hTotal > 0 ? (h2h.homeWins / h2hTotal) * 100 : 50;
    const awayH2HPercent = h2hTotal > 0 ? (h2h.awayWins / h2hTotal) * 100 : 50;

    const homeScore = (homeELO * 0.35) + (homeFormPercent * 0.30) + (homeH2HPercent * 0.20) + (55 * 0.15);
    const awayScore = (awayELO * 0.35) + (awayFormPercent * 0.30) + (awayH2HPercent * 0.20) + (45 * 0.15);

    const total = homeScore + awayScore;
    const homeWinProb = Math.round((homeScore / total) * 100);
    const awayWinProb = Math.round((awayScore / total) * 100);
    const drawProb = Math.max(0, 100 - homeWinProb - awayWinProb);

    let predictedWinner = null;
    let confidence = 0;
    if (homeWinProb > awayWinProb && homeWinProb > drawProb) {
      predictedWinner = { id: homeId, name: match.homePlayer.name || "Home Player" };
      confidence = homeWinProb - Math.max(awayWinProb, drawProb);
    } else if (awayWinProb > homeWinProb && awayWinProb > drawProb) {
      predictedWinner = { id: awayId, name: match.awayPlayer.name || "Away Player" };
      confidence = awayWinProb - Math.max(homeWinProb, drawProb);
    } else {
      predictedWinner = { id: "draw", name: "Draw" };
      confidence = drawProb - Math.max(homeWinProb, awayWinProb);
    }

    const confidenceLabel = confidence > 30 ? "High" : confidence > 15 ? "Medium" : "Low";
    const confidenceColor = confidence > 30 ? "green" : confidence > 15 ? "yellow" : "red";

    const insights = this.generateInsights(
      homeELO, awayELO,
      homeFormPercent, awayFormPercent,
      h2h,
      homeWinRate, awayWinRate
    );

    return {
      matchId,
      homePlayer: {
        id: homeId,
        name: match.homePlayer.name || "Home Player",
        elo: homeELO,
        wins: 0,
        draws: 0,
        losses: 0,
        matches: 0,
        form: homeForm,
        winRate: homeWinRate,
        goalsFor: 0,
        goalsAgainst: 0
      },
      awayPlayer: {
        id: awayId,
        name: match.awayPlayer.name || "Away Player",
        elo: awayELO,
        wins: 0,
        draws: 0,
        losses: 0,
        matches: 0,
        form: awayForm,
        winRate: awayWinRate,
        goalsFor: 0,
        goalsAgainst: 0
      },
      predictedWinner,
      homeWinProbability: homeWinProb,
      awayWinProbability: awayWinProb,
      drawProbability: drawProb,
      confidence: Math.round(confidence + 30),
      confidenceLabel,
      confidenceColor,
      factors: {
        eloAdvantage: homeELO > awayELO ? `${homeELO - awayELO} ELO advantage` : `${awayELO - homeELO} ELO advantage`,
        formAdvantage: homeFormPercent > awayFormPercent ? "Better recent form" : "Weaker recent form",
        h2hAdvantage: homeH2HPercent > awayH2HPercent ? "Better H2H record" : "Worse H2H record",
        homeAdvantage: "Home advantage"
      },
      keyInsights: insights,
      createdAt: new Date().toISOString()
    };
  }

  private generateInsights(
    homeELO: number, awayELO: number,
    homeForm: number, awayForm: number,
    h2h: HeadToHead,
    homeWinRate: number, awayWinRate: number
  ): string[] {
    const insights: string[] = [];

    const eloDiff = Math.abs(homeELO - awayELO);
    if (eloDiff > 100) {
      insights.push(`🎯 ${homeELO > awayELO ? "Home" : "Away"} player has significant ELO advantage (${eloDiff} points)`);
    }

    if (homeForm > 70 && awayForm < 50) {
      insights.push(`📈 Home player is in excellent form (${Math.round(homeForm)}%)`);
    } else if (awayForm > 70 && homeForm < 50) {
      insights.push(`📈 Away player is in excellent form (${Math.round(awayForm)}%)`);
    }

    if (h2h.total > 3) {
      const winner = h2h.homeWins > h2h.awayWins ? "Home" : "Away";
      insights.push(`📊 ${winner} player leads head-to-head (${h2h.homeWins}-${h2h.awayWins})`);
    }

    if (homeWinRate > 60 && awayWinRate < 40) {
      insights.push(`🏆 Home player has strong win rate (${homeWinRate}%)`);
    } else if (awayWinRate > 60 && homeWinRate < 40) {
      insights.push(`🏆 Away player has strong win rate (${awayWinRate}%)`);
    }

    if (insights.length === 0) {
      insights.push("⚖️ Both players are evenly matched");
      insights.push("📊 Based on stats, this could be a close game");
    }

    return insights;
  }

  // ✅ Update ELO after match result
  async updateELOAfterMatch(matchId: string): Promise<void> {
    const match = await prisma.fixture.findUnique({
      where: { id: matchId },
      include: { result: true }
    });

    if (!match || !match.result) return;

    const isHomeWin = match.result.homeScore > match.result.awayScore;
    const isAwayWin = match.result.awayScore > match.result.homeScore;
    const isDraw = match.result.homeScore === match.result.awayScore;

    const homeELO = await this.getPlayerELO(match.homePlayerId);
    const awayELO = await this.getPlayerELO(match.awayPlayerId);

    const homeExpected = 1 / (1 + Math.pow(10, (awayELO - homeELO) / 400));
    const awayExpected = 1 / (1 + Math.pow(10, (homeELO - awayELO) / 400));

    let homeActual = 0.5, awayActual = 0.5;
    if (isHomeWin) { homeActual = 1; awayActual = 0; }
    else if (isAwayWin) { homeActual = 0; awayActual = 1; }

    const newHomeELO = Math.round(homeELO + K_FACTOR * (homeActual - homeExpected));
    const newAwayELO = Math.round(awayELO + K_FACTOR * (awayActual - awayExpected));

    await this.updatePlayerELO(match.homePlayerId, newHomeELO);
    await this.updatePlayerELO(match.awayPlayerId, newAwayELO);
  }
}

export const predictionService = new PredictionService();