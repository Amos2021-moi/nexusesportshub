"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Crown,
  Star,
  Award,
  TrendingUp,
  Shield,
  Target,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

interface ChampionSectionProps {
  champion: {
    id: string;
    name: string;
    profile: { username: string; profilePicture: string };
  } | null;
  tournamentName: string;
  tournamentId?: string;
}

interface ChampionStats {
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winRate: number;
  matchesPlayed: number;
  awards: string[];
}

export default function ChampionSection({
  champion,
  tournamentName,
  tournamentId,
}: ChampionSectionProps) {
  const [stats, setStats] = useState<ChampionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (champion?.id && tournamentId) {
      fetchChampionStats();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champion, tournamentId]);

  async function fetchChampionStats() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/tournaments/${tournamentId}/champion-stats?playerId=${champion?.id}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching champion stats:", error);
      setStats({
        wins: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        winRate: 0,
        matchesPlayed: 0,
        awards: ["Champion"],
      });
    } finally {
      setLoading(false);
    }
  }

  if (!champion) {
    return null;
  }

  const championName =
    champion.profile?.username || champion.name || "Champion";

  if (loading) {
    return (
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 p-6 text-center backdrop-blur-xl">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10" />
        <div className="relative z-10">
          <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-[3px] border-yellow-500/30 border-t-yellow-500" />
          <p className="text-xs text-gray-400">Loading champion stats...</p>
        </div>
      </div>
    );
  }

  const displayStats = stats || {
    wins: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    winRate: 0,
    matchesPlayed: 0,
    awards: ["Champion"],
  };

  const awardIcons: Record<string, React.ReactNode> = {
    Champion: <Crown className="h-3 w-3 text-yellow-500" />,
    "Golden Boot": <Trophy className="h-3 w-3 text-orange-500" />,
    "Golden Glove": <Shield className="h-3 w-3 text-blue-500" />,
    "Player of the Season": <Star className="h-3 w-3 text-purple-500" />,
    "Most Improved": <TrendingUp className="h-3 w-3 text-green-500" />,
    "Best Newcomer": <Sparkles className="h-3 w-3 text-pink-500" />,
    "Top Playmaker": <Target className="h-3 w-3 text-red-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 p-5 text-center shadow-2xl shadow-yellow-500/15 backdrop-blur-xl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-yellow-500/15 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Floating particles */}
        {[
          { top: "12%", left: "10%", size: 8, delay: 0, color: "bg-yellow-400/50" },
          { top: "18%", right: "12%", size: 8, delay: 1, color: "bg-amber-400/50" },
          { bottom: "14%", left: "25%", size: 6, delay: 0.5, color: "bg-yellow-300/50" },
          { bottom: "22%", right: "30%", size: 8, delay: 1.5, color: "bg-amber-300/50" },
          { top: "40%", left: "6%", size: 5, delay: 0.8, color: "bg-yellow-400/40" },
          { top: "55%", right: "8%", size: 6, delay: 1.2, color: "bg-amber-400/40" },
        ].map((p, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full ${p.color}`}
            style={{
              top: p.top,
              left: p.left,
              right: p.right,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
            }}
            animate={{ y: [0, -12, 0], scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Champion Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 16 }}
          className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 ring-1 ring-yellow-400/20"
        >
          <Crown className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
            Champion
          </span>
        </motion.div>

        {/* Champion Profile */}
        <div className="mb-3 flex items-center justify-center gap-4">
          <div className="relative">
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 opacity-50 blur-sm"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              {champion.profile?.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={champion.profile.profilePicture}
                  alt={championName}
                  className="h-14 w-14 rounded-full border-2 border-yellow-500 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-xl font-bold text-white shadow-lg shadow-yellow-500/20">
                  {championName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Small crown badge */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 400,
                damping: 12,
              }}
              className="absolute -right-0.5 -top-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 p-1 shadow-lg shadow-yellow-500/30"
            >
              <Crown className="h-3.5 w-3.5 text-white" />
            </motion.div>
          </div>

          <div className="text-left">
            <h2 className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-xl font-bold text-transparent">
              {championName}
            </h2>
            <p className="text-[10px] text-gray-400">{tournamentName}</p>
            {/* Hall of Fame induction badge */}
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-purple-300 ring-1 ring-purple-500/30">
              <Star className="h-2.5 w-2.5 fill-purple-300 text-purple-300" />
              Hall of Fame
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
          {[
            { value: displayStats.wins, label: "Wins", color: "text-yellow-400" },
            {
              value: `${displayStats.winRate}%`,
              label: "Win Rate",
              color: "text-green-400",
            },
            {
              value: displayStats.goalsFor,
              label: "Goals",
              color: "text-blue-400",
            },
            {
              value: displayStats.matchesPlayed,
              label: "Matches",
              color: "text-white",
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-lg border border-white/10 bg-white/5 p-2 ring-1 ring-white/5"
            >
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[8px] uppercase tracking-wider text-gray-400">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Goal Difference */}
        {displayStats.goalDifference !== 0 && (
          <div className="mt-1.5 flex items-center justify-center gap-2 text-xs">
            <span className="text-gray-500">GD:</span>
            <span
              className={`font-bold ${
                displayStats.goalDifference >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {displayStats.goalDifference >= 0 ? "+" : ""}
              {displayStats.goalDifference}
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">GA:</span>
            <span className="font-bold text-red-400">
              {displayStats.goalsAgainst}
            </span>
          </div>
        )}

        {/* Awards */}
        {displayStats.awards && displayStats.awards.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-2">
            <div className="flex flex-wrap justify-center gap-1.5">
              {displayStats.awards.slice(0, 4).map((award, index) => {
                const Icon = awardIcons[award] || (
                  <Award className="h-3 w-3 text-gray-400" />
                );
                return (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.08 }}
                    className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400"
                  >
                    {Icon}
                    {award}
                  </motion.span>
                );
              })}
              {displayStats.awards.length > 4 && (
                <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
                  +{displayStats.awards.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
