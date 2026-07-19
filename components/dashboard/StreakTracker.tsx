// components/dashboard/StreakTracker.tsx
"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Flame, Snowflake, Minus, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface StreakData {
  currentStreak: number;
  streakType: 'win' | 'loss' | 'draw' | null;
  streakEmoji: string;
  streakLabel: string;
  streakColor: string;
  bestStreak: number;
  bestStreakType: 'win' | 'loss' | 'draw';
  bestStreakEmoji: string;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalMatches: number;
  hasResults: boolean;
}

function StreakTracker() {
  const { data, isLoading, error } = useQuery<StreakData>({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/streak");
      if (!res.ok) throw new Error("Failed to fetch streak data");
      return res.json();
    },
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-24 flex items-center justify-center">
          <div className="text-gray-500">Loading streak...</div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.hasResults) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-400">
          <Activity className="h-5 w-5" />
          <span>Play your first match to start a streak!</span>
        </div>
      </div>
    );
  }

  const streakColors: Record<string, string> = {
    win: 'from-green-500 to-emerald-400',
    loss: 'from-red-500 to-rose-400',
    draw: 'from-yellow-500 to-amber-400',
  };

  const streakBgColors: Record<string, string> = {
    win: 'border-green-500/30 bg-green-500/10',
    loss: 'border-red-500/30 bg-red-500/10',
    draw: 'border-yellow-500/30 bg-yellow-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 backdrop-blur-xl ${streakBgColors[data.streakType || 'draw']}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.streakType === 'win' && <Flame className="h-5 w-5 text-green-400" />}
          {data.streakType === 'loss' && <Snowflake className="h-5 w-5 text-red-400" />}
          {data.streakType === 'draw' && <Minus className="h-5 w-5 text-yellow-400" />}
          <span className="font-medium text-white">Current Streak</span>
        </div>
        <span className={`text-lg font-bold ${data.streakColor}`}>
          {data.streakEmoji} {data.currentStreak}
        </span>
      </div>

      <div className="mt-2 text-sm text-gray-300">
        {data.streakLabel}
      </div>

      {/* Streak bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-700/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(data.currentStreak * 10, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${streakColors[data.streakType || 'draw']}`}
        />
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-2">
          <p className="text-lg font-bold text-green-400">{data.totalWins}</p>
          <p className="text-[10px] text-gray-500">Wins</p>
        </div>
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-2">
          <p className="text-lg font-bold text-yellow-400">{data.totalDraws}</p>
          <p className="text-[10px] text-gray-500">Draws</p>
        </div>
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-2">
          <p className="text-lg font-bold text-red-400">{data.totalLosses}</p>
          <p className="text-[10px] text-gray-500">Losses</p>
        </div>
        <div className="text-center rounded-xl border border-white/5 bg-white/5 p-2">
          <p className="text-lg font-bold text-white">{data.totalMatches}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
      </div>

      {/* Best streak */}
      {data.bestStreak > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-400">
          <TrendingUp className="h-3 w-3" />
          <span>Best streak: {data.bestStreakEmoji} {data.bestStreak} {data.bestStreakType}s</span>
        </div>
      )}
    </motion.div>
  );
}
export default StreakTracker;

