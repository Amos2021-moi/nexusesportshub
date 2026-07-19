"use client";

import { useEffect, useState, memo, useMemo, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Medal,
  Crown,
  Sparkles,
  Shield,
  Zap,
  Target,
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Award,
  Flame,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  BarChart3,
  Info,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeagueEntry {
  id: string;
  playerId: string;
  playerName: string;
  username: string;
  profilePicture?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[];
  lastUpdated?: string;
}

interface LeagueTableProps {
  seasonId: string;
  compact?: boolean;
  limit?: number;
  highlightPlayerId?: string;
  showLive?: boolean;
}

// ✅ Premier League-style animations
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// ✅ Memoized Row Component - Premier League Style
const LeagueTableRow = memo(
  ({
    entry,
    index,
    totalEntries,
    highlightId,
    compact = false,
    isLive = false,
  }: {
    entry: LeagueEntry;
    index: number;
    totalEntries: number;
    highlightId?: string;
    compact?: boolean;
    isLive?: boolean;
  }) => {
    const isTop3 = index < 3;
    const isBottom3 = index >= totalEntries - 3;
    const isHighlighted = highlightId === entry.playerId;
    const isChampion = index === 0;
    const isRelegation = index >= totalEntries - 3 && totalEntries > 10;

    // ✅ Premier League color scheme
    const getPositionColor = (idx: number) => {
      if (idx === 0) return "text-yellow-400";
      if (idx === 1) return "text-gray-300";
      if (idx === 2) return "text-amber-500";
      if (idx < 4) return "text-emerald-400";
      if (idx >= totalEntries - 3) return "text-red-400";
      return "text-gray-400";
    };

    const rowBg = isHighlighted
      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border-l-2 border-indigo-400"
      : isTop3
      ? "bg-gradient-to-r from-emerald-500/5 to-transparent"
      : isBottom3
      ? "bg-gradient-to-r from-red-500/5 to-transparent"
      : "hover:bg-gray-700/30";

    const getRankDisplay = (idx: number) => {
      if (idx === 0)
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30 sm:h-8 sm:w-8">
            <Crown className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </div>
        );
      if (idx === 1)
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-gray-300 to-gray-400 shadow-lg shadow-gray-400/30 sm:h-8 sm:w-8">
            <Medal className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </div>
        );
      if (idx === 2)
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-600/30 sm:h-8 sm:w-8">
            <Medal className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
          </div>
        );
      return null;
    };

    const getTrendIcon = (idx: number, total: number) => {
      const topQuarter = Math.floor(total * 0.2);
      const bottomQuarter = Math.floor(total * 0.8);
      if (idx < topQuarter)
        return <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />;
      if (idx > bottomQuarter)
        return <ArrowDown className="h-3.5 w-3.5 text-red-400" />;
      return <Minus className="h-3.5 w-3.5 text-gray-500" />;
    };

    // ✅ Premier League form colors
    const formColors: Record<string, string> = {
      W: "bg-emerald-500/30 text-emerald-400 border-emerald-500/50",
      D: "bg-yellow-500/30 text-yellow-400 border-yellow-500/50",
      L: "bg-red-500/30 text-red-400 border-red-500/50",
    };

    const formResults = entry.form || ["W", "D", "L", "W", "D"];

    // ✅ Live indicator pulse
    const isLiveMatch = isLive && index < 3;

    return (
      <motion.tr
        variants={itemVariants}
        className={cn(
          "relative transition-all duration-300",
          rowBg,
          isChampion && "border-l-2 border-yellow-400/50",
          isHighlighted && "shadow-[inset_0_0_30px_rgba(99,102,241,0.1)]"
        )}
        initial={false}
        animate={isHighlighted ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Position / Rank */}
        <td className="px-2 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={cn(
                "text-xs font-bold tabular-nums sm:text-sm",
                getPositionColor(index)
              )}
            >
              {index + 1}
            </span>
            {getRankDisplay(index)}
            {!compact && (
              <span className="hidden sm:inline-block">
                {getTrendIcon(index, totalEntries)}
              </span>
            )}
          </div>
        </td>

        {/* Player */}
        {!compact && (
          <td className="px-2 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                {entry.profilePicture ? (
                  <Image
                    src={entry.profilePicture}
                    alt={entry.username}
                    width={32}
                    height={32}
                    className="h-7 w-7 rounded-full border border-gray-600 object-cover sm:h-9 sm:w-9"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white sm:h-9 sm:w-9">
                    {entry.username?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                )}
                {isLiveMatch && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white sm:text-sm">
                  {entry.username}
                </span>
                {isHighlighted && (
                  <span className="ml-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-1.5 py-0.5 text-[8px] font-medium text-indigo-300 sm:ml-2 sm:px-2 sm:text-[10px]">
                    You
                  </span>
                )}
              </div>
            </div>
          </td>
        )}

        {/* Compact View */}
        {compact ? (
          <>
            <td className="px-2 py-2 text-center text-sm font-bold text-white sm:px-3">
              {entry.points}
            </td>
            <td className="px-2 py-2 text-center text-sm font-semibold text-emerald-400 sm:px-3">
              {entry.wins}
            </td>
            <td className="px-2 py-2 text-center sm:px-3">
              <div className="flex justify-center gap-0.5">
                {formResults.slice(0, 3).map((r, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold sm:h-6 sm:w-6 sm:text-[10px]",
                      formColors[r] || "bg-gray-500/20 text-gray-400 border-gray-500/50"
                    )}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </td>
          </>
        ) : (
          <>
            {/* Stats */}
            <td className="px-2 py-2 text-center text-xs text-gray-300 sm:px-4 sm:py-3 sm:text-sm">
              {entry.played}
            </td>
            <td className="px-2 py-2 text-center text-xs font-semibold text-emerald-400 sm:px-4 sm:py-3 sm:text-sm">
              {entry.wins}
            </td>
            <td className="px-2 py-2 text-center text-xs font-semibold text-yellow-400 sm:px-4 sm:py-3 sm:text-sm">
              {entry.draws}
            </td>
            <td className="px-2 py-2 text-center text-xs font-semibold text-red-400 sm:px-4 sm:py-3 sm:text-sm">
              {entry.losses}
            </td>
            <td className="px-2 py-2 text-center text-xs text-gray-300 sm:px-4 sm:py-3 sm:text-sm">
              {entry.goalsFor}
            </td>
            <td className="px-2 py-2 text-center text-xs text-gray-300 sm:px-4 sm:py-3 sm:text-sm">
              {entry.goalsAgainst}
            </td>
            <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
              <span
                className={cn(
                  "text-xs font-bold sm:text-sm",
                  entry.goalDifference >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {entry.goalDifference > 0 ? "+" : ""}
                {entry.goalDifference}
              </span>
            </td>

            {/* Points - Premier League Style */}
            <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
              <span className="text-base font-bold text-white sm:text-xl">
                {entry.points}
              </span>
              {isChampion && (
                <span className="ml-1 text-[8px] text-yellow-400/60 sm:ml-1.5 sm:text-[10px]">
                  ★
                </span>
              )}
            </td>

            {/* Form - Premier League Style */}
            <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
              <div className="flex justify-center gap-0.5 sm:gap-1">
                {formResults.map((r, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold sm:h-6 sm:w-6 sm:text-[10px]",
                      formColors[r] || "bg-gray-500/20 text-gray-400 border-gray-500/50"
                    )}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </td>
          </>
        )}
      </motion.tr>
    );
  }
);

LeagueTableRow.displayName = "LeagueTableRow";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function LeagueTable({
  seasonId,
  compact = false,
  limit = 0,
  highlightPlayerId,
  showLive = true,
}: LeagueTableProps) {
  const [entries, setEntries] = useState<LeagueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<"points" | "goals" | "wins">("points");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [highlightedEntry, setHighlightedEntry] = useState<string | null>(null);

  // ✅ Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!refreshing) {
        fetchTable();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [seasonId, sortBy, autoRefresh]);

  useEffect(() => {
    if (seasonId) {
      fetchTable();
    }
  }, [seasonId, sortBy]);

  async function fetchTable() {
    setRefreshing(true);
    try {
      const response = await fetch(
        `/api/league/table?seasonId=${seasonId}&sort=${sortBy}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch league table");
      }
      const data = await response.json();
      setEntries(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error("Error fetching league table:", error);
      setError("Failed to load league table");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const displayEntries = useMemo(() => {
    if (limit > 0) {
      return entries.slice(0, limit);
    }
    return entries;
  }, [entries, limit]);

  const totalEntries = entries.length;
  const isFiltered = limit > 0 && totalEntries > limit;

  // ✅ Get stats
  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const leader = entries[0];
    const topScorer = [...entries].sort((a, b) => b.goalsFor - a.goalsFor)[0];
    const mostWins = [...entries].sort((a, b) => b.wins - a.wins)[0];
    return { leader, topScorer, mostWins };
  }, [entries]);

  // ✅ Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
          <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
        </div>
        <p className="mt-4 text-sm text-gray-400">Loading league table...</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
          <Sparkles className="h-3 w-3 text-yellow-400" />
          <span>Fetching latest standings</span>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-xl">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-red-300">{error}</p>
        <button
          onClick={fetchTable}
          className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2 text-sm font-medium text-red-300 transition-all hover:bg-red-500/30"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ✅ Empty state
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-10 text-center backdrop-blur-xl">
        <Trophy className="mx-auto h-14 w-14 text-gray-600" />
        <h3 className="mt-4 text-xl font-semibold text-white">No Data Yet</h3>
        <p className="mt-1.5 text-sm text-gray-400">
          League table will appear once matches are played.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Check back after matches are submitted</span>
        </div>
      </div>
    );
  }

  // ✅ Compact view for dashboard
  if (compact) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        {/* Compact header with live indicator */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gray-800/60 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <h3 className="text-xs font-semibold text-white sm:text-sm">
              Standings
            </h3>
            {showLive && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[8px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            )}
          </div>
          {lastUpdated && (
            <span className="text-[9px] text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10 bg-gray-800/50">
                <th className="px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:px-3">
                  #
                </th>
                <th className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:px-3">
                  Pts
                </th>
                <th className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:px-3">
                  W
                </th>
                <th className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wider text-gray-400 sm:px-3">
                  Form
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayEntries.map((entry, index) => (
                <LeagueTableRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  totalEntries={totalEntries}
                  highlightId={highlightPlayerId}
                  compact={true}
                  isLive={showLive}
                />
              ))}
            </tbody>
          </table>
        </div>

        {isFiltered && (
          <div className="border-t border-white/10 p-3 text-center">
            <Link
              href="/dashboard/standings"
              className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View Full Table →
            </Link>
          </div>
        )}
      </motion.div>
    );
  }

  // ✅ Full view for standings page
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl overflow-hidden"
    >
      {/* Premier League Style Header */}
      <motion.div
        variants={headerVariants}
        className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-gray-800/80 via-gray-800/60 to-indigo-900/30 p-4 sm:p-6"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white sm:text-2xl">
                League Standings
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{entries.length} Players</span>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                {showLive && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                )}
                {lastUpdated && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-gray-600" />
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "points" | "goals" | "wins")
              }
              className="min-h-[36px] rounded-xl border border-white/10 bg-gray-900/50 px-3 py-1.5 text-xs text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:min-h-[40px]"
            >
              <option value="points">🏆 Sort by Points</option>
              <option value="goals">⚽ Sort by Goals</option>
              <option value="wins">🎯 Sort by Wins</option>
            </select>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl border transition-all sm:min-h-[40px] ${
                autoRefresh
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-gray-900/50 text-gray-400"
              }`}
              title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
            >
              <Clock className={`h-4 w-4 ${autoRefresh ? "animate-pulse" : ""}`} />
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchTable}
              disabled={refreshing}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50 sm:min-h-[40px]"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mini stats */}
        {stats && (
          <div className="relative mt-4 flex flex-wrap gap-4 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-gray-300">
                Leader: <span className="font-semibold text-white">{stats.leader.username}</span>
                <span className="ml-1 text-yellow-400">({stats.leader.points} pts)</span>
              </span>
            </div>
            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-300">
                Top Scorer: <span className="font-semibold text-white">{stats.topScorer.username}</span>
                <span className="ml-1 text-emerald-400">({stats.topScorer.goalsFor} goals)</span>
              </span>
            </div>
            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-gray-300">
                Most Wins: <span className="font-semibold text-white">{stats.mostWins.username}</span>
                <span className="ml-1 text-amber-400">({stats.mostWins.wins} wins)</span>
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10 bg-gray-800/50">
              <th className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                #
              </th>
              <th className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                Player
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                P
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                W
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                D
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                L
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                GF
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                GA
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                GD
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                Pts
              </th>
              <th className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:py-3 sm:text-xs">
                Form
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayEntries.map((entry, index) => (
              <LeagueTableRow
                key={entry.id}
                entry={entry}
                index={index}
                totalEntries={totalEntries}
                highlightId={highlightPlayerId}
                isLive={showLive}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Premier League Style Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-gray-800/50 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500/30" />
            <span>W = Win</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500/30" />
            <span>D = Draw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500/30" />
            <span>L = Loss</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500/30 border border-indigo-400/30" />
            <span>You</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Win = 3 pts</span>
          <span className="h-1 w-1 rounded-full bg-gray-600" />
          <span>Draw = 1 pt</span>
          <span className="h-1 w-1 rounded-full bg-gray-600" />
          <span>Loss = 0 pts</span>
        </div>
      </div>
    </motion.div>
  );
}