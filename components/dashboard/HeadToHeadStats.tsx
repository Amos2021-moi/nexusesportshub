// components/dashboard/HeadToHeadStats.tsx
"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Swords, 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface H2HData {
  hasHistory: boolean;
  opponentName: string;
  opponentId: string;
  totalMatches: number;
  userWins: number;
  opponentWins: number;
  draws: number;
  userGoals: number;
  opponentGoals: number;
  userWinRate: number;
  opponentWinRate: number;
  drawRate: number;
  lastFive: {
    result: 'W' | 'L' | 'D';
    score: string;
    date: string;
    isHome: boolean;
  }[];
  advantage: 'user' | 'opponent' | 'equal';
  advantageText: string;
}

interface HeadToHeadStatsProps {
  opponentId: string;
  opponentName?: string;
}

function HeadToHeadStats({ opponentId, opponentName }: HeadToHeadStatsProps) {
  const { data, isLoading, error } = useQuery<H2HData>({
    queryKey: ['h2h', opponentId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/h2h?opponentId=${opponentId}`);
      if (!res.ok) throw new Error("Failed to fetch head-to-head stats");
      return res.json();
    },
    enabled: !!opponentId,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-24 flex items-center justify-center">
          <div className="text-gray-500">Loading head-to-head...</div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.hasHistory) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <Swords className="h-5 w-5" />
          <span>No previous matches against {opponentName || "this opponent"}</span>
        </div>
      </div>
    );
  }

  const getResultColor = (result: 'W' | 'L' | 'D') => {
    if (result === 'W') return 'bg-green-500/20 text-green-400';
    if (result === 'L') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const getResultLabel = (result: 'W' | 'L' | 'D') => {
    if (result === 'W') return 'Win';
    if (result === 'L') return 'Loss';
    return 'Draw';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-indigo-400" />
          <span className="font-medium text-white">Head-to-Head</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
          {data.totalMatches} matches
        </span>
      </div>

      {/* Opponent name */}
      <div className="mt-2 flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-white">vs {data.opponentName}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          data.advantage === 'user' ? 'bg-green-500/20 text-green-400' :
          data.advantage === 'opponent' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {data.advantage === 'user' ? '👍 You lead' :
           data.advantage === 'opponent' ? '👎 Behind' :
           '🤝 Even'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-3">
          <p className="text-2xl font-bold text-green-400">{data.userWins}</p>
          <p className="text-[10px] text-gray-500">You</p>
        </div>
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-3">
          <p className="text-2xl font-bold text-yellow-400">{data.draws}</p>
          <p className="text-[10px] text-gray-500">Draws</p>
        </div>
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-3">
          <p className="text-2xl font-bold text-red-400">{data.opponentWins}</p>
          <p className="text-[10px] text-gray-500">{data.opponentName}</p>
        </div>
      </div>

      {/* Win rates */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
            <div className="h-full rounded-full bg-green-400" style={{ width: `${data.userWinRate}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">{data.userWinRate}%</span>
        </div>
        <div className="text-center">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${data.drawRate}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">{data.drawRate}%</span>
        </div>
        <div className="text-center">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700/50">
            <div className="h-full rounded-full bg-red-400" style={{ width: `${data.opponentWinRate}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">{data.opponentWinRate}%</span>
        </div>
      </div>

      {/* Goals */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
        <span>⚽ You: {data.userGoals}</span>
        <span>vs</span>
        <span>⚽ {data.opponentName}: {data.opponentGoals}</span>
      </div>

      {/* Last 5 results */}
      {data.lastFive.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-xs text-gray-500 mb-2">Last 5 Matches</p>
          <div className="flex gap-2">
            {data.lastFive.map((match, index) => (
              <div key={index} className="flex-1 text-center">
                <div className={`rounded-lg p-2 ${getResultColor(match.result)}`}>
                  <span className="text-sm font-bold">{match.result}</span>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block truncate">{match.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
export default HeadToHeadStats;