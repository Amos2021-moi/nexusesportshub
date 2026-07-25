"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Trophy,
  Calendar,
  Award,
  Eye,
  Server,
  HardDrive,
  Users as UsersIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Gauge,
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  ShieldOff,
  Moon,
  Percent,
  Timer,
  Newspaper,
  Database,
  Settings as SettingsIcon,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  DollarSign,
  BarChart3,
  PieChart,
  TrendingDown,
  Shield,
  UserPlus,
  MessageCircle,
  Flag,
  Crown,
  Star,
  Medal,
  Wallet,
  CreditCard,
  Upload,
  Download,
  Filter,
  Search,
  Bell,
  BellRing,
  Info,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  PlayCircle,
  StopCircle,
  Calendar as CalendarIcon,
  MapPin,
  Gift,
  Coins,
  Gem,
  Flame,
  Layers,
  Grid,
  List,
  Maximize2,
  Minimize2,
  Terminal,
  Cpu,
  Radio,
  Sliders,
  Check,
  X,
  ExternalLink,
  Command,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useInView } from "react-intersection-observer";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface OverviewStats {
  stats: {
    totalPlayers: number;
    activePlayers: number;
    totalFixtures: number;
    completedResults: number;
    pendingResults: number;
    totalTournaments: number;
    activeTournaments: number;
    totalSeasons: number;
    activeSeasons: number;
    totalSquads: number;
    totalRevenue: number;
    pendingPayments: number;
    totalAwards: number;
    totalReports: number;
    pendingReports: number;
    totalNews: number;
    totalResults: number;
    completionRate: number;
    engagementRate: number;
    pendingRate: number;
  };
  growth: {
    newPlayers: number;
    newResults: number;
    playerGrowthRate: number;
    resultGrowthRate: number;
  };
  system: {
    queryTime: number;
    cachedAt: string;
  };
}

interface RevenueData {
  summary: {
    totalRevenue: number;
    paidEntries: number;
    pendingEntries: number;
    totalSeasonEntries: number;
    completionRate: number;
    averagePerEntry: number;
  };
  revenueBySeason: Array<{ name: string; total: number; paid: number; pending: number }>;
  monthlyRevenue: Array<{ month: string; year: number; revenue: number; count: number }>;
  recentPayments: Array<{ id: string; amount: number; user: string; email: string; season: string; date: string }>;
}

interface EngagementData {
  active: { today: number; week: number; month: number };
  new: { today: number; week: number; month: number };
  totalPlayers: number;
  matchParticipation: number;
  engagementRate: number;
  participationRate: number;
  totalMatches: number;
  dailyActivity: Array<{ date: string; activePlayers: number }>;
}

interface TournamentHealthData {
  summary: {
    totalTournaments: number;
    activeTournaments: number;
    pendingTournaments: number;
    completedTournaments: number;
    totalMatches: number;
    completedMatches: number;
    completionRate: number;
    healthStatus: string;
  };
  typeBreakdown: Record<string, number>;
  recentTournaments: Array<{ id: string; name: string; status: string; type: string; startDate: string; endDate: string; participants: number }>;
}

interface AlertData {
  alerts: Array<{
    id: string;
    type: "critical" | "warning" | "info";
    title: string;
    message: string;
    action: string;
    actionLabel: string;
    timestamp: string;
    priority: "high" | "medium" | "low";
  }>;
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    hasCritical: boolean;
    hasWarning: boolean;
  };
}

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  user: string;
  time: string;
  type: string;
  icon: string;
}

interface TopContributor {
  id: string;
  name: string;
  username: string;
  wins: number;
  rank: number;
  title: string;
}

interface SquadData {
  total: number;
  active: number;
  verified: number;
  avgMembers: number;
}

interface BackupStatus {
  lastBackup: string;
  size: string;
  status: string;
}

interface VerificationItem {
  id: string;
  name: string;
  username: string;
  submittedAt: string;
  status: string;
}

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
/*                           STATIC Background                               */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(({ theme = "indigo" }: { theme?: string }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#070913]" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070913]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070913] via-[#0b0e1d] to-[#12102a]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className={`absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full blur-[140px] ${
        theme === "neon" ? "bg-emerald-600/20" : theme === "gold" ? "bg-amber-500/20" : "bg-indigo-600/20"
      }`} />
      <div className={`absolute -right-48 top-1/4 h-[500px] w-[500px] rounded-full blur-[140px] ${
        theme === "neon" ? "bg-cyan-600/15" : theme === "gold" ? "bg-orange-600/15" : "bg-purple-600/15"
      }`} />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Stats Card                               */
/* -------------------------------------------------------------------------- */

interface StatsCardProps {
  stat: {
    name: string;
    value: number;
    icon: React.ElementType;
    color: string;
    href: string;
    subtitle: string;
    trend?: { value: number; isPositive: boolean };
  };
}

const StatsCard = memo(({ stat }: StatsCardProps) => {
  const Icon = stat.icon;
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:border-indigo-500/40 hover:bg-white/[0.08] hover:shadow-2xl";

  return (
    <Link href={stat.href} className="block h-full">
      <div className={`relative flex h-full min-h-[120px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-xl backdrop-blur-xl transition-all duration-150 ${hoverClass} sm:p-5`}>
        <div
          className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-r ${stat.color} opacity-15 blur-3xl transition-opacity duration-300 group-hover:opacity-30`}
        />

        <div className="relative flex items-center justify-between gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-black/30 ring-1 ring-white/20 transition-transform duration-150 group-hover:scale-105 sm:h-11 sm:w-11`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          {stat.trend && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                stat.trend.isPositive
                  ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                  : "border border-red-500/30 bg-red-500/15 text-red-400"
              }`}
            >
              {stat.trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(stat.trend.value)}%
            </span>
          )}
        </div>

        <div className="relative mt-3">
          <p className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {stat.value.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center justify-between border-t border-white/[0.05] pt-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.name}</p>
            <span className="text-[9px] font-medium text-gray-500">{stat.subtitle}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

StatsCard.displayName = "StatsCard";

/* -------------------------------------------------------------------------- */
/*                           STATIC Quick Action                             */
/* -------------------------------------------------------------------------- */

interface QuickActionProps {
  action: {
    href: string;
    label: string;
    icon: React.ElementType;
    color: string;
    badge?: number;
  };
}

const QuickAction = memo(({ action }: QuickActionProps) => {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className={`group relative flex min-h-[60px] flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-3 text-center shadow-lg transition-all duration-150 hover:shadow-xl sm:min-h-[68px] sm:p-3.5`}
    >
      <div className="absolute inset-0 bg-black/10 transition-colors duration-150 group-hover:bg-transparent" />
      <div className="relative flex flex-col items-center">
        <Icon className="mb-1 h-4 w-4 text-white/95 transition-transform duration-150 group-hover:scale-105 sm:h-5 sm:w-5" />
        <span className="text-[10px] font-bold tracking-wide text-white/95 sm:text-xs">{action.label}</span>
        {action.badge !== undefined && action.badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-red-600 text-[8px] font-black text-white shadow-lg shadow-red-600/40">
            {action.badge > 9 ? "9+" : action.badge}
          </span>
        )}
      </div>
    </Link>
  );
});

QuickAction.displayName = "QuickAction";

/* -------------------------------------------------------------------------- */
/*                           STATIC Activity List                            */
/* -------------------------------------------------------------------------- */

interface ActivityListProps {
  activities: ActivityItem[];
}

const ActivityList = memo(({ activities }: ActivityListProps) => {
  const isMobile = useIsMobile();
  
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Invalid Date";
    }
  };

  const displayActivities = isMobile ? activities.slice(0, 5) : activities;

  if (activities.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center text-center">
        <Activity className="h-8 w-8 text-gray-600" />
        <p className="mt-2 text-sm font-bold text-white">No activity logged</p>
        <p className="text-xs text-gray-400">Events will populate automatically</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {displayActivities.map((activity, index) => (
        <div key={activity.id || index} className="px-1 py-1">
          <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-all duration-150 hover:border-indigo-500/30 hover:bg-white/[0.06]">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 ring-1 ring-white/10">
              {activity.type === "user" ? (
                <Users className="h-3.5 w-3.5 text-blue-400" />
              ) : activity.type === "match" ? (
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
              ) : activity.type === "payment" ? (
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Activity className="h-3.5 w-3.5 text-purple-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{activity.action}</p>
              <p className="mt-0.5 truncate text-[10px] text-gray-300">{activity.description}</p>
              <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                by <span className="font-semibold text-gray-200">{activity.user || "System"}</span>
              </p>
            </div>
            <span className="flex-shrink-0 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-400 ring-1 ring-white/10">
              {formatTime(activity.time)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});

ActivityList.displayName = "ActivityList";

/* -------------------------------------------------------------------------- */
/*                           STATIC Charts                                   */
/* -------------------------------------------------------------------------- */

const RevenueChart = memo(({ data, tab }: { data: any; tab: string }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const isMobile = useIsMobile();

  if (!inView) {
    return <div ref={ref} className="h-24 w-full animate-pulse rounded-lg bg-white/5" />;
  }

  const chartData = tab === "season" ? data?.revenueBySeason : data?.monthlyRevenue;
  if (!chartData?.length) {
    return (
      <div ref={ref} className="flex h-20 items-center justify-center text-center">
        <p className="text-xs text-gray-400">No revenue data available</p>
      </div>
    );
  }

  const max = Math.max(...chartData.map((item: any) => item.total || item.revenue || 0), 1);
  const displayCount = isMobile ? Math.min(4, chartData.length) : Math.min(6, chartData.length);
  const dataSlice = chartData.slice(0, displayCount);

  return (
    <div ref={ref} className="flex items-end gap-2 h-20 pt-2">
      {dataSlice.map((item: any, i: number) => {
        const value = item.total || item.revenue || 0;
        const height = Math.max(12, Math.round((value / max) * 60));
        const label = item.name || item.month || `Item ${i + 1}`;
        const color = tab === "season" 
          ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400"
          : "bg-gradient-to-t from-teal-600 via-cyan-500 to-blue-400";
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-mono text-[9px] font-bold text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
              {(value / 1000).toFixed(0)}k
            </span>
            <div
              className={`w-full rounded-t-lg ${color} shadow-md transition-all duration-150`}
              style={{ height: `${height}px` }}
            />
            <p className="w-full truncate text-center text-[9px] font-bold text-gray-400">
              {label.substring(0, 6)}
            </p>
          </div>
        );
      })}
    </div>
  );
});

RevenueChart.displayName = "RevenueChart";

const EngagementChart = memo(({ data }: { data: any }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const isMobile = useIsMobile();

  if (!inView) {
    return <div ref={ref} className="h-20 w-full animate-pulse rounded-lg bg-white/5" />;
  }

  if (!data?.dailyActivity?.length) {
    return (
      <div ref={ref} className="flex h-20 items-center justify-center text-center">
        <p className="text-xs text-gray-400">No activity data available</p>
      </div>
    );
  }

  const max = Math.max(...data.dailyActivity.map((d: any) => d.activePlayers), 1);
  const displayCount = isMobile ? Math.min(5, data.dailyActivity.length) : Math.min(7, data.dailyActivity.length);
  const dataSlice = data.dailyActivity.slice(-displayCount);

  return (
    <div ref={ref} className="flex items-end gap-2 h-20 pt-2">
      {dataSlice.map((day: any, i: number) => {
        const height = Math.max(12, Math.round((day.activePlayers / max) * 60));
        const isMax = day.activePlayers === max;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="font-mono text-[9px] font-bold text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
              {day.activePlayers}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all duration-150 ${
                isMax
                  ? "bg-gradient-to-t from-pink-600 via-purple-500 to-indigo-400 shadow-lg shadow-purple-500/30"
                  : "bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-400 shadow-md"
              }`}
              style={{ height: `${height}px` }}
            />
            <p className="w-full truncate text-center text-[8px] font-bold text-gray-400">
              {day.date.split(" ")[0] || `D${i + 1}`}
            </p>
          </div>
        );
      })}
    </div>
  );
});

EngagementChart.displayName = "EngagementChart";

/* -------------------------------------------------------------------------- */
/*                     Lazy Loaded Section Wrapper                            */
/* -------------------------------------------------------------------------- */

function LazySection({ children, height = 200 }: { children: React.ReactNode; height?: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <div ref={ref} className="w-full">
      {inView ? children : <div className={`h-${height} animate-pulse rounded-2xl bg-white/5`} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [refreshing, setRefreshing] = useState(false);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "season">("7d");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [themeMode, setThemeMode] = useState<"indigo" | "neon" | "gold">("indigo");
  const [alertFilter, setAlertFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [revenueTab, setRevenueTab] = useState<"season" | "monthly">("season");

  // ✅ React Query for Overview - Live data with auto-refresh
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<OverviewStats>({
    queryKey: ["admin-overview", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/overview?range=${timeRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Revenue Data
  const { data: revenue, refetch: refetchRevenue } = useQuery<RevenueData>({
    queryKey: ["admin-revenue", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/revenue?range=${timeRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch revenue");
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Engagement Data
  const { data: engagement, refetch: refetchEngagement } = useQuery<EngagementData>({
    queryKey: ["admin-engagement", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/engagement?range=${timeRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch engagement");
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Tournament Health
  const { data: tournamentHealth, refetch: refetchTournament } = useQuery<TournamentHealthData>({
    queryKey: ["admin-tournament-health", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tournament-health?range=${timeRange}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tournament health");
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery<AlertData>({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/alerts`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 15000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Recent Activity
  const { data: recentActivity = [], refetch: refetchActivity } = useQuery<ActivityItem[]>({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/recent-activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 100) : [];
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Top Contributors
  const { data: topContributors = [] } = useQuery<TopContributor[]>({
    queryKey: ["admin-top-contributors"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/top-contributors`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Squad Data
  const { data: squadData } = useQuery<SquadData>({
    queryKey: ["admin-squad-overview"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/squad-overview`, { credentials: "include" });
      if (!res.ok) return { total: 0, active: 0, verified: 0, avgMembers: 0 };
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Backup Status
  const { data: backupStatus } = useQuery<BackupStatus>({
    queryKey: ["admin-backup-status"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/backup-status`, { credentials: "include" });
      if (!res.ok) return { lastBackup: "", size: "0 MB", status: "unknown" };
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // ✅ Verification Queue
  const { data: verificationQueue = [] } = useQuery<VerificationItem[]>({
    queryKey: ["admin-verification-queue"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/verification-queue`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!session,
  });

  // Update lastUpdated when data changes
  useEffect(() => {
    if (overview || revenue || engagement) {
      setLastUpdated(new Date());
    }
  }, [overview, revenue, engagement]);

  // ✅ Manual Refresh (existing)
  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchOverview(),
        refetchRevenue(),
        refetchEngagement(),
        refetchTournament(),
        refetchAlerts(),
        refetchActivity(),
      ]);
      setLastUpdated(new Date());
      toast.success("✅ Dashboard refreshed");
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast.error("Failed to refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  }, [refetchOverview, refetchRevenue, refetchEngagement, refetchTournament, refetchAlerts, refetchActivity]);

  // ✅ FORCE REFRESH - Invalidates ALL queries and refetches everything
  const handleForceRefresh = useCallback(async () => {
    setIsForceRefreshing(true);
    toast.loading("🔄 Refreshing all data...", { duration: 0 });
    
    try {
      // ✅ Invalidate ALL queries in the cache
      await queryClient.invalidateQueries();
      
      // ✅ Refetch ALL active queries
      await queryClient.refetchQueries({
        type: 'active',
        exact: false,
      });
      
      // ✅ Also refetch inactive queries to ensure everything is fresh
      await queryClient.refetchQueries({
        type: 'inactive',
        exact: false,
      });
      
      setLastUpdated(new Date());
      toast.dismiss();
      toast.success("✅ All data refreshed successfully!");
    } catch (error) {
      console.error("Error during force refresh:", error);
      toast.dismiss();
      toast.error("Failed to refresh some data. Please try again.");
    } finally {
      setIsForceRefreshing(false);
    }
  }, [queryClient]);

  // Computed stats
  const statsData = useMemo(() => {
    if (!overview) return [];
    return [
      {
        name: "Total Athletes",
        value: overview.stats.totalPlayers,
        icon: Users,
        color: "from-blue-600 to-cyan-500",
        href: "/admin/players",
        subtitle: `${overview.stats.activePlayers || 0} active`,
        trend: { value: overview.growth.playerGrowthRate, isPositive: overview.growth.playerGrowthRate >= 0 },
      },
      {
        name: "Total Revenue",
        value: overview.stats.totalRevenue,
        icon: DollarSign,
        color: "from-emerald-600 to-teal-500",
        href: "/admin/payments",
        subtitle: `KES ${(revenue?.summary.averagePerEntry || 0).toLocaleString()} avg`,
        trend: { value: 12, isPositive: true },
      },
      {
        name: "Fixtures",
        value: overview.stats.totalFixtures,
        icon: Trophy,
        color: "from-amber-500 to-orange-600",
        href: "/admin/league",
        subtitle: `${overview.stats.completedResults} completed`,
        trend: { value: overview.growth.resultGrowthRate || 8, isPositive: true },
      },
      {
        name: "Active Seasons",
        value: overview.stats.activeSeasons,
        icon: Calendar,
        color: "from-purple-600 to-pink-500",
        href: "/admin/seasons",
        subtitle: `of ${overview.stats.totalSeasons} total`,
        trend: { value: 0, isPositive: true },
      },
      {
        name: "Pending Actions",
        value: overview.stats.pendingResults + overview.stats.pendingPayments,
        icon: Clock,
        color: "from-red-500 to-rose-600",
        href: "/admin/results",
        subtitle: `${overview.stats.pendingResults} results`,
        trend: { value: 5, isPositive: false },
      },
      {
        name: "Total Awards",
        value: overview.stats.totalAwards,
        icon: Award,
        color: "from-yellow-500 to-amber-600",
        href: "/admin/awards",
        subtitle: `${overview.stats.totalTournaments} tournaments`,
        trend: { value: 3, isPositive: true },
      },
    ];
  }, [overview, revenue]);

  const quickActions = useMemo(() => {
    const pendingResults = overview?.stats.pendingResults || 0;
    const pendingPayments = overview?.stats.pendingPayments || 0;

    const actions = [
      { href: "/admin/results", label: "Approve Results", icon: CheckCircle, color: "from-emerald-600 to-teal-600", badge: pendingResults },
      { href: "/admin/payments", label: "Verify Payments", icon: Wallet, color: "from-blue-600 to-cyan-600", badge: pendingPayments },
      { href: "/admin/seasons/create", label: "New Season", icon: Calendar, color: "from-purple-600 to-pink-600" },
      { href: "/admin/fixtures/generate", label: "Generate Fixtures", icon: Zap, color: "from-amber-500 to-orange-600" },
      { href: "/admin/tournaments/create", label: "Create Tournament", icon: Trophy, color: "from-indigo-600 to-purple-600" },
      { href: "/admin/players", label: "Manage Players", icon: Users, color: "from-teal-600 to-cyan-600" },
      { href: "/admin/communication", label: "Send Broadcast", icon: MessageCircle, color: "from-rose-600 to-pink-600" },
      { href: "/admin/settings/backup", label: "Backup Now", icon: Database, color: "from-slate-600 to-gray-700" },
    ];

    return isMobile ? actions.slice(0, 4) : actions;
  }, [overview, isMobile]);

  const systemStatusItems = useMemo(
    () => [
      {
        title: "Database Core",
        status: "connected",
        icon: Database,
        statusColor: "text-emerald-400",
        details: [{ label: "Latency", value: `${overview?.system.queryTime || 12}ms` }],
      },
      {
        title: "API Gateway",
        status: "healthy",
        icon: Server,
        statusColor: "text-emerald-400",
        details: [{ label: "Uptime", value: "99.99%" }],
      },
      {
        title: "Cache Layer",
        status: "healthy",
        icon: Gauge,
        statusColor: "text-emerald-400",
        details: [{ label: "Hit Rate", value: "94.2%" }],
      },
      {
        title: "Platform Users",
        status: "online",
        icon: UsersIcon,
        statusColor: "text-blue-400",
        details: [
          { label: "Total", value: `${overview?.stats.totalPlayers || 0}` },
          { label: "Active", value: `${overview?.stats.activePlayers || 0}` },
        ],
      },
    ],
    [overview]
  );

  const alertCounts = useMemo(
    () => ({
      total: alerts?.summary.total || 0,
      critical: alerts?.summary.critical || 0,
      warning: alerts?.summary.warning || 0,
      info: alerts?.summary.info || 0,
    }),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (!alerts?.alerts) return [];
    return alertFilter === "all" ? alerts.alerts : alerts.alerts.filter((a) => a.type === alertFilter);
  }, [alerts, alertFilter]);

  const formatBackupTime = (timeStr: string) => {
    if (!timeStr) return "Never";
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${Math.floor(diffHours / 24)} days ago`;
    } catch {
      return timeStr;
    }
  };

  // Show loading only once
  if (overviewLoading) {
    return (
      <>
        <DecorBackground theme={themeMode} />
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="h-8 w-72 rounded-lg bg-white/10" />
              <div className="mt-3 h-4 w-52 rounded bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground theme={themeMode} />

      <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">

          {/* 1. HEADER */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/80 p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-6">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-xl shadow-indigo-950/60 ring-2 ring-white/20 sm:h-14 sm:w-14">
                  <Zap className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">
                      Nexus Admin Hub
                    </h1>
                    <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-indigo-300 shadow-sm">
                      v3.0
                    </span>
                    {alertCounts.critical > 0 && (
                      <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-300 shadow-sm">
                        <AlertOctagon className="h-3 w-3 text-red-400" />
                        {alertCounts.critical} Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-300 sm:text-sm">
                    Welcome back, {session?.user?.name || "Admin"}! Live telemetry &amp; match operations.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-bold tracking-wide text-emerald-300">Live</span>
                </div>

                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-medium text-gray-300 backdrop-blur-md">
                  {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>

                {/* ✅ FORCE REFRESH BUTTON */}
                <button
                  onClick={handleForceRefresh}
                  disabled={isForceRefreshing}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 px-4 py-1.5 text-sm font-bold text-indigo-300 shadow-lg backdrop-blur-md transition-all duration-150 hover:bg-indigo-500/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isForceRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">
                    {isForceRefreshing ? "Refreshing..." : "🔄 Refresh All"}
                  </span>
                  <span className="sm:hidden">
                    <RefreshCw className={`h-4 w-4 ${isForceRefreshing ? "animate-spin" : ""}`} />
                  </span>
                </button>

                {/* ✅ Existing Sync Button */}
                <button
                  onClick={fetchAllData}
                  disabled={refreshing}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] px-3 py-1.5 text-sm font-bold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-150 hover:border-white/30 hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
                  <span className="hidden sm:inline ml-1.5 text-xs">Sync</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
              <div className="flex items-center gap-1 rounded-xl bg-black/40 p-0.5 ring-1 ring-white/10">
                {(["24h", "7d", "30d", "season"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-lg px-2.5 py-1 font-bold uppercase transition-colors min-h-[32px] ${
                      timeRange === range
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {range === "season" ? "Season" : range}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 rounded-xl bg-black/40 p-0.5 ring-1 ring-white/10">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-1.5 transition-colors min-h-[32px] min-w-[32px] ${
                      viewMode === "grid" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    className={`rounded-lg p-1.5 transition-colors min-h-[32px] min-w-[32px] ${
                      viewMode === "compact" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <select
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as any)}
                  className="rounded-xl bg-black/40 px-2.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/10 focus:outline-none cursor-pointer min-h-[32px]"
                >
                  <option value="indigo">Indigo</option>
                  <option value="neon">Neon</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. STATS GRID */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 items-stretch">
            {statsData.map((stat) => (
              <StatsCard key={stat.name} stat={stat} />
            ))}
          </div>

          {/* 3. QUICK ACTIONS | SYSTEM STATUS | ALERT CENTER */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Quick Actions */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Quick Actions</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                    {quickActions.length}
                  </span>
                </div>

                <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2"} gap-2 flex-1`}>
                  {quickActions.map((action) => (
                    <QuickAction key={action.label} action={action} />
                  ))}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/30">
                      <Server className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <h2 className="text-sm font-bold text-white">System Status</h2>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                    {overview?.system.queryTime || 12}ms
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 flex-1">
                  {systemStatusItems.map((item) => (
                    <div key={item.title} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition-all duration-150 hover:border-indigo-500/30 hover:bg-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-3.5 w-3.5 ${item.statusColor}`} />
                        <span className="text-xs font-bold text-gray-300">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.details?.map((d, i) => (
                          <span key={i} className="text-[10px] font-medium text-white">
                            {d.value}
                          </span>
                        ))}
                        <span className={`text-[10px] font-bold ${
                          item.status === "connected" || item.status === "healthy" || item.status === "online"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}>
                          ●
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alert Center */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 ring-1 ring-red-500/30">
                        <BellRing className="h-3.5 w-3.5 text-red-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Alerts</h2>
                    </div>
                    {alertCounts.total > 0 && (
                      <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        {alertCounts.total}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {(["all", "critical", "warning", "info"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAlertFilter(filter)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase transition-colors min-h-[28px] ${
                          alertFilter === filter
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {filter} {filter === "critical" && `(${alertCounts.critical})`}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1.5">
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.slice(0, isMobile ? 3 : 4).map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 transition-all duration-150 ${
                            alert.type === "critical"
                              ? "border-rose-500/30 bg-rose-500/10"
                              : alert.type === "warning"
                              ? "border-amber-500/30 bg-amber-500/10"
                              : "border-blue-500/30 bg-blue-500/10"
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {alert.type === "critical" ? (
                              <AlertOctagon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose-400" />
                            ) : alert.type === "warning" ? (
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                            ) : (
                              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-bold text-white">{alert.title}</p>
                              <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-300">{alert.message}</p>
                            </div>
                          </div>
                          <Link
                            href={alert.action || "/admin"}
                            className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-indigo-300 transition-colors hover:bg-indigo-600 hover:text-white"
                          >
                            Fix
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-[120px] flex-col items-center justify-center text-center">
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                        <p className="mt-2 text-xs font-bold text-white">All Clear</p>
                        <p className="text-[10px] text-gray-400">No active alerts</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. REVENUE & ENGAGEMENT */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-stretch">
            {/* Revenue */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Revenue</h2>
                        <p className="text-[10px] text-gray-400">Entry fees &amp; cash flows</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl bg-black/40 p-0.5 ring-1 ring-white/10 text-xs">
                      <button
                        onClick={() => setRevenueTab("season")}
                        className={`rounded-lg px-2 py-0.5 font-bold transition-colors min-h-[28px] ${
                          revenueTab === "season" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Season
                      </button>
                      <button
                        onClick={() => setRevenueTab("monthly")}
                        className={`rounded-lg px-2 py-0.5 font-bold transition-colors min-h-[28px] ${
                          revenueTab === "monthly" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </div>

                  <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-2`}>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-white">KES {(revenue?.summary.totalRevenue || 0).toLocaleString()}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Total</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-emerald-400">{(revenue?.summary.paidEntries || 0)}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Paid</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-amber-400">{(revenue?.summary.pendingEntries || 0)}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Pending</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-purple-400">KES {(revenue?.summary.averagePerEntry || 0).toLocaleString()}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Avg</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-300 mb-2">
                    <span>Distribution</span>
                    <span className="text-emerald-400">{revenue?.summary.completionRate || 0}% collected</span>
                  </div>
                  <RevenueChart data={revenue} tab={revenueTab} />
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-500/30">
                        <Users className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Engagement</h2>
                        <p className="text-[10px] text-gray-400">Active players</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                      {engagement?.engagementRate || 0}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-cyan-400">{(engagement?.active.today || 0)}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Today</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-indigo-400">{(engagement?.active.week || 0)}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">7-Day</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-purple-400">{(engagement?.active.month || 0)}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">30-Day</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-300 mb-2">
                    <span>{isMobile ? "5-Day Activity" : "7-Day Activity"}</span>
                    <span className="text-indigo-400">Daily peak</span>
                  </div>
                  <EngagementChart data={engagement} />
                </div>
              </div>
            </div>
          </div>

          {/* 5. TOURNAMENT | SEASON | UPCOMING */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
            {/* Tournament Health */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 ring-1 ring-orange-500/30">
                        <Trophy className="h-3.5 w-3.5 text-orange-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Tournaments</h2>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      tournamentHealth?.summary.healthStatus === "healthy"
                        ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/20 text-amber-300"
                    }`}>
                      {tournamentHealth?.summary.healthStatus || "Healthy"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-white">{tournamentHealth?.summary.activeTournaments || 0}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Active</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-emerald-400">{tournamentHealth?.summary.completionRate || 0}%</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Complete</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-amber-400">{tournamentHealth?.summary.pendingTournaments || 0}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Pending</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                      <p className="font-mono text-sm font-black text-purple-400">{tournamentHealth?.summary.totalTournaments || 0}</p>
                      <p className="text-[9px] font-bold uppercase text-gray-400">Total</p>
                    </div>
                  </div>
                </div>

                <Link href="/admin/tournaments" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider text-orange-300 transition-all hover:bg-orange-500/30 hover:text-white">
                  View Brackets
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Season Compare */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 ring-1 ring-cyan-500/30">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Seasons</h2>
                    </div>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      YoY
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Active</span>
                      <span className="font-mono text-xs font-black text-white">{overview?.stats.activeSeasons || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Total</span>
                      <span className="font-mono text-xs font-black text-white">{overview?.stats.totalSeasons || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Player Growth</span>
                      <span className="font-mono text-xs font-black text-emerald-400">+{overview?.growth.playerGrowthRate || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Match Growth</span>
                      <span className="font-mono text-xs font-black text-emerald-400">+{overview?.growth.resultGrowthRate || 0}%</span>
                    </div>
                  </div>
                </div>

                <Link href="/admin/seasons" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition-all hover:bg-cyan-500/30 hover:text-white">
                  Manage Seasons
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 ring-1 ring-pink-500/30">
                        <Clock className="h-3.5 w-3.5 text-pink-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Upcoming</h2>
                    </div>
                    <span className="rounded-full border border-pink-500/30 bg-pink-500/15 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                      3
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-400" />
                        <span className="text-[10px] font-bold text-white">Season Finale</span>
                      </div>
                      <span className="rounded-lg bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-black text-rose-300">12 days</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-bold text-white">Fixtures</span>
                      </div>
                      <span className="rounded-lg bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300">Tomorrow</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-400" />
                        <span className="text-[10px] font-bold text-white">Registrations</span>
                      </div>
                      <span className="rounded-lg bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-black text-blue-300">3 days</span>
                    </div>
                  </div>
                </div>

                <Link href="/admin/events" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 text-[10px] font-bold uppercase tracking-wider text-pink-300 transition-all hover:bg-pink-500/30 hover:text-white">
                  View Calendar
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 6. MODERATION | CONTRIBUTORS | SQUADS */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
            {/* Moderation */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 ring-1 ring-rose-500/30">
                        <Flag className="h-3.5 w-3.5 text-rose-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Moderation</h2>
                    </div>
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {overview?.stats.pendingReports || 0}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Pending Reports</span>
                      <span className="font-mono text-xs font-black text-rose-300">{overview?.stats.pendingReports || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Total Lifetime</span>
                      <span className="font-mono text-xs font-black text-white">{overview?.stats.totalReports || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">SLA</span>
                      <span className="font-mono text-xs font-black text-emerald-400">&lt; 2h</span>
                    </div>
                  </div>
                </div>

                <Link href="/admin/moderation" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600/20 to-pink-600/20 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider text-rose-300 transition-all hover:bg-rose-600/30 hover:text-white">
                  Review Queue
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/20 ring-1 ring-yellow-500/30">
                        <Crown className="h-3.5 w-3.5 text-yellow-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Top Players</h2>
                    </div>
                    <span className="rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                      Leaders
                    </span>
                  </div>

                  <div className="space-y-2">
                    {topContributors.length > 0 ? (
                      topContributors.slice(0, isMobile ? 2 : 3).map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[10px] font-black ring-1 ${
                              index === 0 ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30" :
                              index === 1 ? "bg-gray-400/20 text-gray-300 ring-gray-400/30" :
                              "bg-amber-600/20 text-amber-500 ring-amber-600/30"
                            }`}>
                              #{index + 1}
                            </span>
                            <div>
                              <p className="text-[10px] font-bold text-white">{player.name}</p>
                              <p className="text-[9px] text-gray-400">@{player.username}</p>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] font-extrabold text-emerald-400">{player.wins}W</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-[120px] flex-col items-center justify-center text-center">
                        <Trophy className="h-6 w-6 text-gray-600" />
                        <p className="mt-1 text-xs font-bold text-white">No data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Squads */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 ring-1 ring-teal-500/30">
                        <Shield className="h-3.5 w-3.5 text-teal-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Squads</h2>
                    </div>
                    <span className="rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                      {squadData?.total || overview?.stats.totalSquads || 0}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Total Squads</span>
                      <span className="font-mono text-xs font-black text-white">{squadData?.total || overview?.stats.totalSquads || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Verified</span>
                      <span className="font-mono text-xs font-black text-emerald-400">{squadData?.verified || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Avg Members</span>
                      <span className="font-mono text-xs font-black text-purple-400">{squadData?.avgMembers || 0}</span>
                    </div>
                  </div>
                </div>

                <Link href="/admin/squads" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider text-teal-300 transition-all hover:bg-teal-500/30 hover:text-white">
                  Manage Rosters
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 7. RECENT ACTIVITY | BACKUP | VERIFICATION */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-stretch">
            {/* Recent Activity - Simple List */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 ring-1 ring-purple-500/30">
                        <Activity className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Activity</h2>
                    </div>
                    <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                      Live
                    </span>
                  </div>

                  <ActivityList activities={recentActivity} />
                </div>
              </div>
            </div>

            {/* Backup Status */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-500/30">
                        <Database className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Backups</h2>
                    </div>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                      Auto
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Last Backup</span>
                      <span className="font-mono text-xs font-black text-emerald-400">
                        {backupStatus?.lastBackup ? formatBackupTime(backupStatus.lastBackup) : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Size</span>
                      <span className="font-mono text-xs font-black text-white">{backupStatus?.size || "0 MB"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                      <span className="text-[10px] font-semibold text-gray-300">Status</span>
                      <span className={`font-mono text-xs font-black ${backupStatus?.status === "success" ? "text-emerald-400" : "text-amber-400"}`}>
                        {backupStatus?.status === "success" ? "✅ Verified" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <Link href="/admin/settings/backup" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white">
                  <Database className="h-3 w-3" />
                  Manage Backups
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Verification Queue */}
            <div className="flex flex-col">
              <div className="flex h-full min-h-[300px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15] sm:p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                        <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <h2 className="text-sm font-bold text-white">Verification</h2>
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {verificationQueue.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {verificationQueue.length > 0 ? (
                      verificationQueue.slice(0, isMobile ? 2 : 3).map((item) => {
                        const initials = item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 transition-colors hover:bg-white/[0.06]">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 font-mono text-[10px] font-black text-white shadow-md`}>
                                {initials}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-white">{item.name}</p>
                                <p className="text-[9px] text-gray-400">@{item.username}</p>
                              </div>
                            </div>
                            <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gray-400">
                              {item.submittedAt ? formatBackupTime(item.submittedAt) : "Pending"}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-[120px] flex-col items-center justify-center text-center">
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                        <p className="mt-1 text-xs font-bold text-white">All Verified</p>
                        <p className="text-[10px] text-gray-400">No pending verifications</p>
                      </div>
                    )}
                  </div>
                </div>

                <Link href="/admin/players" className="mt-3 flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-500/30 hover:text-white">
                  <UserPlus className="h-3 w-3" />
                  Review Queue
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 8. FOOTER */}
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <p className="text-[10px] font-medium text-gray-400 sm:text-xs">
                © {new Date().getFullYear()} Nexus Esports League. All data live &amp; auto-refreshed every 30s.
                <span className="hidden sm:inline"> • Admin Hub v3.0</span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-gray-300">
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 ring-1 ring-emerald-500/30">
                  <CheckCircle className="h-3 w-3" />
                  Operational
                </span>
                <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 font-mono text-blue-400 ring-1 ring-blue-500/30">
                  <Database className="h-3 w-3" />
                  {overview?.system.queryTime || 12}ms
                </span>
                <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 font-mono text-purple-400 ring-1 ring-purple-500/30">
                  <Users className="h-3 w-3" />
                  {overview?.stats.totalPlayers || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}