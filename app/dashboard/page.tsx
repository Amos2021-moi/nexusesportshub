"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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

// Types
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
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

// === Mobile Detection Hook ===
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
/*                           STATIC Background - NO ANIMATIONS               */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gray-950" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80" />
      <div className="absolute -left-40 -top-32 h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute -right-40 top-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Stat Card ===
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
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:border-white/[0.18] hover:bg-white/[0.08] hover:shadow-[0_8px_32px_0_rgba(79,70,229,0.18)]";

  return (
    <div className={`h-full group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 ${hoverClass} sm:p-5`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-black/30 ring-1 ring-white/20 transition-transform duration-150 group-hover:scale-105 sm:h-11 sm:w-11`}
        >
          <Icon className="h-5 w-5 text-white sm:h-5 sm:w-5" />
        </div>
        <span className="text-right text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-3xl">
          {stat.value}
        </span>
      </div>

      <div className="relative mt-3 flex items-baseline justify-between border-t border-white/[0.05] pt-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 sm:text-xs">
          {stat.name}
        </p>
        <p className="text-[10px] font-medium text-gray-400 sm:text-xs">{stat.change}</p>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";

// === STATIC Goal Stat ===
interface GoalStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  borderColor: string;
}

const GoalStat = memo(({ icon: Icon, label, value, color, borderColor }: GoalStatProps) => {
  return (
    <div className="group relative flex h-full items-center gap-3.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-lg backdrop-blur-xl transition-all duration-150 hover:border-white/[0.16] hover:bg-white/[0.07] sm:p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${borderColor} ring-1 transition-all duration-150 group-hover:scale-105 sm:h-12 sm:w-12`}
      >
        <Icon className={`h-5 w-5 ${color} sm:h-6 sm:w-6`} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">
          {label}
        </span>
        <p className="mt-0.5 text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
});

GoalStat.displayName = "GoalStat";

// === STATIC Form Badge ===
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
      className={`inline-flex h-7 w-7 min-h-[28px] min-w-[28px] items-center justify-center rounded-lg border ${config.border} ${config.bg} text-[10px] font-bold ${config.color} shadow-sm ring-1 sm:h-8 sm:w-8 sm:min-h-[32px] sm:min-w-[32px] sm:text-xs`}
    >
      {config.label}
    </span>
  );
});

FormBadge.displayName = "FormBadge";

// === STATIC Form Guide ===
const FormGuide = memo(({ form }: { form: string[] }) => (
  <div className="flex items-center gap-1.5">
    {form.map((result, index) => (
      <FormBadge key={index} result={result} />
    ))}
  </div>
));

FormGuide.displayName = "FormGuide";

// === STATIC Recent Result Display ===
const RecentResultDisplay = memo(({ result }: { result: any }) => {
  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
          <Trophy className="h-6 w-6" />
        </div>
        <p className="mt-2.5 text-sm font-semibold text-gray-300">No recent match results</p>
        <p className="mt-0.5 text-[10px] text-gray-500">Play matches to populate your logs</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center sm:p-5">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 text-lg font-black text-white shadow-xl ring-2 ring-white/20 sm:h-16 sm:w-16 sm:text-xl">
        {getInitials(result.opponent)}
      </div>
      <p className="mt-3 text-base font-black tracking-tight text-white sm:text-lg">
        vs {result.opponent}
      </p>
      <div className="my-2 flex items-center justify-center">
        <span className="rounded-lg border border-white/15 bg-black/40 px-4 py-1 font-mono text-2xl font-black tracking-widest text-white shadow-inner sm:text-3xl">
          {result.score}
        </span>
      </div>
      <div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            result.result === "W"
              ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/20"
              : result.result === "D"
              ? "border border-amber-500/30 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/20"
              : "border border-rose-500/30 bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/20"
          }`}
        >
          {result.result === "W"
            ? "Victory! 🎉"
            : result.result === "D"
            ? "Draw 🤝"
            : "Defeat"}
        </span>
      </div>
    </div>
  );
});

RecentResultDisplay.displayName = "RecentResultDisplay";

// === STATIC Next Fixture Display ===
const NextFixtureDisplay = memo(({ fixture }: { fixture: any }) => {
  if (!fixture) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-500">
          <Calendar className="h-6 w-6" />
        </div>
        <p className="mt-2.5 text-sm font-semibold text-gray-300">No scheduled fixtures</p>
        <p className="mt-0.5 text-[10px] text-gray-500">Check back later for updates</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center sm:p-5">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-black text-white shadow-xl shadow-indigo-950/60 ring-2 ring-white/20 sm:h-16 sm:w-16 sm:text-xl">
        {getInitials(fixture.opponent)}
      </div>
      <p className="mt-3 text-base font-black tracking-tight text-white sm:text-lg">
        vs {fixture.opponent}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            fixture.isHome
              ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/20"
              : "border border-amber-500/30 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/20"
          }`}
        >
          {fixture.isHome ? (
            <>
              <Home className="h-3 w-3" /> Home
            </>
          ) : (
            <>
              <Plane className="h-3 w-3" /> Away
            </>
          )}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-medium text-gray-400 sm:text-xs">
        {new Date(fixture.date).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="mt-4 w-full sm:w-auto">
        <Link
          href="/dashboard/fixtures"
          className="group/btn inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:from-indigo-500 hover:to-purple-500 sm:w-auto"
        >
          Match Center
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
});

NextFixtureDisplay.displayName = "NextFixtureDisplay";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [playerEntry, setPlayerEntry] = useState<PlayerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome");
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const isAdmin = session?.user?.role === "ADMIN";

  // Redirect admin users
  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      router.replace("/admin");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // ✅ Fetch dashboard data with auto-refresh
  const {
    data: dashboardData,
    refetch: refetchDashboard,
    isLoading,
    isStale,
  } = useQuery<DashboardData>({
    queryKey: ["dashboard-all-data"],
    queryFn: async () => {
      const start = performance.now();
      const timestamp = Date.now();
      const res = await fetch(`/api/dashboard/all?_=${timestamp}`, { 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const data = await res.json();
      console.log(`📊 Dashboard data fetched in ${(performance.now() - start).toFixed(0)}ms`);
      return data;
    },
    staleTime: 0, // ✅ Always fetch fresh data
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: autoRefreshEnabled ? 30000 : false, // ✅ Auto-refresh every 30 seconds
    enabled: !!session && !isAdmin,
  });

  // ✅ Fetch player entry with auto-refresh
  const { data: entryData, refetch: refetchEntry } = useQuery<PlayerEntry | null>({
    queryKey: ["player-entry"],
    queryFn: async () => {
      if (isAdmin) return null;
      const timestamp = Date.now();
      const res = await fetch(`/api/competition/player-entry?_=${timestamp}`, { 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) throw new Error("Failed to fetch player entry");
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: autoRefreshEnabled ? 30000 : false,
    enabled: !!session && !isAdmin,
  });

  // ✅ Listen for stale data and auto-refresh
  useEffect(() => {
    if (isStale && !isLoading) {
      console.log('🔄 Data is stale, auto-refreshing...');
      refetchDashboard();
    }
  }, [isStale, isLoading, refetchDashboard]);

  // Check if payment is needed
  useEffect(() => {
    if (entryData?.hasEntry && entryData?.paymentRequired && !entryData?.hasPaid) {
      setShowPaymentModal(true);
    }
  }, [entryData]);

  // Set player entry and loading
  useEffect(() => {
    if (entryData !== undefined) setPlayerEntry(entryData);
    if (isAdmin || entryData !== undefined) setLoading(false);
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
  const handleRefresh = useCallback(async () => {
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
  }, [refetchDashboard, refetchEntry, queryClient]);

  // ✅ Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
    toast.success(autoRefreshEnabled ? "⏸️ Auto-refresh paused" : "▶️ Auto-refresh resumed");
  }, [autoRefreshEnabled]);

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
      return Math.max(5, Math.round(((dashboardData.totalPlayers - dashboardData.currentRank + 1) / dashboardData.totalPlayers) * 100));
    }
    return 0;
  }, [dashboardData?.currentRank, dashboardData?.totalPlayers]);

  const shouldShowPrize = !isAdmin && playerEntry?.hasEntry && playerEntry?.paymentRequired && playerEntry?.hasPaid;

  const recentForm = useMemo(() => dashboardData?.recentForm || ["W", "D", "L", "W", "D"], [dashboardData?.recentForm]);

  const nextOpponentId = dashboardData?.nextFixture?.opponentId || null;
  const nextOpponentName = dashboardData?.nextFixture?.opponent || null;

  // ✅ If admin, redirect
  if (isAdmin) return null;

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
            <Skeleton variant="card" className="h-[280px] rounded-2xl" />
            <Skeleton variant="card" className="h-[280px] rounded-2xl" />
            <Skeleton variant="card" className="h-[280px] rounded-2xl" />
            <Skeleton variant="card" className="h-[280px] rounded-2xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="mx-auto max-w-7xl space-y-5 px-3 pb-20 pt-4 sm:space-y-6 sm:px-6 lg:px-8">
        {/* ===================================================================== */}
        {/* 1. Welcome Banner - NO animations                                    */}
        {/* ===================================================================== */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/20 p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">
                  {`${greeting}, ${session?.user?.name || "Player"}! 👋`}
                </h1>
                <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold tracking-wide text-indigo-300 shadow-sm sm:text-[10px]">
                  NEXUS PLAYER
                </span>
                {playerEntry?.hasPaid && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-300 shadow-sm sm:text-[10px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    ACTIVE
                  </span>
                )}
                {/* ✅ Auto-refresh indicator */}
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide shadow-sm sm:text-[10px] ${
                  autoRefreshEnabled 
                    ? 'border-green-400/30 bg-green-500/20 text-green-300' 
                    : 'border-gray-400/30 bg-gray-500/20 text-gray-300'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${autoRefreshEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  {autoRefreshEnabled ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-300 sm:text-sm">
                {playerEntry?.hasPaid
                  ? "Ready for battle! Review your fixtures and track your competitive streak."
                  : "Complete your season entry to activate official league matches!"}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <TrustBadge type="last-active" />
                {playerEntry?.hasPaid && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-emerald-400 ring-1 ring-white/10">
                    <Shield className="h-3 w-3 text-emerald-400" />
                    Verified Athlete
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ Auto-refresh toggle */}
              <button
                onClick={toggleAutoRefresh}
                className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:min-h-[44px] sm:px-4 sm:text-sm ${
                  autoRefreshEnabled
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-gray-500/30 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="hidden sm:inline">{autoRefreshEnabled ? 'Live' : 'Paused'}</span>
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-150 hover:border-white/30 hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 sm:min-h-[44px] sm:px-4 sm:text-sm"
              >
                <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

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
        )}

        {/* Prize Display */}
        {shouldShowPrize && (
          <PrizeDisplay compact={true} />
        )}

        {/* ===================================================================== */}
        {/* 2. Stats Grid (4 cols) - NO animations                               */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 items-stretch">
          {stats.map((stat) => (
            <StatCard key={stat.name} stat={stat} />
          ))}
        </div>

        {/* ===================================================================== */}
        {/* 3. Goal Stats (3 cols) - NO animations                               */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 items-stretch">
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
        </div>

        {/* ===================================================================== */}
        {/* 4 & 5. Unified 2x2 Grid - NO animations                              */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Top Left: Next Fixture */}
          <div className="group relative flex min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.16]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-3.5 sm:p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-500/30">
                  <Calendar className="h-3.5 w-3.5 text-blue-400 sm:h-4 sm:w-4" />
                </div>
                Next Fixture
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                <Clock className="h-3 w-3 text-blue-400" />
                Upcoming
              </span>
            </div>
            <NextFixtureDisplay fixture={dashboardData?.nextFixture} />
          </div>

          {/* Top Right: Recent Result */}
          <div className="group relative flex min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.16]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-3.5 sm:p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 sm:h-4 sm:w-4" />
                </div>
                Recent Result
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                <Trophy className="h-3 w-3 text-emerald-400" />
                Latest Match
              </span>
            </div>
            <RecentResultDisplay result={dashboardData?.recentResult} />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 6. Recent Results Table + Activity Feed (2 cols) - NO animations     */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Bottom Left: Recent Results */}
          <div className="group relative flex min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.16]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-3.5 sm:p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 ring-1 ring-purple-500/30">
                  <Activity className="h-3.5 w-3.5 text-purple-400 sm:h-4 sm:w-4" />
                </div>
                Recent Results
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                <BarChart3 className="h-3 w-3 text-purple-400" />
                Form Guide
              </span>
            </div>

            <div className="flex flex-1 flex-col p-3.5 sm:p-4">
              {/* Form Guide Pills Row */}
              <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-2 sm:p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Form Guide</span>
                <FormGuide form={recentForm} />
              </div>

              {/* Static Results List - No Virtualization on mobile */}
              <div className="flex-1 space-y-2">
                {dashboardData?.recentResult ? (
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 font-mono text-[10px] font-bold text-indigo-300 ring-1 ring-indigo-500/30">
                        #1
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">vs {dashboardData.recentResult.opponent}</p>
                        <p className="text-[10px] text-gray-400">Official League Match</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{dashboardData.recentResult.score}</span>
                      <FormBadge result={dashboardData.recentResult.result} />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[100px] flex-col items-center justify-center text-center">
                    <Trophy className="h-6 w-6 text-gray-600" />
                    <p className="mt-1 text-xs text-gray-400">No recent results</p>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-white/[0.06] pt-2.5 text-center">
                <Link
                  href="/dashboard/statistics"
                  className="group/link inline-flex min-h-[36px] items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 transition-colors hover:text-purple-300"
                >
                  View Full Match Logs
                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Right: Recent Activity */}
          <div className="group relative flex min-h-[280px] h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.16]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-3.5 sm:p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 ring-1 ring-pink-500/30">
                  <Activity className="h-3.5 w-3.5 text-pink-400 sm:h-4 sm:w-4" />
                </div>
                Recent Activity
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                <Sparkles className="h-3 w-3 text-pink-400" />
                Live Feed
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 flex flex-col justify-stretch [&>*]:flex-1">
              <ActivityFeed />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 7. Live Match Clock & Interactive Widgets - NO animations            */}
        {/* ===================================================================== */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
            <Zap className="h-4 w-4 text-indigo-400 sm:h-5 sm:w-5" />
            <h2 className="text-base font-black tracking-tight text-white sm:text-lg">
              Live Match Clock &amp; Widgets
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-stretch">
            {/* Left Hub Column */}
            <div className="space-y-5 flex flex-col justify-between">
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
            <div className="space-y-5 flex flex-col justify-between">
              <TrustScoreMeter />
              <AchievementBadges />
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 8. League Standings Spotlight - NO animations                        */}
        {/* ===================================================================== */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.18]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] p-3.5 sm:p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30">
                <Trophy className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
              </div>
              League Standings
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
              <Users className="h-3 w-3 text-amber-400" />
              Live Table
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 shadow-xl shadow-orange-950/50 ring-2 ring-white/20 sm:h-16 sm:w-16">
                  <Crown className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 sm:text-xs">
                    Current Placement
                  </p>
                  <p className="mt-0.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    #{dashboardData?.currentRank || "-"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-gray-400 sm:text-xs">
                    Among <span className="font-semibold text-white">{dashboardData?.totalPlayers ?? 0}</span> players
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/standings"
                className="group/link inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all duration-150 hover:border-indigo-500/50 hover:bg-indigo-600/20 sm:w-auto"
              >
                Explore Full Table
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/link:translate-x-1" />
              </Link>
            </div>

            {/* Percentile Progress Bar - NO animation on mobile */}
            {dashboardData?.currentRank && dashboardData?.totalPlayers ? (
              <div className="mt-4 sm:mt-5">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Bottom Tier</span>
                  <span className="text-amber-400">{rankProgress}% Percentile</span>
                  <span>Top</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08] p-0.5 ring-1 ring-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 shadow-sm transition-all duration-300"
                    style={{ width: `${rankProgress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Quick Stat Pills */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10">
                <p className="text-base font-black text-emerald-400 sm:text-lg">{dashboardData?.wins ?? 0}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Wins</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10">
                <p className="text-base font-black text-amber-400 sm:text-lg">{dashboardData?.draws ?? 0}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Draws</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10">
                <p className="text-base font-black text-rose-400 sm:text-lg">{dashboardData?.losses ?? 0}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Losses</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 9. Quick Actions (4 cols) - NO animations                            */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 items-stretch">
          <Link
            href="/dashboard/fixtures"
            className="group relative flex min-h-[72px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 shadow-lg backdrop-blur-xl transition-all duration-150 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)] sm:min-h-[80px] sm:p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-500/30 transition-transform duration-150 group-hover:scale-105 sm:h-10 sm:w-10">
              <Calendar className="h-4 w-4 text-blue-400 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-2 sm:text-xs">
              Fixtures
            </span>
          </Link>

          <Link
            href="/dashboard/standings"
            className="group relative flex min-h-[72px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 shadow-lg backdrop-blur-xl transition-all duration-150 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)] sm:min-h-[80px] sm:p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30 transition-transform duration-150 group-hover:scale-105 sm:h-10 sm:w-10">
              <Trophy className="h-4 w-4 text-amber-400 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-2 sm:text-xs">
              Standings
            </span>
          </Link>

          <Link
            href="/dashboard/statistics"
            className="group relative flex min-h-[72px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 shadow-lg backdrop-blur-xl transition-all duration-150 hover:-translate-y-1 hover:border-purple-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(168,85,247,0.2)] sm:min-h-[80px] sm:p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-500/30 transition-transform duration-150 group-hover:scale-105 sm:h-10 sm:w-10">
              <BarChart3 className="h-4 w-4 text-purple-400 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-2 sm:text-xs">
              Statistics
            </span>
          </Link>

          <Link
            href="/dashboard/community"
            className="group relative flex min-h-[72px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 shadow-lg backdrop-blur-xl transition-all duration-150 hover:-translate-y-1 hover:border-pink-500/50 hover:bg-white/[0.09] hover:shadow-[0_8px_24px_rgba(236,72,153,0.2)] sm:min-h-[80px] sm:p-4"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/20 ring-1 ring-pink-500/30 transition-transform duration-150 group-hover:scale-105 sm:h-10 sm:w-10">
              <MessageCircle className="h-4 w-4 text-pink-400 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold tracking-wide text-gray-200 group-hover:text-white sm:mt-2 sm:text-xs">
              Community
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}