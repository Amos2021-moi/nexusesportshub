export interface PlayerStats {
  id: string;
  name: string;
  elo: number;
  wins: number;
  draws: number;
  losses: number;
  matches: number;
  form: ("W" | "D" | "L")[];
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface HeadToHead {
  homeWins: number;
  awayWins: number;
  draws: number;
  total: number;
  lastFive: string[];
}

export interface MatchPrediction {
  matchId: string;
  homePlayer: PlayerStats;
  awayPlayer: PlayerStats;
  predictedWinner: {
    id: string;
    name: string;
  };
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
  confidenceColor: "green" | "yellow" | "red";
  factors: {
    eloAdvantage: string;
    formAdvantage: string;
    h2hAdvantage: string;
    homeAdvantage: string;
  };
  keyInsights: string[];
  createdAt: string;
}

export interface PredictionHistory {
  matchId: string;
  predictedWinner: string;
  actualWinner: string | null;
  correct: boolean | null;
  confidence: number;
  createdAt: string;
}