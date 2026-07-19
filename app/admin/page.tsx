"use client";

import { useSystemStatus } from "@/lib/hooks/useSystemStatus";
import { useEffect, useState, useMemo, memo } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Skeleton, SkeletonStats } from "@/components/ui/Skeleton";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface Stats {
  totalPlayers: number;
  activeSeasons: number;
  totalFixtures: number;
  completedResults: number;
  pendingResults: number;
  totalAwards: number;
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

interface HealthIndicators {
  pendingResults: number;
  unscheduledFixtures: number;
  missingSquadUploads: number;
  inactivePlayers: number;
  totalPlayers: number;
  completionRate: number;
  avgApprovalTime: number;
  seasonName: string;
  totalFixtures: number;
  completedFixtures: number;
}

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat }: { stat: { name: string; value: number; icon: any; color: string; href: string } }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group will-change-transform"
    >
      <Link href={stat.href} className="block h-full">
        <div className="relative h-full min-h-[80px] overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40">
          <div
            className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-r ${stat.color} opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40`}
          />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg bg-gradient-to-r ${stat.color} p-2 shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                +12%
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-0.5 text-xs text-gray-400">{stat.name}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

const HealthCard = memo(({ card }: { card: { value: string | number; label: string; icon: any; color: string; bg: string; border: string } }) => {
  const Icon = card.icon;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`will-change-transform rounded-xl border p-3 text-center ${card.border} ${card.bg}`}
    >
      <Icon className={`mx-auto mb-1.5 h-5 w-5 ${card.color}`} />
      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
      <p className="text-xs text-gray-400">{card.label}</p>
    </motion.div>
  );
});

HealthCard.displayName = "HealthCard";

const ActivityItem = memo(({ activity }: { activity: ActivityItem }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ x: 4 }}
    className="group will-change-transform rounded-xl border border-white/5 bg-gray-900/30 p-3 transition-colors hover:border-indigo-500/20 hover:bg-gray-900/60"
  >
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
        <Activity className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{activity.action}</p>
        <p className="mt-0.5 truncate text-xs text-gray-400">{activity.description}</p>
        <p className="mt-0.5 text-xs text-gray-500">by {activity.user}</p>
      </div>
      <span className="flex-shrink-0 text-[10px] text-gray-500">
        {new Date(activity.time).toLocaleDateString()}
      </span>
    </div>
  </motion.div>
));

ActivityItem.displayName = "ActivityItem";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Quick Action Button                             */
/* -------------------------------------------------------------------------- */

const QuickAction = memo(({ action }: { action: { href: string; label: string; icon: any; color: string } }) => {
  const Icon = action.icon;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="will-change-transform"
    >
      <Link
        href={action.href}
        className={`group relative overflow-hidden rounded-xl bg-gradient-to-r ${action.color} p-4 text-center shadow-lg transition-all hover:shadow-xl`}
      >
        <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
        <div className="relative">
          <Icon className="mx-auto mb-1.5 h-5 w-5 text-white/90" />
          <span className="text-xs font-medium text-white/90">{action.label}</span>
        </div>
      </Link>
    </motion.div>
  );
});

QuickAction.displayName = "QuickAction";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminOverview() {
  const { status: systemStatus, loading: statusLoading, refetch: refetchStatus } = useSystemStatus();

  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    activeSeasons: 0,
    totalFixtures: 0,
    completedResults: 0,
    pendingResults: 0,
    totalAwards: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [health, setHealth] = useState<HealthIndicators>({
    pendingResults: 0,
    unscheduledFixtures: 0,
    missingSquadUploads: 0,
    inactivePlayers: 0,
    totalPlayers: 0,
    completionRate: 0,
    avgApprovalTime: 0,
    seasonName: "No Active Season",
    totalFixtures: 0,
    completedFixtures: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    fetchHealthIndicators();
  }, []);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();
    setStats(data);
  }

  async function fetchRecentActivity() {
    const res = await fetch("/api/admin/recent-activity");
    const data = await res.json();
    setRecentActivity(data);
  }

  async function fetchHealthIndicators() {
    const res = await fetch("/api/admin/health");
    const data = await res.json();
    setHealth(data);
    setLoading(false);
  }

  const statCards = useMemo(() => [
    { name: "Total Players", value: stats.totalPlayers, icon: Users, color: "from-blue-500 to-cyan-500", href: "/admin/players" },
    { name: "Active Seasons", value: stats.activeSeasons, icon: Trophy, color: "from-yellow-500 to-orange-500", href: "/admin/seasons" },
    { name: "Total Fixtures", value: stats.totalFixtures, icon: Calendar, color: "from-green-500 to-emerald-500", href: "/admin/league" },
    { name: "Completed", value: stats.completedResults, icon: CheckCircle, color: "from-purple-500 to-pink-500", href: "/admin/results" },
    { name: "Pending", value: stats.pendingResults, icon: Eye, color: "from-orange-500 to-red-500", href: "/admin/results" },
    { name: "Awards", value: stats.totalAwards, icon: Award, color: "from-indigo-500 to-purple-500", href: "/admin/awards" },
  ], [stats]);

  const healthCards = useMemo(() => [
    { value: health.pendingResults, label: "Pending Results", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { value: health.unscheduledFixtures, label: "Unscheduled", icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { value: health.missingSquadUploads, label: "Missing Squads", icon: ShieldOff, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { value: health.inactivePlayers, label: "Inactive", icon: Moon, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    { value: `${health.completionRate}%`, label: "Completion", icon: Percent, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    { value: `${health.avgApprovalTime}h`, label: "Avg Approval", icon: Timer, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ], [health]);

  const quickActions = useMemo(() => [
    { href: "/admin/seasons", label: "New Season", icon: Trophy, color: "from-indigo-500 to-purple-600" },
    { href: "/admin/league", label: "Fixtures", icon: Calendar, color: "from-emerald-500 to-teal-600" },
    { href: "/admin/results", label: "Approve", icon: CheckCircle, color: "from-yellow-500 to-amber-600" },
    { href: "/admin/awards", label: "Awards", icon: Award, color: "from-pink-500 to-rose-600" },
    { href: "/admin/players", label: "Players", icon: Users, color: "from-blue-500 to-cyan-600" },
    { href: "/admin/news", label: "News", icon: Newspaper, color: "from-rose-500 to-red-600" },
    { href: "/admin/settings/league", label: "Settings", icon: SettingsIcon, color: "from-slate-500 to-gray-600" },
    { href: "/admin/analytics", label: "Analytics", icon: Activity, color: "from-cyan-500 to-teal-600" },
  ], []);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-6 backdrop-blur-sm">
            <Skeleton variant="text" className="h-8 w-64" />
            <Skeleton variant="text" className="mt-1 h-4 w-48" />
          </div>
          <SkeletonStats />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-5 lg:col-span-2">
              <Skeleton variant="text" className="mb-4 h-6 w-32" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} variant="card" className="h-20" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-5">
              <Skeleton variant="text" className="mb-4 h-6 w-32" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton variant="text" className="h-4 w-20" />
                    <Skeleton variant="text" className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 will-change-transform"
      >
        {/* Welcome Section */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                  Admin Dashboard
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
                    v2.0
                  </span>
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome back! Here's your platform overview.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                <span className="text-xs font-medium text-green-400">Live</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
        >
          {statCards.map((stat) => (
            <StatCard key={stat.name} stat={stat} />
          ))}
        </motion.div>

        {/* League Health */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">League Health</h2>
              <span className="rounded-full bg-gray-700/30 px-2.5 py-0.5 text-[10px] text-gray-400">
                {health.completedFixtures}/{health.totalFixtures}
              </span>
            </div>
            <span className="text-xs text-gray-500">Season: {health.seasonName}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {healthCards.map((card) => (
              <HealthCard key={card.label} card={card} />
            ))}
          </div>
        </motion.div>

        {/* Bottom Grid: Quick Actions + System Status + Recent Activity */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Quick Actions - 5 columns */}
          <motion.div
            variants={itemVariants}
            className="xl:col-span-5"
          >
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-2">
                <div className="rounded-lg bg-yellow-500/10 p-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
                {quickActions.map((action) => (
                  <QuickAction key={action.label} action={action} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* System Status - 4 columns */}
          <motion.div
            variants={itemVariants}
            className="xl:col-span-4"
          >
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-500/10 p-2">
                    <Server className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">System Status</h2>
                </div>
                <button
                  onClick={refetchStatus}
                  disabled={statusLoading}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-gray-700/50 text-gray-400 transition-colors hover:bg-gray-600/50 hover:text-white disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={statusLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {statusLoading ? (
                <div className="space-y-3">
                  <div className="h-10 w-full animate-pulse rounded-lg bg-gray-700/50" />
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-700/50" />
                    ))}
                  </div>
                </div>
              ) : systemStatus ? (
                <div className="space-y-4">
                  {/* Health Status */}
                  <motion.div
                    variants={itemVariants}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      systemStatus.health.status === "healthy" ? "bg-green-500/10 border border-green-500/20" :
                      systemStatus.health.status === "warning" ? "bg-yellow-500/10 border border-yellow-500/20" :
                      "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {systemStatus.health.status === "healthy" ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : systemStatus.health.status === "warning" ? (
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        systemStatus.health.status === "healthy" ? "text-green-400" :
                        systemStatus.health.status === "warning" ? "text-yellow-400" :
                        "text-red-400"
                      }`}>
                        {systemStatus.health.status === "healthy" ? "Healthy" :
                         systemStatus.health.status === "warning" ? "Warning" :
                         "Critical"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {systemStatus.health.issues.length === 0 ? (
                        <span className="text-green-400">All systems go</span>
                      ) : (
                        <span className="text-yellow-400">{systemStatus.health.issues.length} issue(s)</span>
                      )}
                    </span>
                  </motion.div>

                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className="rounded-lg bg-gray-900/40 p-3 transition-all hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Database</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {systemStatus.database.status === "connected" ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className={`text-sm font-semibold ${
                          systemStatus.database.status === "connected" ? "text-green-400" : "text-red-400"
                        }`}>
                          {systemStatus.database.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Gauge className="h-3 w-3" />
                        <span>{systemStatus.database.latency}ms</span>
                        <span className="text-gray-600">•</span>
                        <span>{systemStatus.database.size}</span>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className="rounded-lg bg-gray-900/40 p-3 transition-all hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">API</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">
                          {systemStatus.api.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">All endpoints operational</div>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className="rounded-lg bg-gray-900/40 p-3 transition-all hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-400" />
                        <span className="text-xs text-gray-400">Server</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">CPU</span>
                          <span className="font-medium text-white">{systemStatus.server.cpu}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Memory</span>
                          <span className="font-medium text-white">{systemStatus.server.memory}</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className="rounded-lg bg-gray-900/40 p-3 transition-all hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs text-gray-400">Users</span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Total</span>
                          <span className="font-medium text-white">{systemStatus.users.total}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">New (24h)</span>
                          <span className="font-medium text-emerald-400">+{systemStatus.users.new24h}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                  <p className="mt-2 text-sm text-gray-400">Failed to load status</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity - 3 columns */}
          <motion.div
            variants={itemVariants}
            className="xl:col-span-3"
          >
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                {recentActivity.length > 0 && (
                  <span className="rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                    {recentActivity.length}
                  </span>
                )}
              </div>
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1 will-change-transform">
                {recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <AlertTriangle className="mx-auto h-8 w-8 text-gray-600" />
                    <p className="mt-2 text-sm">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.slice(0, 6).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                )}
              </div>
              {recentActivity.length > 6 && (
                <div className="mt-3 text-center">
                  <Link
                    href="/admin/audit"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    View all activity <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}