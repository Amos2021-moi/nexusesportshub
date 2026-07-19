"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Target,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
  Coins,
  Wallet,
  Gift,
  Zap,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface PrizeBreakdown {
  champion: { percentage: number; amount: number };
  runnerUp: { percentage: number; amount: number };
  topScorer: { percentage: number; amount: number };
  platformReserve: { percentage: number; amount: number };
}

interface PrizeData {
  totalPrizePool: number;
  entryFee: number;
  registeredPlayers: number;
  totalPlayers: number;
  breakdown: PrizeBreakdown;
  topScorer: { name: string; goals: number } | null;
  playerPosition: {
    rank: number;
    totalPlayers: number;
    points: number;
    goals?: number;
    potentialWinnings: number;
    isTopScorer: boolean;
    currentReward: number;
  } | null;
  seasonId: string;
  message?: string;
}

interface PrizeDisplayProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

function ProgressBar({
  percentage,
  color,
  label,
}: {
  percentage: number;
  color: string;
  label: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-0.5 flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-medium text-gray-300">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-white";
}

export default function PrizeDisplay({
  compact = false,
  showDetails = true,
  className = "",
}: PrizeDisplayProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<PrizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchPrizeData();
  }, []);

  async function fetchPrizeData() {
    try {
      const res = await fetch("/api/competition/prize");
      if (!res.ok) throw new Error("Failed to fetch prize data");
      const data = await res.json();

      console.log("📊 Prize API Response:", {
        totalPrizePool: data.totalPrizePool,
        entryFee: data.entryFee,
        registeredPlayers: data.registeredPlayers,
        breakdown: data.breakdown,
        champion: data.breakdown?.champion,
        runnerUp: data.breakdown?.runnerUp,
        topScorer: data.breakdown?.topScorer,
        reserve: data.breakdown?.platformReserve,
      });

      setData(data);
    } catch (error) {
      console.error("Error fetching prize data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-gray-800/40 p-4 backdrop-blur-xl ${className}`}
      >
        <div className="space-y-3">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-700/50" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-700/50" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-lg bg-gray-700/50" />
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-700/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-gray-800/40 p-6 text-center backdrop-blur-xl ${className}`}
      >
        <Trophy className="mx-auto mb-3 h-12 w-12 text-gray-600" />
        <h3 className="text-lg font-semibold text-white">🏆 Prize Pool</h3>
        <p className="mt-1 text-sm text-gray-400">No prize data available</p>
      </div>
    );
  }

  // ✅ If free season (entryFee = 0)
  if (data.entryFee === 0) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 text-center backdrop-blur-xl ${className}`}
      >
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-500/20 p-4">
            <Gift className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-white">🏆 Free Competition</h3>
        <p className="mt-1 text-sm text-gray-400">No entry fee required</p>
        <p className="mt-1 text-xs text-gray-500">Play for glory and recognition</p>
      </div>
    );
  }

  // ✅ If waiting for players
  if (data.registeredPlayers === 0) {
    return (
      <div
        className={`rounded-2xl border border-white/10 bg-gray-800/40 p-6 text-center backdrop-blur-xl ${className}`}
      >
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-500/20 p-4">
            <Clock className="h-10 w-10 text-yellow-400" />
          </div>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-white">⏳ Waiting for Players</h3>
        <p className="mt-1 text-sm text-gray-400">Entry Fee: {formatCurrency(data.entryFee)}</p>
        <p className="mt-1 text-xs text-gray-500">Prize pool will be calculated when players pay</p>
      </div>
    );
  }

  const prizeBreakdowns = [
    {
      label: "Champion",
      icon: Crown,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      progressColor: "bg-yellow-400",
      ...data.breakdown.champion,
    },
    {
      label: "Runner Up",
      icon: Medal,
      color: "text-gray-300",
      bg: "bg-gray-700/30 border-gray-600",
      progressColor: "bg-gray-400",
      ...data.breakdown.runnerUp,
    },
    {
      label: "Top Scorer",
      icon: Target,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      progressColor: "bg-blue-400",
      ...data.breakdown.topScorer,
    },
    {
      label: "Platform Reserve",
      icon: Shield,
      color: "text-gray-500",
      bg: "bg-gray-700/30 border-gray-600",
      progressColor: "bg-gray-600",
      ...data.breakdown.platformReserve,
    },
  ];

  // ✅ Compact view for dashboard
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4 backdrop-blur-xl transition-all hover:border-indigo-500/40 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <p className="text-xs font-medium text-gray-400">Prize Pool</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(data.totalPrizePool)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{data.registeredPlayers} paid</p>
            <p className="text-xs text-gray-500">{formatCurrency(data.entryFee)} entry</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Champion:</span>
            <span className="text-xs font-bold text-yellow-400">
              {formatCurrency(data.breakdown.champion.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Runner Up:</span>
            <span className="text-xs font-bold text-gray-300">
              {formatCurrency(data.breakdown.runnerUp.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Top Scorer:</span>
            <span className="text-xs font-bold text-blue-400">
              {formatCurrency(data.breakdown.topScorer.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Reserve:</span>
            <span className="text-xs font-bold text-gray-500">
              {formatCurrency(data.breakdown.platformReserve.amount)}
            </span>
          </div>
        </div>

        {data.playerPosition && data.playerPosition.rank <= 3 && (
          <div className="mt-2 border-t border-white/10 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">🏆 Your Position</span>
              <span className="text-xs font-bold text-yellow-400">
                {getRankEmoji(data.playerPosition.rank)} -{" "}
                {formatCurrency(data.playerPosition.potentialWinnings)}
              </span>
            </div>
          </div>
        )}

        <Link
          href="/dashboard/prize"
          className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
        >
          View Full Breakdown <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>
    );
  }

  // ✅ Full view for prize page
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Prize Pool</h2>
                <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                  Live
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {data.registeredPlayers} paid players × {formatCurrency(data.entryFee)} entry fee
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-400" />
              <p className="text-3xl font-bold text-white">
                {formatCurrency(data.totalPrizePool)}
              </p>
            </div>
            <p className="text-xs text-gray-500">Total Prize Money</p>
          </div>
        </div>
      </motion.div>

      {/* Prize Breakdown */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-white/10 bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Award className="h-5 w-5 text-yellow-400" />
            Prize Distribution
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/10 bg-gray-900/40 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="space-y-3">
          {prizeBreakdowns.map((prize, index) => {
            const Icon = prize.icon;
            return (
              <motion.div
                key={prize.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-xl border p-4 ${prize.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${prize.color}`} />
                    <span className="text-sm font-medium text-white">{prize.label}</span>
                    {prize.label === "Top Scorer" && data.topScorer && (
                      <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                        👑 {data.topScorer.name} ({data.topScorer.goals} goals)
                      </span>
                    )}
                  </div>
                  <span className={`text-lg font-bold ${prize.color}`}>
                    {formatCurrency(prize.amount)}
                  </span>
                </div>
                <ProgressBar
                  percentage={prize.percentage}
                  color={prize.progressColor}
                  label={`${prize.percentage}%`}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Player Position */}
      {data.playerPosition && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl"
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Your Position
          </h3>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-gray-900/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className={`text-2xl font-bold ${getRankColor(data.playerPosition.rank)}`}>
                  {getRankEmoji(data.playerPosition.rank)}
                </span>
              </div>
              <p className="text-xs text-gray-400">Rank</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-gray-900/40 p-3 text-center">
              <p className="text-2xl font-bold text-white">{data.playerPosition.points}</p>
              <p className="text-xs text-gray-400">Points</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-gray-900/40 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {formatCurrency(data.playerPosition.potentialWinnings)}
              </p>
              <p className="text-xs text-gray-400">Potential Winnings</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-gray-900/40 p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {data.playerPosition.isTopScorer ? "👑" : "—"}
              </p>
              <p className="text-xs text-gray-400">Top Scorer</p>
            </div>
          </div>

          {data.playerPosition.currentReward > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-green-400" />
                <p className="text-sm font-medium text-green-400">
                  🏆 Currently in prize position:{" "}
                  <span className="font-bold">{formatCurrency(data.playerPosition.currentReward)}</span>
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {data.playerPosition.rank === 1
                  ? "Keep your lead to win the championship!"
                  : data.playerPosition.rank === 2
                  ? "Push for the top spot!"
                  : data.playerPosition.rank <= 3
                  ? "Stay in the top 3!"
                  : "Keep climbing the rankings!"}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Summary Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">{data.registeredPlayers} paid</span>
          </div>
          <div className="hidden h-6 w-px bg-white/10 md:block" />
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">{formatCurrency(data.entryFee)} entry</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-gray-400">{data.totalPlayers} total players</span>
        </div>
      </motion.div>
    </motion.div>
  );
}