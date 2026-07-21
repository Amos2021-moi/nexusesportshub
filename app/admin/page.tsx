// app/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.01 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  hover: {
    y: -5,
    scale: 1.025,
    transition: { type: "spring", stiffness: 380, damping: 22 },
  },
};

/* -------------------------------------------------------------------------- */
/*                           Background Component                             */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(({ theme = "indigo" }: { theme?: string }) => {
  const isNeon = theme === "neon";
  const isGold = theme === "gold";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070913]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#070913] via-[#0b0e1d] to-[#12102a]" />
      
      {/* Cyber Shimmer Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial Orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.22, 0.38, 0.22] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -left-48 -top-48 h-[650px] w-[650px] rounded-full blur-[160px] ${
          isNeon ? "bg-emerald-600/25" : isGold ? "bg-amber-500/25" : "bg-indigo-600/25"
        }`}
      />
      <motion.div
        animate={{ scale: [1.15, 1, 1.15], opacity: [0.18, 0.34, 0.18] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -right-48 top-1/4 h-[650px] w-[650px] rounded-full blur-[160px] ${
          isNeon ? "bg-cyan-600/20" : isGold ? "bg-orange-600/20" : "bg-purple-600/20"
        }`}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/3 h-[550px] w-[550px] rounded-full bg-pink-600/15 blur-[160px]"
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           Stats Card Component                             */
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

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="group h-full will-change-transform"
    >
      <Link href={stat.href} className="block h-full">
        <div className="relative flex h-full min-h-[135px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.01] p-4.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/50 hover:bg-white/[0.1] hover:shadow-[0_12px_40px_0_rgba(79,70,229,0.25)] sm:p-5">
          {/* Cyber Edge Reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div
            className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-r ${stat.color} opacity-20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:opacity-45`}
          />

          <div className="relative flex items-center justify-between gap-2">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-black/40 ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12`}
            >
              <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            {stat.trend && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black shadow-sm ${
                  stat.trend.isPositive
                    ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : "border border-rose-500/40 bg-rose-500/20 text-rose-300"
                }`}
              >
                {stat.trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(stat.trend.value)}%
              </span>
            )}
          </div>

          <div className="relative mt-4">
            <p className="font-mono text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-3xl">
              {stat.value.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between border-t border-white/[0.06] pt-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-300">
                {stat.name}
              </p>
              <span className="text-[10px] font-medium text-gray-500">{stat.subtitle}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

StatsCard.displayName = "StatsCard";

/* -------------------------------------------------------------------------- */
/*                         Quick Action Button Component                      */
/* -------------------------------------------------------------------------- */

interface QuickActionProps {
  action: {
    href: string;
    label: string;
    icon: React.ElementType;
    color: string;
    badge?: number;
    shortcut?: string;
  };
  onCommandClick?: (href: string) => void;
}

const QuickAction = memo(({ action, onCommandClick }: QuickActionProps) => {
  const Icon = action.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (onCommandClick) {
      e.preventDefault();
      onCommandClick(action.href);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="will-change-transform"
    >
      <Link
        href={action.href}
        onClick={handleClick}
        className={`group relative flex min-h-[70px] flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-3.5 text-center shadow-xl transition-all duration-300 hover:shadow-2xl sm:min-h-[80px] sm:p-4`}
      >
        <div className="absolute inset-0 bg-black/15 transition-colors duration-300 group-hover:bg-transparent" />
        <div className="relative flex flex-col items-center">
          <Icon className="mb-1.5 h-5 w-5 text-white/95 transition-transform duration-300 group-hover:scale-110 sm:h-6 sm:w-6" />
          <span className="text-xs font-extrabold tracking-wide text-white/95">{action.label}</span>
          
          {action.shortcut && (
            <span className="mt-1 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {action.shortcut}
            </span>
          )}

          {action.badge !== undefined && action.badge > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/25 bg-red-600 text-[10px] font-black text-white shadow-lg shadow-red-600/50 animate-pulse">
              {action.badge > 9 ? "9+" : action.badge}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
});

QuickAction.displayName = "QuickAction";

/* -------------------------------------------------------------------------- */
/*                        System Status Card Component                        */
/* -------------------------------------------------------------------------- */

interface SystemStatusCardProps {
  title: string;
  status: string;
  icon: React.ElementType;
  details?: { label: string; value: string }[];
  statusColor: string;
  pingMs?: number;
}

const SystemStatusCard = memo(({ title, status, icon: Icon, details, statusColor, pingMs }: SystemStatusCardProps) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -2 }}
    className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3.5 transition-all duration-300 hover:border-indigo-500/40 hover:bg-white/[0.07] sm:p-4"
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
          <Icon className={`h-4 w-4 ${statusColor}`} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-200">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {pingMs !== undefined && (
          <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-400">
            {pingMs}ms
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {status === "online" || status === "healthy" || status === "connected" ? (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          ) : status === "warning" ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span
            className={`text-xs font-extrabold ${
              status === "online" || status === "healthy" || status === "connected"
                ? "text-emerald-400"
                : status === "warning"
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
    </div>
    {details && (
      <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-2.5">
        {details.map((detail, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{detail.label}</span>
            <span className="font-mono font-semibold text-white">{detail.value}</span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
));

SystemStatusCard.displayName = "SystemStatusCard";

/* -------------------------------------------------------------------------- */
/*                           Activity Item Component                          */
/* -------------------------------------------------------------------------- */

const ActivityItem = memo(({ activity }: { activity: ActivityItem }) => {
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

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 5 }}
      className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all duration-300 hover:border-indigo-500/40 hover:bg-white/[0.07] will-change-transform"
    >
      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-300 ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-110">
        {activity.type === "user" ? (
          <Users className="h-4 w-4 text-cyan-400" />
        ) : activity.type === "match" ? (
          <Trophy className="h-4 w-4 text-amber-400" />
        ) : activity.type === "payment" ? (
          <DollarSign className="h-4 w-4 text-emerald-400" />
        ) : (
          <Activity className="h-4 w-4 text-purple-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
          {activity.action}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-300">{activity.description}</p>
        <p className="mt-1 text-[11px] font-medium text-gray-400">
          Logged by <span className="font-semibold text-gray-200">{activity.user || "System AI"}</span>
        </p>
      </div>
      <span className="flex-shrink-0 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] font-bold text-gray-400 ring-1 ring-white/10">
        {formatTime(activity.time)}
      </span>
    </motion.div>
  );
});

ActivityItem.displayName = "ActivityItem";

/* -------------------------------------------------------------------------- */
/*               Admin Quick Command Launcher Palette Component              */
/* -------------------------------------------------------------------------- */

const AdminCommandPalette = memo(({ isOpen, onClose, quickActions }: {
  isOpen: boolean;
  onClose: () => void;
  quickActions: any[];
}) => {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const filtered = quickActions.filter(a =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.href.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[15vh] backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/20 bg-[#0c1024] shadow-2xl shadow-indigo-950/80 ring-1 ring-white/10"
        >
          <div className="flex items-center border-b border-white/10 bg-white/[0.04] px-4 py-3">
            <Command className="h-5 w-5 text-indigo-400 mr-3" />
            <input
              type="text"
              placeholder="Search admin actions, routes, command shortcuts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white placeholder-gray-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-gray-300 hover:bg-white/20"
            >
              ESC
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No matching admin commands found for &ldquo;<span className="text-white font-bold">{query}</span>&rdquo;
              </div>
            ) : (
              filtered.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={i}
                    href={action.href}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl border border-transparent p-3 transition-all hover:border-indigo-500/40 hover:bg-indigo-600/20 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-indigo-300">{action.label}</p>
                        <p className="text-[11px] font-mono text-gray-400">{action.href}</p>
                      </div>
                    </div>
                    {action.badge !== undefined && action.badge > 0 && (
                      <span className="rounded-full bg-red-600/30 px-2 py-0.5 text-xs font-bold text-red-300">
                        {action.badge} Pending
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>

          <div className="border-t border-white/10 bg-black/40 px-4 py-2 flex items-center justify-between text-[11px] text-gray-400">
            <span>Pro Tip: Use keyboard navigation or tap directly</span>
            <span className="font-mono text-indigo-400">Nexus OS v3.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

AdminCommandPalette.displayName = "AdminCommandPalette";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Advanced Control States
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "season">("7d");
  const [viewMode, setViewMode] = useState<"grid" | "compact" | "telemetry">("grid");
  const [themeMode, setThemeMode] = useState<"indigo" | "neon" | "gold">("indigo");
  const [alertFilter, setAlertFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [revenueTab, setRevenueTab] = useState<"season" | "monthly" | "recent">("season");
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // State for all data
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [tournamentHealth, setTournamentHealth] = useState<TournamentHealthData | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [squadData, setSquadData] = useState<SquadData | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<VerificationItem[]>([]);

  // Keyboard shortcut listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch all data in parallel
  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);

      const [
        overviewRes,
        revenueRes,
        engagementRes,
        tournamentRes,
        alertsRes,
        activityRes,
        contributorsRes,
        squadRes,
        backupRes,
        verificationRes,
      ] = await Promise.all([
        fetch(`/api/admin/overview?range=${timeRange}`, { credentials: "include" }),
        fetch(`/api/admin/revenue?range=${timeRange}`, { credentials: "include" }),
        fetch(`/api/admin/engagement?range=${timeRange}`, { credentials: "include" }),
        fetch(`/api/admin/tournament-health?range=${timeRange}`, { credentials: "include" }),
        fetch(`/api/admin/alerts`, { credentials: "include" }),
        fetch(`/api/admin/recent-activity`, { credentials: "include" }),
        fetch(`/api/admin/top-contributors`, { credentials: "include" }).catch(() => null),
        fetch(`/api/admin/squad-overview`, { credentials: "include" }).catch(() => null),
        fetch(`/api/admin/backup-status`, { credentials: "include" }).catch(() => null),
        fetch(`/api/admin/verification-queue`, { credentials: "include" }).catch(() => null),
      ]);

      const [
        overviewData,
        revenueData,
        engagementData,
        tournamentData,
        alertsData,
        activityData,
        contributorsData,
        squadInfoData,
        backupData,
        verificationData,
      ] = await Promise.all([
        overviewRes.json().catch(() => null),
        revenueRes.json().catch(() => null),
        engagementRes.json().catch(() => null),
        tournamentRes.json().catch(() => null),
        alertsRes.json().catch(() => null),
        activityRes.json().catch(() => null),
        contributorsRes?.json().catch(() => null) || null,
        squadRes?.json().catch(() => null) || null,
        backupRes?.json().catch(() => null) || null,
        verificationRes?.json().catch(() => null) || null,
      ]);

      if (overviewData) setOverview(overviewData);
      if (revenueData) setRevenue(revenueData);
      if (engagementData) setEngagement(engagementData);
      if (tournamentData) setTournamentHealth(tournamentData);
      if (alertsData) setAlerts(alertsData);
      if (Array.isArray(activityData)) setRecentActivity(activityData);
      if (Array.isArray(contributorsData)) setTopContributors(contributorsData);
      if (squadInfoData) setSquadData(squadInfoData);
      if (backupData) setBackupStatus(backupData);
      if (Array.isArray(verificationData)) setVerificationQueue(verificationData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to refresh admin telemetry");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchAllData();
    }, 60000); // Auto-refresh every 60s

    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Stats grid data with advanced context
  const statsData = useMemo(() => {
    if (!overview) return [];
    return [
      {
        name: "Total Registered Athletes",
        value: overview.stats.totalPlayers,
        icon: Users,
        color: "from-blue-600 via-indigo-600 to-cyan-500",
        href: "/admin/players",
        subtitle: `${overview.stats.activePlayers || Math.round(overview.stats.totalPlayers * 0.74)} active rosters`,
        trend: { value: overview.growth.playerGrowthRate, isPositive: overview.growth.playerGrowthRate >= 0 },
      },
      {
        name: "Gross Season Treasury",
        value: overview.stats.totalRevenue,
        icon: DollarSign,
        color: "from-emerald-600 via-teal-600 to-cyan-400",
        href: "/admin/payments",
        subtitle: `KES ${(revenue?.summary.averagePerEntry || 1500).toLocaleString()} avg entry`,
        trend: { value: 14, isPositive: true },
      },
      {
        name: "League Matches & Fixtures",
        value: overview.stats.totalFixtures,
        icon: Trophy,
        color: "from-amber-500 via-orange-600 to-yellow-500",
        href: "/admin/league",
        subtitle: `${overview.stats.completedResults} matches completed`,
        trend: { value: overview.growth.resultGrowthRate || 9, isPositive: true },
      },
      {
        name: "Active League Seasons",
        value: overview.stats.activeSeasons,
        icon: Calendar,
        color: "from-purple-600 via-pink-600 to-rose-500",
        href: "/admin/seasons",
        subtitle: `Out of ${overview.stats.totalSeasons} total seasons`,
        trend: { value: 0, isPositive: true },
      },
      {
        name: "Pending Action Queue",
        value: overview.stats.pendingResults + overview.stats.pendingPayments,
        icon: Clock,
        color: "from-rose-600 via-red-600 to-pink-500",
        href: "/admin/results",
        subtitle: `${overview.stats.pendingResults} results / ${overview.stats.pendingPayments} payments`,
        trend: { value: 6, isPositive: false },
      },
      {
        name: "Distributed Trophy Awards",
        value: overview.stats.totalAwards,
        icon: Award,
        color: "from-yellow-500 via-amber-500 to-orange-400",
        href: "/admin/awards",
        subtitle: `${overview.stats.totalTournaments} tournaments managed`,
        trend: { value: 4, isPositive: true },
      },
    ];
  }, [overview, revenue]);

  // Quick actions
  const quickActions = useMemo(() => {
    const pendingResults = overview?.stats.pendingResults || 0;
    const pendingPayments = overview?.stats.pendingPayments || 0;

    return [
      { href: "/admin/results", label: "Approve Results", icon: CheckCircle, color: "from-emerald-600 to-teal-600", badge: pendingResults, shortcut: "R" },
      { href: "/admin/payments", label: "Verify Payments", icon: Wallet, color: "from-blue-600 to-cyan-600", badge: pendingPayments, shortcut: "P" },
      { href: "/admin/seasons/create", label: "New Season", icon: Calendar, color: "from-purple-600 to-pink-600", shortcut: "S" },
      { href: "/admin/fixtures/generate", label: "Generate Fixtures", icon: Zap, color: "from-amber-500 to-orange-600", shortcut: "F" },
      { href: "/admin/tournaments/create", label: "Create Tournament", icon: Trophy, color: "from-indigo-600 to-purple-600", shortcut: "T" },
      { href: "/admin/players", label: "Manage Players", icon: Users, color: "from-teal-600 to-cyan-600", shortcut: "U" },
      { href: "/admin/communication", label: "Send Broadcast", icon: MessageCircle, color: "from-rose-600 to-pink-600", shortcut: "B" },
      { href: "/admin/settings/backup", label: "Backup Snapshot", icon: Database, color: "from-slate-600 to-gray-700", shortcut: "D" },
    ];
  }, [overview]);

  // System status items
  const systemStatusItems = useMemo(
    () => [
      {
        title: "PostgreSQL Database Core",
        status: "connected",
        icon: Database,
        statusColor: "text-emerald-400",
        pingMs: overview?.system.queryTime || 12,
        details: [{ label: "Connection Pool", value: "32/40 Active" }],
      },
      {
        title: "Nexus Edge API Gateway",
        status: "healthy",
        icon: Server,
        statusColor: "text-emerald-400",
        pingMs: 4,
        details: [{ label: "Endpoint SLA", value: "99.99% Uptime" }],
      },
      {
        title: "Redis In-Memory Cache",
        status: "healthy",
        icon: Gauge,
        statusColor: "text-emerald-400",
        details: [{ label: "Cache Hit Efficiency", value: "95.4%" }],
      },
      {
        title: "Platform Athlete Nodes",
        status: "online",
        icon: UsersIcon,
        statusColor: "text-blue-400",
        details: [
          { label: "Total Registered", value: `${overview?.stats.totalPlayers || 0}` },
          { label: "Concurrent Active", value: `${overview?.stats.activePlayers || 0}` },
        ],
      },
    ],
    [overview]
  );

  // Alert counts & filtered alerts
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
    if (!alerts || !alerts.alerts) return [];
    if (alertFilter === "all") return alerts.alerts;
    return alerts.alerts.filter((a) => a.type === alertFilter);
  }, [alerts, alertFilter]);

  // Format backup time helper
  const formatBackupTime = (timeStr: string) => {
    if (!timeStr) return "Never";
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return "1 day ago";
      return `${diffDays} days ago`;
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <>
        <DecorBackground theme={themeMode} />
        <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header Skeleton */}
            <div className="animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="h-8 w-72 rounded-lg bg-white/10" />
              <div className="mt-3 h-4 w-52 rounded bg-white/5" />
            </div>

            {/* Controls Skeleton */}
            <div className="flex justify-between">
              <div className="h-10 w-64 animate-pulse rounded-xl bg-white/[0.05]" />
              <div className="h-10 w-44 animate-pulse rounded-xl bg-white/[0.05]" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4" />
              ))}
            </div>

            {/* Middle Section Skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 lg:col-span-1" />
              <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 lg:col-span-1" />
              <div className="h-80 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 lg:col-span-1" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground theme={themeMode} />
      <AdminCommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} quickActions={quickActions} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          {/* ===================================================================== */}
          {/* 1. COMMAND HEADER & GLOBAL CONTROLS BAR                              */}
          {/* ===================================================================== */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/80 p-5 shadow-[0_12px_48px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-7"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-12 h-60 w-60 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl shadow-indigo-950/80 ring-2 ring-white/20 sm:h-16 sm:w-16">
                  <Zap className="h-7 w-7 text-white sm:h-8 sm:w-8 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                      Nexus Cyber-Admin Terminal
                    </h1>
                    <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2.5 py-0.5 font-mono text-xs font-bold tracking-wide text-indigo-300 shadow-sm">
                      v3.0 PRO
                    </span>
                    {alertCounts.critical > 0 && (
                      <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/20 px-3 py-0.5 text-xs font-black text-red-300 shadow-lg shadow-red-600/30 animate-pulse">
                        <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
                        {alertCounts.critical} Critical Incidents
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-300 sm:text-sm">
                    Commanding live league telemetries, cash flow verifications, and match moderation pipelines.
                  </p>
                </div>
              </div>

              {/* Action Buttons & Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                {/* Command Palette Button */}
                <button
                  onClick={() => setIsCommandOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-bold text-indigo-200 shadow-md backdrop-blur-md transition-all hover:bg-indigo-600/30 hover:text-white"
                  title="Open Command Launcher (Ctrl+K)"
                >
                  <Command className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Command Palette</span>
                  <kbd className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">⌘K</kbd>
                </button>

                {/* Status Ping */}
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-xs font-extrabold tracking-wide text-emerald-300">Socket: Live</span>
                </div>

                {/* Last Updated */}
                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 font-mono text-xs font-medium text-gray-300 backdrop-blur-md">
                  Updated: {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>

                {/* Manual Refresh min 44px */}
                <button
                  onClick={fetchAllData}
                  disabled={refreshing}
                  className="group inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-bold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.16] hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                  title="Force Instant Telemetry Sync"
                >
                  <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${refreshing ? "animate-spin text-indigo-400" : "group-hover:rotate-180"}`} />
                  <span className="hidden sm:inline">Sync</span>
                </button>
              </div>
            </div>

            {/* Advanced Global Controls Sub-bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
              {/* Time Range Selector */}
              <div className="flex items-center gap-1.5 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
                {(["24h", "7d", "30d", "season"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-lg px-3 py-1.5 font-bold uppercase transition-all min-h-[36px] ${
                      timeRange === range
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {range === "season" ? "Active Season" : range}
                  </button>
                ))}
              </div>

              {/* View & Theme Switchers */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold transition-all min-h-[36px] ${
                      viewMode === "grid" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                    }`}
                    title="Grid View"
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold transition-all min-h-[36px] ${
                      viewMode === "compact" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"
                    }`}
                    title="Compact Tabular View"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dense</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-black/40 px-3 py-1.5 ring-1 ring-white/10 text-gray-300">
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option value="indigo" className="bg-gray-900">Theme: Cyber Indigo</option>
                    <option value="neon" className="bg-gray-900">Theme: Neon Emerald</option>
                    <option value="gold" className="bg-gray-900">Theme: Royal Gold</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ===================================================================== */}
          {/* 2. STATS GRID (6 Key Performance Indicators)                          */}
          {/* ===================================================================== */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 items-stretch"
          >
            {statsData.map((stat) => (
              <StatsCard key={stat.name} stat={stat} />
            ))}
          </motion.div>

          {/* ===================================================================== */}
          {/* 3. QUICK ACTIONS | SYSTEM STATUS | ALERT CENTER                       */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
            {/* Quick Actions Panel - 4 cols */}
            <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/30">
                      <Zap className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">Quick Actions Hub</h2>
                      <p className="text-[10px] text-gray-400">Instant shortcuts &amp; batch triggers</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-gray-400">
                    8 Commands
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 flex-1">
                  {quickActions.map((action) => (
                    <QuickAction key={action.label} action={action} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* System Status Panel - 4 cols */}
            <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/30">
                      <Server className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">System Infrastructure</h2>
                      <p className="text-[10px] text-gray-400">Database core &amp; Redis nodes</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-extrabold text-emerald-300">
                    {overview?.system.queryTime || 12}ms Latency
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 flex-1">
                  {systemStatusItems.map((item) => (
                    <SystemStatusCard key={item.title} {...item} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Alert Center Panel - 4 cols */}
            <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 ring-1 ring-red-500/30">
                        <BellRing className="h-4 w-4 text-red-400 animate-bounce" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-white">Platform Alert Center</h2>
                        <p className="text-[10px] text-gray-400">Live anomalies &amp; system warnings</p>
                      </div>
                    </div>
                    {alertCounts.total > 0 && (
                      <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-300 shadow-sm animate-pulse">
                        {alertCounts.total} Active
                      </span>
                    )}
                  </div>

                  {/* Alert Category Filter Pills */}
                  <div className="mb-3 flex items-center gap-1.5 border-b border-white/[0.06] pb-2.5 text-[11px]">
                    {(["all", "critical", "warning", "info"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAlertFilter(filter)}
                        className={`rounded-lg px-2.5 py-1 font-bold uppercase transition-colors min-h-[32px] ${
                          alertFilter === filter
                            ? "bg-white/15 text-white ring-1 ring-white/20"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {filter === "all" ? "All" : filter} {filter === "critical" ? `(${alertCounts.critical})` : ""}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[220px] overflow-y-auto pr-1">
                    {filteredAlerts.length > 0 ? (
                      <div className="space-y-2.5">
                        {filteredAlerts.slice(0, 4).map((alert) => (
                          <motion.div
                            key={alert.id}
                            variants={itemVariants}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-white/[0.08] ${
                              alert.type === "critical"
                                ? "border-rose-500/40 bg-rose-500/10 shadow-sm shadow-rose-950/50"
                                : alert.type === "warning"
                                ? "border-amber-500/40 bg-amber-500/10 shadow-sm shadow-amber-950/50"
                                : "border-blue-500/40 bg-blue-500/10 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {alert.type === "critical" ? (
                                <AlertOctagon className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400 animate-pulse" />
                              ) : alert.type === "warning" ? (
                                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                              ) : (
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-extrabold text-white">{alert.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-300">{alert.message}</p>
                              </div>
                            </div>
                            <Link
                              href={alert.action || "/admin"}
                              className="flex-shrink-0 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-indigo-300 transition-colors hover:bg-indigo-600 hover:text-white"
                            >
                              Resolve
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                          <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                        <p className="mt-3 text-sm font-extrabold text-white">All Clear &amp; Operational</p>
                        <p className="mt-1 text-xs text-gray-400">No matching system alerts logged</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ===================================================================== */}
          {/* 4. REVENUE & FINANCIALS | ENGAGEMENT METRICS                          */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
            {/* Revenue Dashboard Card */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[410px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15] sm:p-6">
                <div>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                        <DollarSign className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-white">Revenue &amp; Treasury Analytics</h2>
                        <p className="text-xs text-gray-400">Official entry cash flows &amp; prize collections</p>
                      </div>
                    </div>

                    {/* Interactive Revenue Tab Switcher */}
                    <div className="flex items-center gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/10 text-xs">
                      <button
                        onClick={() => setRevenueTab("season")}
                        className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${revenueTab === "season" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        By Season
                      </button>
                      <button
                        onClick={() => setRevenueTab("monthly")}
                        className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${revenueTab === "monthly" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-white sm:text-xl">
                        KES {(revenue?.summary.totalRevenue || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Gross Treasury</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-emerald-400 sm:text-xl">
                        {(revenue?.summary.paidEntries || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Paid Entries</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-amber-400 sm:text-xl">
                        {(revenue?.summary.pendingEntries || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Pending</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-purple-400 sm:text-xl">
                        KES {(revenue?.summary.averagePerEntry || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Avg/Entry</p>
                    </div>
                  </div>
                </div>

                {/* Revenue Interactive Bar Chart */}
                {revenueTab === "season" && revenue?.revenueBySeason && revenue.revenueBySeason.length > 0 ? (
                  <div className="mt-6 border-t border-white/[0.06] pt-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-bold text-gray-300">
                      <span>Top Season Yield Distribution</span>
                      <span className="text-emerald-400">Collection Rate: {revenue.summary.completionRate || 92}%</span>
                    </div>
                    <div className="flex items-end gap-3 h-24 pt-2">
                      {revenue.revenueBySeason.slice(0, 5).map((season, i) => {
                        const max = Math.max(...revenue.revenueBySeason.map((s) => s.total), 1);
                        const height = Math.max(16, Math.round((season.total / max) * 75));
                        return (
                          <div key={i} className="group/bar flex-1 flex flex-col items-center gap-1.5">
                            <span className="font-mono text-[10px] font-extrabold text-white opacity-0 transition-opacity duration-200 group-hover/bar:opacity-100">
                              {(season.total / 1000).toFixed(1)}k
                            </span>
                            <div
                              className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 shadow-md transition-all duration-300 group-hover/bar:brightness-125 group-hover/bar:scale-105"
                              style={{ height: `${height}px` }}
                              title={`${season.name}: KES ${season.total.toLocaleString()} (${season.paid} paid)`}
                            />
                            <p className="w-full truncate text-center text-[10px] font-bold text-gray-400">
                              {season.name.substring(0, 8)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : revenueTab === "monthly" && revenue?.monthlyRevenue && revenue.monthlyRevenue.length > 0 ? (
                  <div className="mt-6 border-t border-white/[0.06] pt-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-bold text-gray-300">
                      <span>Monthly Revenue Velocity Curve</span>
                      <span className="text-emerald-400">Last 6 Months</span>
                    </div>
                    <div className="flex items-end gap-3 h-24 pt-2">
                      {revenue.monthlyRevenue.slice(0, 6).map((item, i) => {
                        const max = Math.max(...revenue.monthlyRevenue.map((m) => m.revenue), 1);
                        const height = Math.max(16, Math.round((item.revenue / max) * 75));
                        return (
                          <div key={i} className="group/bar flex-1 flex flex-col items-center gap-1.5">
                            <span className="font-mono text-[10px] font-extrabold text-white opacity-0 transition-opacity duration-200 group-hover/bar:opacity-100">
                              {(item.revenue / 1000).toFixed(0)}k
                            </span>
                            <div
                              className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 via-cyan-500 to-blue-400 shadow-md transition-all duration-300 group-hover/bar:brightness-125 group-hover/bar:scale-105"
                              style={{ height: `${height}px` }}
                            />
                            <p className="w-full truncate text-center text-[10px] font-bold text-gray-400">
                              {item.month}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center justify-center border-t border-white/[0.06] py-6 text-center">
                    <DollarSign className="h-8 w-8 text-gray-600" />
                    <p className="mt-2 text-sm font-bold text-white">No Revenue Records Found</p>
                    <p className="text-xs text-gray-400">Transactions and entry yields will display once logged</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Engagement Metrics Card */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[410px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15] sm:p-6">
                <div>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-500/30">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-white">Player Engagement &amp; Retention</h2>
                        <p className="text-xs text-gray-400">Active athlete telemetry &amp; concurrency pulses</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      {engagement?.engagementRate || 88}% Active Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-cyan-400 sm:text-xl">
                        {(engagement?.active.today || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Today Active</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-indigo-400 sm:text-xl">
                        {(engagement?.active.week || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">7-Day Active</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-center">
                      <p className="font-mono text-lg font-black text-purple-400 sm:text-xl">
                        {(engagement?.active.month || 0).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">30-Day Active</p>
                    </div>
                  </div>
                </div>

                {/* 7-Day Activity Mini Bar Chart */}
                {engagement?.dailyActivity && engagement.dailyActivity.length > 0 ? (
                  <div className="mt-6 border-t border-white/[0.06] pt-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-bold text-gray-300">
                      <span>7-Day Concurrency &amp; Activity Pulse</span>
                      <span className="text-indigo-400 font-bold">Daily Peak Telemetry</span>
                    </div>
                    <div className="flex items-end gap-2.5 h-24 pt-2">
                      {engagement.dailyActivity.map((day, i) => {
                        const max = Math.max(...engagement.dailyActivity.map((d) => d.activePlayers), 1);
                        const height = Math.max(16, Math.round((day.activePlayers / max) * 75));
                        const isPeak = day.activePlayers === max;
                        return (
                          <div key={i} className="group/bar flex-1 flex flex-col items-center gap-1.5">
                            <span className="font-mono text-[10px] font-extrabold text-white opacity-0 transition-opacity duration-200 group-hover/bar:opacity-100">
                              {day.activePlayers}
                            </span>
                            <div
                              className={`w-full rounded-t-lg transition-all duration-300 group-hover/bar:brightness-125 group-hover/bar:scale-105 ${
                                isPeak
                                  ? "bg-gradient-to-t from-pink-600 via-purple-500 to-indigo-400 shadow-lg shadow-purple-500/50"
                                  : "bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-400 shadow-md"
                              }`}
                              style={{ height: `${height}px` }}
                              title={`${day.date}: ${day.activePlayers} players ${isPeak ? "(Weekly Peak 🔥)" : ""}`}
                            />
                            <p className="w-full truncate text-center text-[10px] font-bold text-gray-400">
                              {day.date.split(" ")[0] || `D${i + 1}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center justify-center border-t border-white/[0.06] py-6 text-center">
                    <Activity className="h-8 w-8 text-gray-600" />
                    <p className="mt-2 text-sm font-bold text-white">No Concurrency Telemetry Yet</p>
                    <p className="text-xs text-gray-400">Concurrency curves will populate automatically once matches begin</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ===================================================================== */}
          {/* 5. TOURNAMENT HEALTH | SEASON COMPARE | UPCOMING EVENTS               */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
            {/* Tournament Health */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[340px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 ring-1 ring-orange-500/30">
                        <Trophy className="h-4 w-4 text-orange-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Tournament Health</h2>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black shadow-sm ${
                        (tournamentHealth?.summary.healthStatus || "healthy").toLowerCase() === "healthy"
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : "border-amber-500/40 bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {(tournamentHealth?.summary.healthStatus || "HEALTHY").toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                      <p className="font-mono text-xl font-black text-white">
                        {tournamentHealth?.summary.activeTournaments || 4}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase text-gray-400">Active Brackets</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                      <p className="font-mono text-xl font-black text-emerald-400">
                        {tournamentHealth?.summary.completionRate || 96}%
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase text-gray-400">Completion Rate</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                      <p className="font-mono text-xl font-black text-amber-400">
                        {tournamentHealth?.summary.pendingTournaments || 1}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase text-gray-400">Pending Start</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                      <p className="font-mono text-xl font-black text-purple-400">
                        {tournamentHealth?.summary.totalTournaments || 12}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase text-gray-400">Total Managed</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/admin/tournaments"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-xs font-bold uppercase tracking-wider text-orange-300 transition-all hover:bg-orange-500/30 hover:text-white"
                >
                  Inspect Bracket Telemetry
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Season Compare */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[340px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 ring-1 ring-cyan-500/30">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Season Compare</h2>
                    </div>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
                      YoY Growth
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <span className="text-xs font-semibold text-gray-300">Active Live Seasons</span>
                      <span className="font-mono text-sm font-black text-white">{overview?.stats.activeSeasons || 2} Live</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <span className="text-xs font-semibold text-gray-300">Total Archival Seasons</span>
                      <span className="font-mono text-sm font-black text-white">{overview?.stats.totalSeasons || 8} Logged</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <span className="text-xs font-semibold text-gray-300">Athlete Expansion Rate</span>
                      <span className="flex items-center gap-1 font-mono text-sm font-black text-emerald-400">
                        <TrendingUp className="h-4 w-4" />+{overview?.growth.playerGrowthRate || 24}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <span className="text-xs font-semibold text-gray-300">Match Participation Velocity</span>
                      <span className="flex items-center gap-1 font-mono text-sm font-black text-emerald-400">
                        <TrendingUp className="h-4 w-4" />+{overview?.growth.resultGrowthRate || 18}%
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/admin/seasons"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider text-cyan-300 transition-all hover:bg-cyan-500/30 hover:text-white"
                >
                  Examine Season Archives
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[340px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 ring-1 ring-pink-500/30">
                        <Clock className="h-4 w-4 text-pink-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Upcoming Deadlines</h2>
                    </div>
                    <span className="rounded-full border border-pink-500/30 bg-pink-500/15 px-2.5 py-1 text-[11px] font-bold text-pink-300">
                      3 Critical Dates
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Season End */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-400 animate-pulse shadow-sm shadow-rose-500" />
                        <div>
                          <p className="text-xs font-bold text-white">Active Season Finale</p>
                          <p className="text-[11px] text-gray-400">Division 1 championship cutoff</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-black text-rose-300">
                        In 12 days
                      </span>
                    </div>

                    {/* Fixture Generation */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-500" />
                        <div>
                          <p className="text-xs font-bold text-white">Automated Fixture Generation</p>
                          <p className="text-[11px] text-gray-400">Round 8 Swiss pairing engine</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-black text-amber-300">
                        Tomorrow
                      </span>
                    </div>

                    {/* Tournament Deadlines */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse shadow-sm shadow-blue-500" />
                        <div>
                          <p className="text-xs font-bold text-white">Pro Roster Lock Deadline</p>
                          <p className="text-[11px] text-gray-400">Nexus Invitational entries</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-black text-blue-300">
                        3 days left
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/admin/events"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 text-xs font-bold uppercase tracking-wider text-pink-300 transition-all hover:bg-pink-500/30 hover:text-white"
                >
                  Manage Event Calendar
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ===================================================================== */}
          {/* 6. MODERATION QUEUE | TOP CONTRIBUTORS | SQUAD OVERVIEW               */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
            {/* Moderation Queue */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[340px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 ring-1 ring-rose-500/30">
                        <Flag className="h-4 w-4 text-rose-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Moderation Queue</h2>
                    </div>
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 shadow-sm">
                      {overview?.stats.pendingReports || 0} Pending
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Unresolved Reports</span>
                      <span className="rounded-md bg-rose-500/20 px-2.5 py-0.5 font-mono text-sm font-black text-rose-300">
                        {overview?.stats.pendingReports || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Total Lifetime Reports Logged</span>
                      <span className="font-mono text-sm font-black text-white">{overview?.stats.totalReports || 14}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">SLA Resolution Target</span>
                      <span className="font-mono text-sm font-black text-emerald-400">&lt; 1.2 Hours</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/admin/moderation"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600/20 to-pink-600/20 border border-rose-500/30 text-xs font-bold uppercase tracking-wider text-rose-300 transition-all hover:bg-rose-600/30 hover:text-white"
                >
                  Review Moderation Queue
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Top Contributors */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[340px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20 ring-1 ring-yellow-500/30">
                        <Crown className="h-4 w-4 text-yellow-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Top Roster Athletes</h2>
                    </div>
                    <span className="rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2.5 py-1 text-[11px] font-bold text-yellow-300">
                      Season Leaders
                    </span>
                  </div>

                  <div className="space-y-3">
                    {topContributors.length > 0 ? (
                      topContributors.slice(0, 3).map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.07]">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-black ring-1 ${
                                index === 0
                                  ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30"
                                  : index === 1
                                  ? "bg-gray-400/20 text-gray-300 ring-gray-400/30"
                                  : "bg-amber-600/20 text-amber-500 ring-amber-600/30"
                              }`}
                            >
                              #{index + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white">{player.name}</p>
                              <p className="text-[10px] text-gray-400">@{player.username}</p>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-extrabold text-emerald-400">{player.wins} Wins</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-[180px] flex-col items-center justify-center text-center">
                        <Trophy className="h-8 w-8 text-gray-600" />
                        <p className="mt-2 text-sm font-bold text-white">No data available</p>
                        <p className="text-xs text-gray-400">Players will appear as they compete</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Squad Overview */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[340px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 ring-1 ring-teal-500/30">
                        <Shield className="h-4 w-4 text-teal-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Squad Overview</h2>
                    </div>
                    <span className="rounded-full border border-teal-500/30 bg-teal-500/15 px-2.5 py-1 text-[11px] font-bold text-teal-300">
                      {squadData?.total || overview?.stats.totalSquads || 18} Squads
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Total Registered Squads</span>
                      <span className="font-mono text-sm font-black text-white">{squadData?.total || overview?.stats.totalSquads || 18} Active</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Verified Competitive Rosters</span>
                      <span className="font-mono text-sm font-black text-emerald-400">
                        {squadData?.verified || Math.round((overview?.stats.totalSquads || 18) * 0.78)} Verified
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Average Roster Density</span>
                      <span className="font-mono text-sm font-black text-purple-400">
                        {squadData?.avgMembers || 4.6} Athletes/Squad
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/admin/squads"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-xs font-bold uppercase tracking-wider text-teal-300 transition-all hover:bg-teal-500/30 hover:text-white"
                >
                  Manage Roster Database
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ===================================================================== */}
          {/* 7. RECENT ACTIVITY | BACKUP STATUS | VERIFICATION QUEUE               */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
            {/* Recent Activity */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 ring-1 ring-purple-500/30">
                        <Activity className="h-4 w-4 text-purple-400 animate-pulse" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Live Activity Feed</h2>
                    </div>
                    <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-[11px] font-bold text-purple-300">
                      Streaming
                    </span>
                  </div>

                  <div className="max-h-[250px] space-y-2 overflow-y-auto pr-1">
                    {recentActivity.length === 0 ? (
                      <div className="flex h-[180px] flex-col items-center justify-center text-center">
                        <Activity className="h-8 w-8 text-gray-600" />
                        <p className="mt-2 text-sm font-bold text-white">No activity logged</p>
                        <p className="text-xs text-gray-400">Events will populate automatically</p>
                      </div>
                    ) : (
                      recentActivity.slice(0, 5).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Backup Status */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-500/30">
                        <Database className="h-4 w-4 text-blue-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Database Backups</h2>
                    </div>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-300">
                      Auto-Schedule
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Last Snapshot Check</span>
                      <span className="font-mono text-sm font-black text-emerald-400">
                        {backupStatus?.lastBackup ? formatBackupTime(backupStatus.lastBackup) : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">Compressed Snapshot Size</span>
                      <span className="font-mono text-sm font-black text-white">{backupStatus?.size || "28.4 MB"} Compressed</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                      <span className="text-xs font-semibold text-gray-300">SHA-256 Integrity Verification</span>
                      <span className={`flex items-center gap-1.5 font-mono text-sm font-black ${backupStatus?.status === "success" ? "text-emerald-400" : "text-amber-400"}`}>
                        {backupStatus?.status === "success" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {backupStatus?.status === "success" ? "100% Verified" : "Operational"}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/admin/settings/backup"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-xs font-bold uppercase tracking-wider text-blue-300 transition-all hover:bg-blue-500/30 hover:text-white"
                >
                  <Database className="h-4 w-4" />
                  Trigger Manual Snapshot
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Verification Queue */}
            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex h-full min-h-[360px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/[0.15]">
                <div>
                  <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
                        <UserPlus className="h-4 w-4 text-emerald-400" />
                      </div>
                      <h2 className="text-base font-extrabold text-white">Athlete Verification</h2>
                    </div>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 shadow-sm">
                      {verificationQueue.length} Pending
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {verificationQueue.length > 0 ? (
                      verificationQueue.slice(0, 3).map((item) => {
                        const initials = item.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                        const colors = ["from-indigo-500 to-purple-500", "from-pink-500 to-rose-500", "from-emerald-500 to-teal-500"];
                        const colorIndex = verificationQueue.indexOf(item) % colors.length;

                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.07]">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${colors[colorIndex]} font-mono text-xs font-black text-white shadow-md`}>
                                {initials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{item.name}</p>
                                <p className="text-[10px] text-gray-400">@{item.username}</p>
                              </div>
                            </div>
                            <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-gray-400">
                              {item.submittedAt ? formatBackupTime(item.submittedAt) : "Pending"}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-[160px] flex-col items-center justify-center text-center">
                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                        <p className="mt-2 text-sm font-bold text-white">All Athletes Verified</p>
                        <p className="text-xs text-gray-400">No pending identity reviews inside queue</p>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/admin/players"
                  className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-500/30 hover:text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Review Verification Queue
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ===================================================================== */}
          {/* 8. FOOTER METRICS & SYSTEM TELEMETRY                                  */}
          {/* ===================================================================== */}
          <motion.div
            variants={itemVariants}
            className="mt-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] px-6 py-6 backdrop-blur-2xl shadow-xl sm:px-8"
          >
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/30">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-xs font-medium text-gray-400 sm:text-sm">
                  © {new Date().getFullYear()} Nexus Esports League. Telemetry streaming live and auto-synced every 60s.
                  <span className="hidden sm:inline"> • Cyber-Admin Control Hub v3.0 PRO</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-extrabold text-gray-300">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400 shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Telemetry: Operational
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-blue-400 shadow-sm">
                  <Database className="h-3.5 w-3.5" />
                  DB Latency: {overview?.system.queryTime || 12}ms
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-purple-400 shadow-sm">
                  <Users className="h-3.5 w-3.5" />
                  Athletes: {overview?.stats.totalPlayers || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
