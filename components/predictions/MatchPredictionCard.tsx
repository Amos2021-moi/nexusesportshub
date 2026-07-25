"use client";

import { memo, useState, useEffect } from "react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Zap,
  Crown,
  Users,
  Calendar,
  Clock,
  Eye,
  Info,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerStats {
  id: string;
  name: string;
  elo: number;
  form: ("W" | "D" | "L")[];
  winRate: number;
}

interface MatchPredictionCardProps {
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
  scheduledDate: string;
  compact?: boolean;
}

const formColors = {
  W: "bg-green-500/20 text-green-400",
  D: "bg-yellow-500/20 text-yellow-400",
  L: "bg-red-500/20 text-red-400",
};

const confidenceColors = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

const confidenceBadges = {
  High: "bg-green-500/20 text-green-400 border-green-500/20",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  Low: "bg-red-500/20 text-red-400 border-red-500/20",
};

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Form Badges ===
const FormBadges = memo(({ form }: { form: ("W" | "D" | "L")[] }) => {
  return (
    <div className="flex gap-0.5">
      {form.map((result, index) => (
        <span
          key={index}
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${formColors[result]}`}
        >
          {result}
        </span>
      ))}
    </div>
  );
});

FormBadges.displayName = "FormBadges";

// === STATIC Player Card ===
const PlayerCard = memo(({ 
  player, 
  winProbability, 
  isWinner, 
  isHome 
}: { 
  player: PlayerStats; 
  winProbability: number; 
  isWinner: boolean; 
  isHome: boolean;
}) => {
  const isMobile = useIsMobile();
  const borderClass = isWinner 
    ? "border-green-500/30 bg-green-500/5" 
    : "border-white/10 bg-gray-900/40";
  const gradientClass = isHome 
    ? "bg-gradient-to-r from-indigo-500 to-purple-500" 
    : "bg-gradient-to-r from-pink-500 to-rose-500";

  return (
    <div className={`rounded-xl border p-3 transition-colors duration-150 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{player.name}</span>
        {isWinner && <Crown className="h-4 w-4 text-yellow-400" />}
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          ELO: {player.elo}
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          {player.winRate}%
        </span>
      </div>
      <div className="mt-1.5">
        <FormBadges form={player.form} />
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className={`h-full rounded-full ${gradientClass}`}
          style={{ width: `${winProbability}%` }}
        />
      </div>
      <div className="mt-0.5 text-right text-[10px] text-gray-500">
        {winProbability}%
      </div>
    </div>
  );
});

PlayerCard.displayName = "PlayerCard";

// === STATIC Factor Badge ===
const FactorBadge = memo(({ text }: { text: string }) => (
  <div className="rounded-lg bg-gray-900/40 px-2 py-1.5 text-xs text-gray-300">
    {text}
  </div>
));

FactorBadge.displayName = "FactorBadge";

// === STATIC Insight Item ===
const InsightItem = memo(({ text }: { text: string }) => (
  <li className="flex items-start gap-1.5 text-xs text-gray-300">
    <span className="mt-0.5 text-gray-500">•</span>
    {text}
  </li>
));

InsightItem.displayName = "InsightItem";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function MatchPredictionCard({
  matchId,
  homePlayer,
  awayPlayer,
  predictedWinner,
  homeWinProbability,
  awayWinProbability,
  drawProbability,
  confidence,
  confidenceLabel,
  confidenceColor,
  factors,
  keyInsights,
  scheduledDate,
  compact = false,
}: MatchPredictionCardProps) {
  const isMobile = useIsMobile();
  const isHomeWin = predictedWinner.id === homePlayer.id;
  const isDraw = predictedWinner.id === "draw";

  // ✅ Compact view - NO animations
  if (compact) {
    return (
      <div className="rounded-xl border border-white/10 bg-gray-800/40 p-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              {predictedWinner.name} wins
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${confidenceColors[confidenceColor]}`}>
              {confidence}%
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] ${confidenceBadges[confidenceLabel]}`}
            >
              {confidenceLabel}
            </span>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isHomeWin
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : isDraw
                ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                : "bg-gradient-to-r from-red-500 to-rose-500"
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Win {homeWinProbability}%</span>
          <span>Draw {drawProbability}%</span>
          <span>Win {awayWinProbability}%</span>
        </div>
      </div>
    );
  }

  // ✅ Full view - NO animations
  return (
    <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-5 shadow-2xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/40">
      {/* Header - NO animations */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-yellow-500/10 p-1.5">
            <Trophy className="h-4 w-4 text-yellow-400" />
          </div>
          <span className="text-sm font-semibold text-white">Match Prediction</span>
          <span className="rounded-full border border-white/10 bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
            {new Date(scheduledDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${confidenceColors[confidenceColor]}`}>
            {confidence}%
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs ${confidenceBadges[confidenceLabel]}`}
          >
            {confidenceLabel} Confidence
          </span>
        </div>
      </div>

      {/* Players - NO animations */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlayerCard 
          player={homePlayer} 
          winProbability={homeWinProbability} 
          isWinner={isHomeWin} 
          isHome={true} 
        />
        <PlayerCard 
          player={awayPlayer} 
          winProbability={awayWinProbability} 
          isWinner={!isHomeWin && !isDraw} 
          isHome={false} 
        />
      </div>

      {/* Prediction Result - NO animations */}
      <div className="mb-4 rounded-xl border border-white/5 bg-gray-900/40 p-3 text-center">
        <p className="text-sm font-medium text-white">
          🏆 <span className="font-bold">{predictedWinner.name}</span> wins
          {isDraw && " (Draw)"}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3 sm:gap-6 text-xs text-gray-400">
          <span>
            Win: <span className="font-medium text-white">{homeWinProbability}%</span>
          </span>
          <span>
            Draw: <span className="font-medium text-white">{drawProbability}%</span>
          </span>
          <span>
            Win: <span className="font-medium text-white">{awayWinProbability}%</span>
          </span>
        </div>
      </div>

      {/* Key Factors - NO animations */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-gray-400">📋 Key Factors</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <FactorBadge text={factors.eloAdvantage} />
          <FactorBadge text={factors.formAdvantage} />
          <FactorBadge text={factors.h2hAdvantage} />
          <FactorBadge text={factors.homeAdvantage} />
        </div>
      </div>

      {/* Insights - NO animations */}
      {keyInsights.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-gray-900/30 p-3">
          <p className="mb-1 text-xs font-medium text-gray-400">💡 Insights</p>
          <ul className="space-y-0.5">
            {keyInsights.slice(0, 3).map((insight, index) => (
              <InsightItem key={index} text={insight} />
            ))}
          </ul>
        </div>
      )}

      {/* Prediction Accuracy - NO animations */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-yellow-400" />
          AI Powered Prediction
        </span>
        <span>Based on ELO, Form, and H2H data</span>
      </div>
    </div>
  );
}