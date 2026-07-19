// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Shield,
  ArrowRight,
  Home,
  Plane,
  ChevronRight,
  Sparkles,
  RefreshCw,
  MessageCircle,
  BarChart3,
  Zap,
  Crown,
  Activity,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// UI Components
import TrustBadge from "@/components/ui/TrustBadge";
import { SkeletonStats, Skeleton } from "@/components/ui/Skeleton";
import StatusCard from "@/components/competition/StatusCard";
import PrizeDisplay from "@/components/competition/PrizeDisplay";
import PaymentModal from "@/components/competition/PaymentModal";

// Dashboard Components
import LiveMatchClock from "@/components/dashboard/LiveMatchClock";
import SeasonProgress from "@/components/dashboard/SeasonProgress";
import AchievementBadges from "@/components/dashboard/AchievementBadges";
import StreakTracker from "@/components/dashboard/StreakTracker";
import TrustScoreMeter from "@/components/dashboard/TrustScoreMeter";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import HeadToHeadStats from "@/components/dashboard/HeadToHeadStats";

interface DashboardData {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  currentRank: number;
  totalPlayers: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  nextFixture: {
    id: string;
    opponent: string;
    opponentId?: string;
    date: string;
    isHome: boolean;
  } | null;
  recentResult: {
    opponent: string;
    score: string;
    result: string;
  } | null;
  recentForm?: string[];
  seasonProgress?: {
    percentage: number;
    matchesPlayed: number;
    totalMatches: number;
  };
  streak?: {
    currentStreak: number;
    bestStreak: number;
    streakType: 'wins' | 'losses' | null;
  };
  trustScore?: {
    score: number;
    level: string;
    nextMilestone: number;
    metrics?: {
      matchCompletion: number;
      resultConsistency: number;
      reportAccuracy: number;
      activityLevel: number;
      sportsmanship: number;
    };
  };
  achievements?: {
    total: number;
    unlocked: number;
    list: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      unlocked: boolean;
    }>;
  };
  activity?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
  }>;
}

interface PlayerEntry {
  hasEntry: boolean;
  seasonId: string | null;
  seasonName: string | null;
  paymentRequired: boolean;
  entryFee: number;
  hasPaid: boolean;
  status: string;
}

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  stat: {
    name: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    change: string;
  };
}

const StatCard = memo(({ stat }: StatCardProps) => {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{
        y: -5,
        scale: 1.025,
        transition: { type: "spring", stiffness: 350, damping: 22 },
      }}
      className="will-change-transform h-full"
    >
      <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.08] hover:shadow-[0_8px_32px_0_rgba(79,70,229,0.18)] sm:p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />

        <div className="relative flex items-center justify-between gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-black/30 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12`}
          >
            <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <span className="text-right text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-3xl">
            {stat.value}
          </span>
        </div>

        <div className="relative mt-4 flex items-baseline justify-between border-t border-white/[0.06] pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-300 sm:text-sm">
            {stat.name}
          </p>
          <p className="text-[11px] font-medium text-gray-400 sm:text-xs">{stat.change}</p>
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

interface GoalStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  borderColor: string;
}

const GoalStat = memo(({ icon: Icon, label, value, color, borderColor }: GoalStatProps) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: "easeOut" }}
    className="group relative flex h-full items-center gap-3.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.07] sm:p-5"
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${borderColor} ring-1 transition-all duration-300 group-hover:scale-105 sm:h-12 sm:w-12`}
    >
      <Icon className={`h-5 w-5 ${color} sm:h-6 sm:w-6`} />
    </div>
    <div className="min-w-0 flex-1">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:text-xs">
        {label}
      </span>
      <p className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
        {value}
      </p>
    </div>
  </motion.div>
));

GoalStat.displayName = "GoalStat";

const FormBadge = memo(({ result }: { result: string }) => {
  const configs: Record<
    string,
    { color: string; bg: string; border: string; label: string }
  > = {
    W: {
      color: "text-emerald-300",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30 ring-emerald-400/20",
      label: "W",
    },
    D: {
      color: "text-amber-300",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30 ring-amber-400/20",
      label: "D",
    },
    L: {
      color: "text-rose-300",
      bg: "bg-rose-500/20",
      border: "border-rose-500/30 ring-rose-400/20",
      label: "L",
    },
  };
  const config = configs[result] || configs.L;
  return (
    <span
      className={`inline-flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-xl border ${config.border} ${config.bg} text-xs font-bold ${config.color} shadow-sm ring-1 transition-transform hover:scale-110 sm:h-9 sm:w-9 sm:min-h-[36px] sm:min-w-[36px] sm:text-sm`}
    >
      {config.label}
    </span>
  );
});

FormBadge.displayName = "FormBadge";

/* -------------------------------------------------------------------------- */
/*                           Background Component                             */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gray-950">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80" />
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]"
    />
    <motion.div
      animate={{ scale: [1.15, 1, 1.15], opacity: [0.2, 0.35, 0.2] }}
      transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-40 top-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-[120px]"
    />
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                             Main Component                                 */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [playerEntry, setPlayerEntry] = useState<PlayerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome");
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // ✅ Fetch dashboard data
  const {
    data: dashboardData,
    refetch: refetchDashboard,
    isLoading,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard-all-data"],
    queryFn: async () => {
      const start = performance.now();
      const res = await fetch("/api/dashboard/all", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await res.json();
      const duration = performance.now() - start;
      console.log(`📊 Dashboard data fetched in ${duration.toFixed(0)}ms`);
      return data;
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session && !isAdmin,
  });

  // ✅ Fetch player entry
  const { data: entryData, refetch: refetchEntry } = useQuery<PlayerEntry | null>({
    queryKey: ["player-entry"],
    queryFn: async () => {
      if (isAdmin) return null;
      const res = await fetch("/api/competition/player-entry", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch player entry");
      return res.json();
    },
    staleTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session && !isAdmin,
  });

  // Check if payment is needed
  useEffect(() => {
    if (entryData?.hasEntry && entryData?.paymentRequired && !entryData?.hasPaid) {
      setShowPaymentModal(true);
    }
  }, [entryData]);

  // Set player entry and loading
  useEffect(() => {
    if (entryData !== undefined) {
      setPlayerEntry(entryData);
    }
    if (isAdmin || entryData !== undefined) {
      setLoading(false);
    }
  }, [entryData, isAdmin]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentModal(false);
    refetchEntry();
    refetchDashboard();
    queryClient.invalidateQueries({ queryKey: ["player-entry"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-all-data"] });
    toast.success("✅ Payment confirmed! Welcome to the season!");
  }, [refetchEntry, refetchDashboard, queryClient]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchDashboard(),
        refetchEntry(),
        queryClient.invalidateQueries({ queryKey: ["dashboard-all-data"] }),
        queryClient.invalidateQueries({ queryKey: ["player-entry"] }),
      ]);
      toast.success("🔄 Dashboard refreshed!");
    } catch (error) {
      toast.error("Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  };

  // Stats
  const stats = useMemo(
    () => [
      {
        name: "Matches Played",
        value: dashboardData?.matchesPlayed ?? 0,
        icon: Calendar,
        color: "from-blue-600 to-cyan-500",
        change: "Active Season",
      },
      {
        name: "Win Rate",
        value: `${dashboardData?.winRate ?? 0}%`,
        icon: TrendingUp,
        color: "from-emerald-600 to-teal-500",
        change: `${dashboardData?.wins ?? 0}W ${dashboardData?.draws ?? 0}D ${dashboardData?.losses ?? 0}L`,
      },
      {
        name: "League Rank",
        value: dashboardData?.currentRank ? `#${dashboardData.currentRank}` : "-",
        icon: Trophy,
        color: "from-amber-500 to-orange-600",
        change: `of ${dashboardData?.totalPlayers ?? 0} players`,
      },
      {
        name: "Total Points",
        value: dashboardData?.points ?? 0,
        icon: Award,
        color: "from-purple-600 to-pink-500",
        change: `${dashboardData?.wins ?? 0}W ${dashboardData?.draws ?? 0}D ${dashboardData?.losses ?? 0}L`,
      },
    ],
    [dashboardData]
  );

  const rankProgress = useMemo(() => {
    if (dashboardData?.currentRank && dashboardData?.totalPlayers && dashboardData.totalPlayers > 0) {
      return Math.max(
        5,
        Math.round(
          ((dashboardData.totalPlayers - dashboardData.currentRank + 1) / dashboardData.totalPlayers) * 100
        )
      );
    }
    return 0;
  }, [dashboardData?.currentRank, dashboardData?.totalPlayers]);

  const shouldShowPrize =
    !isAdmin &&
    playerEntry?.hasEntry &&
    playerEntry?.paymentRequired &&
    playerEntry?.hasPaid;

  const recentForm = useMemo(
    () => dashboardData?.recentForm || ["W", "D", "L", "W", "D"],
    [dashboardData?.recentForm]
  );

  const nextOpponentId = dashboardData?.nextFixture?.opponentId || null;
  const nextOpponentName = dashboardData?.nextFixture?.opponent || null;

  // ⚠️ If admin, redirect (or show admin dashboard)
  if (isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <Shield className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Redirecting to admin panel...</p>
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Go to Admin Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || isLoading) {
    return (
      <>
        <DecorBackground />
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <Skeleton variant="text" className="h-8 w-56 sm:h-10 sm:w-72" />
            <Skeleton variant="text" className="mt-3 h-4 w-44 sm:h-5 sm:w-64" />
            <div className="mt-4 flex gap-3">
              <Skeleton variant="text" className="h-6 w-24 rounded-full" />
              <Skeleton variant="text" className="h-6 w-32 rounded-full" />
            </div>
          </div>
          <SkeletonStats />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton variant="card" className="h-[320px] rounded-2xl" />
            <Skeleton variant="card" className="h-[320px] rounded-2xl" />
            <Skeleton variant="card" className="h-[320px] rounded-2xl" />
            <Skeleton variant="card" className="h-[320px] rounded-2xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mx-auto max-w-7xl space-y-6 px-3 pb-24 pt-6 sm:space-y-8 sm:px-6 lg:px-8"
      >
        {/* ===================================================================== */}
        {/* 1. Welcome Banner                                                     */}
        {/* ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/20 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-7 lg:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {`${greeting}, ${session?.user?.name || "Player"}! 👋`}
                </h1>
                <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-indigo-300 shadow-sm sm:text-xs">
                  NEXUS COMPETING PLAYER
                </span>
                {playerEntry?.hasPaid && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-300 shadow-sm sm:text-xs">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    ACTIVE SEASON
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-300 sm:text-base">
                {playerEntry?.hasPaid
                  ? "You're primed for battle! Review your upcoming fixtures and track your competitive streak below."
                  : "Complete your season entry to activate official league matches and unlock prize pools!"}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 sm:gap-4">
                <TrustBadge type="last-active" />
                {playerEntry?.hasPaid && (
                  <span className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-white/10">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    Verified Nexus Athlete
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="group inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform duration-500 ${
                  refreshing ? "animate-spin text-indigo-400" : "group-hover:rotate-180"
                }`}
              />
              <span>Refresh Dashboard</span>
            </button>
          </div>
        </motion.div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          seasonId={entryData?.seasonId || ""}
          entryFee={entryData?.entryFee || 0}
          seasonName={entryData?.seasonName || "Season"}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />

        {/* Status Card */}
        {playerEntry?.hasEntry && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <StatusCard
              seasonId={playerEntry.seasonId || ""}
              seasonName={playerEntry.seasonName || ""}
              paymentRequired={playerEntry.paymentRequired}
              entryFee={playerEntry.entryFee}
              hasPaid={playerEntry.hasPaid}
              status={playerEntry.status}
              userId={session?.user?.id || ""}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </motion.div>
        )}

        {/* Prize Display */}
        {shouldShowPrize && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <PrizeDisplay compact={true} />
          </motion.div>
        )}

        {/* ===================================================================== */}
        {/* 2. Stats Grid (4 cols)                                                */}
        {/* ===================================================================== */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 items-stretch"
        >
          {stats.map((stat) => (
            <StatCard key={stat.name} stat={stat} />
          ))}
        </motion.div>

        {/* ===================================================================== */}
        {/* 3. Goal Stats (3 cols)                                                */}
        {/* ===================================================================== */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 items-stretch"
        >
          <GoalStat
            icon={Target}
            label="Goals For"
            value={dashboardData?.goalsFor ?? 0}
            color="text-cyan-400"
            borderColor="bg-cyan-500/15 border-cyan-500/30 ring-cyan-500/20"
          />
          <GoalStat
            icon={Shield}
            label="Goals Against"
            value={dashboardData?.goalsAgainst ?? 0}
            color="text-rose-400"
            borderColor="bg-rose-500/15 border-rose-500/30 ring-rose-500/20"
          />
          <GoalStat
            icon={TrendingUp}
            label="Goal Difference"
            value={
              (dashboardData?.goalDifference ?? 0) >= 0
                ? `+${dashboardData?.goalDifference ?? 0}`
                : dashboardData?.goalDifference ?? 0
            }
            color={(dashboardData?.goalDifference ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}
            borderColor={
              (dashboardData?.goalDifference ?? 0) >= 0
                ? "bg-emerald-500/15 border-emerald-500/30 ring-emerald-500/20"
                : "bg-rose-500/15 border-rose-500/30 ring-rose-500/20"
            }
          />
        </motion.div>

        {/* ===================================================================== */}
        {/* 4 & 5. Unified 2x2 Grid                                               */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Top Left: Next Fixture */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="group relative flex min-h-[320px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-white sm:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-500/30">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                Next Fixture
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                Upcoming
              </span>
            </div>

            {dashboardData?.nextFixture ? (
              <div className="flex flex-1 flex-col items-center justify-center p-5 text-center sm:p-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-xl font-black text-white shadow-xl shadow-indigo-950/60 ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20 sm:text-2xl">
                  {getInitials(dashboardData.nextFixture.opponent)}
                </div>
                <p className="mt-4 text-lg font-black tracking-tight text-white sm:text-xl">
                  vs {dashboardData.nextFixture.opponent}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      dashboardData.nextFixture.isHome
                        ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/20"
                        : "border border-amber-500/30 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/20"
                    }`}
                  >
                    {dashboardData.nextFixture.isHome ? (
                      <>
                        <Home className="h-3.5 w-3.5" /> Home Match
                      </>
                    ) : (
                      <>
                        <Plane className="h-3.5 w-3.5" /> Away Match
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-3 text-xs font-medium text-gray-400 sm:text-sm">
                  {new Date(dashboardData.nextFixture.date).toLocaleDateString(
                    undefined,
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
                <div className="mt-5 w-full sm:w-auto">
                  <Link
                    href="/dashboard/fixtures"
                    className="group/btn inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 sm:w-auto"
                  >
                    Match Center
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
                  <Calendar className="h-7 w-7" />
                </div>
                <p className="mt-3 text-base font-semibold text-gray-300">No scheduled fixtures</p>
                <p className="mt-1 text-xs text-gray-500">Check back later or explore open tournaments.</p>
              </div>
            )}
          </motion.div>

          {/* Top Right: Recent Result */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="group relative flex min-h-[320px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-white sm:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                Recent Result
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
                <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                Latest Match
              </span>
            </div>

            {dashboardData?.recentResult ? (
              <div className="flex flex-1 flex-col items-center justify-center p-5 text-center sm:p-6">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 text-xl font-black text-white shadow-xl ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20 sm:text-2xl">
                  {getInitials(dashboardData.recentResult.opponent)}
                </div>
                <p className="mt-4 text-lg font-black tracking-tight text-white sm:text-xl">
                  vs {dashboardData.recentResult.opponent}
                </p>
                <div className="my-3 flex items-center justify-center">
                  <span className="rounded-xl border border-white/15 bg-black/40 px-5 py-1.5 font-mono text-3xl font-black tracking-widest text-white shadow-inner sm:text-4xl">
                    {dashboardData.recentResult.score}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      dashboardData.recentResult.result === "W"
                        ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/20"
                        : dashboardData.recentResult.result === "D"
                        ? "border border-amber-500/30 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/20"
                        : "border border-rose-500/30 bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/20"
                    }`}
                  >
                    {dashboardData.recentResult.result === "W"
                      ? "Victory! 🎉"
                      : dashboardData.recentResult.result === "D"
                      ? "Draw Match 🤝"
                      : "Defeat 😔"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
                  <Trophy className="h-7 w-7" />
                </div>
                <p className="mt-3 text-base font-semibold text-gray-300">No recent match results</p>
                <p className="mt-1 text-xs text-gray-500">Play matches to populate your performance logs.</p>
              </div>
            )}
          </motion.div>

          {/* Bottom Left: Recent Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="group relative flex min-h-[320px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-white sm:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 ring-1 ring-purple-500/30">
                  <Activity className="h-4 w-4 text-purple-400" />
                </div>
                Recent Results
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
                <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
                Last 5 Matches
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
              {/* Form Guide Pills Row */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Form Guide
                </span>
                <div className="flex items-center gap-2">
                  {recentForm.map((result, index) => (
                    <FormBadge key={index} result={result} />
                  ))}
                </div>
              </div>

              {/* Table / Match Breakdown */}
              <div className="flex-1 space-y-2.5">
                {dashboardData?.recentResult && (
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 font-mono text-xs font-bold text-indigo-300 ring-1 ring-indigo-500/30">
                        #1
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">
                          vs {dashboardData.recentResult.opponent}
                        </p>
                        <p className="text-[11px] text-gray-400">Official League Match</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white">
                        {dashboardData.recentResult.score}
                      </span>
                      <FormBadge result={dashboardData.recentResult.result} />
                    </div>
                  </div>
                )}

                {recentForm.slice(dashboardData?.recentResult ? 1 : 0, 4).map((res, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-xs font-bold text-gray-400 ring-1 ring-white/10">
                        #{idx + (dashboardData?.recentResult ? 2 : 1)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">League Match #{5 - idx}</p>
                        <p className="text-[11px] text-gray-500">Division Fixture</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-gray-400">
                        {res === "W" ? "+3 pts" : res === "D" ? "+1 pt" : "0 pts"}
                      </span>
                      <FormBadge result={res} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-3 text-center">
                <Link
                  href="/dashboard/statistics"
                  className="group/link inline-flex min-h-[44px] items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-purple-400 transition-colors hover:text-purple-300"
                >
                  View Full Match Logs
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Bottom Right: Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="group relative flex min-h-[320px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
              <h2 className="flex items-center gap-2.5 text-base font-bold text-white sm:text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 ring-1 ring-pink-500/30">
                  <Activity className="h-4 w-4 text-pink-400" />
                </div>
                Recent Activity
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                Live Feed
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-stretch [&>*]:flex-1">
              <ActivityFeed />
            </div>
          </motion.div>
        </div>

        {/* ===================================================================== */}
        {/* 6. Live Match Clock & Interactive Widgets                             */}
        {/* ===================================================================== */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
              Live Match Clock &amp; Interactive Widgets
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            {/* Left Hub Column */}
            <div className="space-y-6 flex flex-col justify-between">
              <LiveMatchClock />
              <SeasonProgress />
              <StreakTracker />
              {nextOpponentId && (
                <HeadToHeadStats
                  opponentId={nextOpponentId}
                  opponentName={nextOpponentName || undefined}
                />
              )}
            </div>

            {/* Right Hub Column */}
            <div className="space-y-6 flex flex-col justify-between">
              <TrustScoreMeter />
              <AchievementBadges />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 7. League Standings Spotlight                                         */}
        {/* ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.18]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-white sm:text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30">
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              League Standings Spotlight
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              Live Table
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 shadow-xl shadow-orange-950/50 ring-2 ring-white/20 sm:h-20 sm:w-20">
                  <Crown className="h-8 w-8 text-white sm:h-9 sm:w-9" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400/90 sm:text-sm">
                    Current Leaderboard Placement
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    #{dashboardData?.currentRank || "-"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-gray-400 sm:text-sm">
                    Competing among{" "}
                    <span className="font-semibold text-white">
                      {dashboardData?.totalPlayers ?? 0}
                    </span>{" "}
                    registered players
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/standings"
                className="group/link inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-5 py-2.5 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-600/20 sm:w-auto"
              >
                Explore Full Table
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
              </Link>
            </div>

            {/* Percentile Progress Bar */}
            {dashboardData?.currentRank && dashboardData?.totalPlayers ? (
              <div className="mt-6 sm:mt-8">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <span>Bottom Tier</span>
                  <span className="text-amber-400 font-bold">{rankProgress}% Percentile Rank</span>
                  <span>Top of Table</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.08] p-0.5 ring-1 ring-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rankProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-sm"
                  />
                </div>
              </div>
            ) : null}

            {/* Quick Stat Pills */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center sm:gap-4">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10">
                <p className="text-lg font-black text-emerald-400 sm:text-2xl">
                  {dashboardData?.wins ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Victories
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10">
                <p className="text-lg font-black text-amber-400 sm:text-2xl">
                  {dashboardData?.draws ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Draws
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10">
                <p className="text-lg font-black text-rose-400 sm:text-2xl">
                  {dashboardData?.losses ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Losses
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* 8. Quick Actions (4 cols)                                             */}
        {/* ===================================================================== */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 items-stretch"
        >
          <Link
            href="/dashboard/fixtures"
            className="group relative flex min-h-[80px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)] sm:min-h-[96px] sm:p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-500/30 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
              <Calendar className="h-5 w-5 text-blue-400 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-2.5 text-xs font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-3 sm:text-sm">
              Fixtures
            </span>
          </Link>

          <Link
            href="/dashboard/standings"
            className="group relative flex min-h-[80px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)] sm:min-h-[96px] sm:p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
              <Trophy className="h-5 w-5 text-amber-400 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-2.5 text-xs font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-3 sm:text-sm">
              Standings
            </span>
          </Link>

          <Link
            href="/dashboard/statistics"
            className="group relative flex min-h-[80px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(168,85,247,0.2)] sm:min-h-[96px] sm:p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-500/30 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
              <BarChart3 className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-2.5 text-xs font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-3 sm:text-sm">
              Statistics
            </span>
          </Link>

          <Link
            href="/dashboard/community"
            className="group relative flex min-h-[80px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(236,72,153,0.2)] sm:min-h-[96px] sm:p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 ring-1 ring-pink-500/30 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
              <MessageCircle className="h-5 w-5 text-pink-400 sm:h-6 sm:w-6" />
            </div>
            <span className="mt-2.5 text-xs font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-3 sm:text-sm">
              Community
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </>
  );
}