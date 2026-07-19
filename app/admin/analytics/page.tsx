"use client";

import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Trophy,
  Calendar,
  Award,
  Activity,
  LineChart,
  CheckCircle,
  Clock,
  Zap,
  Crown,
  UserPlus,
  RefreshCw,
  Users,
  Shield,
  DollarSign,
  Brain,
  Lightbulb,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Target,
  Flame,
  Star,
  Medal,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler
);

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisWeek: number;
    totalFixtures: number;
    completedFixtures: number;
    pendingResults: number;
    totalTournaments: number;
    activeTournaments: number;
    totalAwards: number;
    totalSeasons: number;
    completionRate: number;
  };
  userGrowth: { date: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    details: any;
    createdAt: string;
    user: { name: string; email: string } | null;
  }[];
  recentMatches: {
    id: string;
    homePlayer: string;
    awayPlayer: string;
    score: string | null;
    status: string;
    date: string;
  }[];
  topPlayers: {
    id: string;
    name: string;
    points: number;
    wins: number;
    draws: number;
    losses: number;
  }[];
  revenueData: { date: string; amount: number; count: number; forecast?: number }[];
  seasonPerformance: {
    seasonId: string;
    seasonName: string;
    matches: number;
    completedMatches: number;
    players: number;
    revenue: number;
    completionRate: number;
    status: string;
    isActive: boolean;
  }[];
  insights: {
    id: string;
    type: "positive" | "negative" | "warning" | "info";
    title: string;
    description: string;
    action?: string;
    link?: string;
  }[];
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
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

function rankMedal(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

function formatCurrency(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString()}`;
}

function getInsightStyle(type: string) {
  switch (type) {
    case "positive":
      return { icon: Lightbulb, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    case "negative":
      return { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    case "warning":
      return { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
    case "info":
    default:
      return { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
  }
}

/* ============================================================
   Premium chart helpers
   ============================================================ */

function makeAreaGradient(
  ctx: ScriptableContext<"line">,
  hex: [number, number, number]
) {
  const chart = ctx.chart;
  const { ctx: canvas, chartArea } = chart;
  if (!chartArea) return `rgba(${hex[0]}, ${hex[1]}, ${hex[2]}, 0.18)`;
  const g = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, `rgba(${hex[0]}, ${hex[1]}, ${hex[2]}, 0.45)`);
  g.addColorStop(0.5, `rgba(${hex[0]}, ${hex[1]}, ${hex[2]}, 0.12)`);
  g.addColorStop(1, `rgba(${hex[0]}, ${hex[1]}, ${hex[2]}, 0)`);
  return g;
}

const GRID = "rgba(148,163,184,0.08)";
const AXIS = "#94a3b8";

function buildLineOptions(opts?: {
  currency?: boolean;
  showLegend?: boolean;
}): ChartOptions<"line"> {
  const currency = opts?.currency ?? false;
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, right: 8, bottom: 4, left: 4 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: opts?.showLegend ?? false,
        align: "end",
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          font: { size: 11, weight: 500 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(129,140,248,0.35)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
        boxPadding: 6,
        titleFont: { size: 12, weight: 600 },
        bodyFont: { size: 12 },
        callbacks: {
          label: (item) => {
            const v = item.parsed.y;
            if (v === null || v === undefined) return "";
            const label = item.dataset.label ? `${item.dataset.label}: ` : "";
            return currency ? `${label}${formatCurrency(Number(v))}` : `${label}${v}`;
          },
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { color: GRID, drawTicks: false },
        ticks: {
          color: AXIS,
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
          padding: 8,
        },
      },
      y: {
        border: { display: false },
        grid: { color: GRID, drawTicks: false },
        ticks: {
          color: AXIS,
          font: { size: 10 },
          padding: 8,
          callback: (value) =>
            currency
              ? `${Number(value) >= 1000 ? (Number(value) / 1000).toFixed(0) + "k" : value}`
              : (value as number),
        },
        beginAtZero: true,
      },
    },
    elements: {
      line: { borderJoinStyle: "round", capBezierPoints: true },
      point: { hoverBorderWidth: 3 },
    },
  };
}

const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#cbd5e1",
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font: { size: 11, weight: 500 },
      },
    },
    tooltip: {
      backgroundColor: "rgba(15,23,42,0.95)",
      titleColor: "#f8fafc",
      bodyColor: "#cbd5e1",
      borderColor: "rgba(129,140,248,0.35)",
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      usePointStyle: true,
      boxPadding: 6,
      callbacks: {
        label: (item) => {
          const value = Number(item.parsed);
          const dataset = item.dataset.data as number[];
          const total = dataset.reduce((a, b) => a + Number(b), 0) || 1;
          const pct = Math.round((value / total) * 100);
          return ` ${item.label}: ${value} (${pct}%)`;
        },
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat }: { stat: any }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="will-change-transform"
    >
      <div className="group relative h-full min-h-[80px] overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40">
        <div
          className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40`}
        />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className={`rounded-xl bg-gradient-to-r ${stat.color} p-2 shadow-lg`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{stat.name}</p>
            <p className="mt-0.5 text-[10px] text-gray-500">{stat.hint}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

const ActivityItem = memo(({ activity }: { activity: any }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ x: 4 }}
    className="will-change-transform rounded-xl border border-white/5 bg-gray-900/30 p-3 transition-colors hover:border-indigo-500/20 hover:bg-gray-900/60"
  >
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
          <Activity className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-300">{activity.user?.name || "System"}</p>
          <p className="truncate text-xs text-gray-500">
            {activity.action.replace(/_/g, " ")} • {activity.targetType}
          </p>
        </div>
      </div>
      <span className="flex-shrink-0 text-xs text-gray-500 sm:text-right">
        {new Date(activity.createdAt).toLocaleString()}
      </span>
    </div>
  </motion.div>
));

ActivityItem.displayName = "ActivityItem";

const MatchItem = memo(({ match }: { match: any }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ x: 4 }}
    className="will-change-transform rounded-xl border border-white/5 bg-gray-900/30 p-3 transition-colors hover:border-indigo-500/20 hover:bg-gray-900/60"
  >
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="truncate text-sm font-medium text-white">{match.homePlayer}</span>
        <span className="text-sm text-gray-500">vs</span>
        <span className="truncate text-sm font-medium text-white">{match.awayPlayer}</span>
        {match.score && (
          <span className="rounded-lg bg-white/10 px-2 py-1 text-sm font-bold text-white">
            {match.score}
          </span>
        )}
      </div>
      <span className="flex-shrink-0 text-xs text-gray-500">
        {new Date(match.date).toLocaleDateString()}
      </span>
    </div>
  </motion.div>
));

MatchItem.displayName = "MatchItem";

const InsightCard = memo(({ insight }: { insight: any }) => {
  const style = getInsightStyle(insight.type);
  const Icon = style.icon;
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className={`will-change-transform rounded-xl border p-4 ${style.border} ${style.bg} transition-colors hover:bg-opacity-20`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.color}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{insight.title}</p>
          <p className="mt-1 text-xs text-gray-400">{insight.description}</p>
          {insight.action && insight.link && (
            <a
              href={insight.link}
              className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              {insight.action} <ChevronRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
});

InsightCard.displayName = "InsightCard";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Tab Button Component                            */
/* -------------------------------------------------------------------------- */

const TabButton = memo(({ tab, activeTab, setActiveTab }: { tab: string; activeTab: string; setActiveTab: (tab: any) => void }) => {
  const labels: Record<string, string> = {
    overview: "📊 Overview",
    revenue: "💰 Revenue",
    performance: "🏆 Performance",
    insights: "🧠 Insights",
  };
  return (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`min-h-[44px] flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all will-change-transform ${
        activeTab === tab
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {labels[tab] || tab}
    </button>
  );
});

TabButton.displayName = "TabButton";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "revenue" | "performance" | "insights"
  >("overview");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchAnalytics();
    }
  }, [session]);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/admin/analytics");
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, []);

  const stats = useMemo(() => [
    {
      name: "Total Users",
      value: data?.overview?.totalUsers || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      accent: "text-blue-400",
      hint: "Registered accounts",
    },
    {
      name: "Active Users (30d)",
      value: data?.overview?.activeUsers || 0,
      icon: Activity,
      color: "from-green-500 to-emerald-500",
      accent: "text-green-400",
      hint: "Recent platform activity",
    },
    {
      name: "New Users (7d)",
      value: data?.overview?.newUsersThisWeek || 0,
      icon: UserPlus,
      color: "from-purple-500 to-pink-500",
      accent: "text-purple-400",
      hint: "Fresh signups",
    },
    {
      name: "Total Matches",
      value: data?.overview?.totalFixtures || 0,
      icon: Calendar,
      color: "from-indigo-500 to-blue-500",
      accent: "text-indigo-400",
      hint: "Fixtures created",
    },
    {
      name: "Completion Rate",
      value: `${data?.overview?.completionRate || 0}%`,
      icon: CheckCircle,
      color: "from-green-500 to-teal-500",
      accent: "text-teal-400",
      hint: "Match completion",
    },
    {
      name: "Pending Results",
      value: data?.overview?.pendingResults || 0,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
      accent: "text-yellow-400",
      hint: "Awaiting approval",
    },
    {
      name: "Tournaments",
      value: data?.overview?.totalTournaments || 0,
      icon: Trophy,
      color: "from-amber-500 to-yellow-500",
      accent: "text-amber-400",
      hint: `${data?.overview?.activeTournaments || 0} active`,
    },
    {
      name: "Awards Given",
      value: data?.overview?.totalAwards || 0,
      icon: Award,
      color: "from-rose-500 to-red-500",
      accent: "text-rose-400",
      hint: "Total recognitions",
    },
  ], [data]);

  const growthData = {
    labels: data?.userGrowth?.map((item: any) =>
      new Date(item.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: "New Users",
        data: data?.userGrowth?.map((item: any) => item.count) || [],
        borderColor: "#818cf8",
        backgroundColor: (ctx: ScriptableContext<"line">) =>
          makeAreaGradient(ctx, [99, 102, 241]),
        pointBackgroundColor: "#818cf8",
        pointBorderColor: "rgba(255,255,255,0.9)",
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 12,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const scheduledMatches = Math.max(
    0,
    (data?.overview?.totalFixtures || 0) -
      (data?.overview?.completedFixtures || 0) -
      (data?.overview?.pendingResults || 0)
  );

  const matchStatusData = {
    labels: ["Completed", "Pending", "Scheduled"],
    datasets: [
      {
        data: [
          data?.overview?.completedFixtures || 0,
          data?.overview?.pendingResults || 0,
          scheduledMatches,
        ],
        backgroundColor: ["#22c55e", "#eab308", "#64748b"],
        hoverBackgroundColor: ["#16a34a", "#ca8a04", "#475569"],
        borderColor: "rgba(15,23,42,0.6)",
        borderWidth: 2,
        borderRadius: 6,
        spacing: 3,
        hoverOffset: 8,
      },
    ],
  };

  const revenueChartData = {
    labels: data?.revenueData?.map((item) =>
      new Date(item.date).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: "Revenue",
        data: data?.revenueData?.map((item) => item.amount) || [],
        borderColor: "#34d399",
        backgroundColor: (ctx: ScriptableContext<"line">) =>
          makeAreaGradient(ctx, [16, 185, 129]),
        pointBackgroundColor: "#34d399",
        pointBorderColor: "rgba(255,255,255,0.9)",
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 12,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
      },
      {
        label: "Forecast",
        data: data?.revenueData?.map((item) => item.forecast || null) || [],
        borderColor: "#fbbf24",
        backgroundColor: "rgba(251, 191, 36, 0.08)",
        borderDash: [6, 6],
        pointBackgroundColor: "#fbbf24",
        pointBorderColor: "rgba(255,255,255,0.9)",
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 12,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const lineOptions = buildLineOptions();
  const revenueOptions = buildLineOptions({ currency: true, showLegend: true });

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Brain className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading analytics...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your data</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  if (!data) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Brain className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading analytics data...</p>
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
        className="space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
                <Brain className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  🧠 Advanced Analytics
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Real-time insights, revenue tracking, and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 sm:w-auto"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl"
        >
          {(["overview", "revenue", "performance", "insights"] as const).map((tab) => (
            <TabButton key={tab} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
        </motion.div>

        {/* Stats Grid - Always Visible */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.name} stat={stat} />
          ))}
        </motion.div>

        {/* ============================================================ */}
        {/* TAB: OVERVIEW */}
        {/* ============================================================ */}
        {activeTab === "overview" && (
          <>
            {/* Charts Row */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6"
            >
              {/* User Growth Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
              >
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <LineChart className="h-4 w-4 text-indigo-400" />
                  User Growth (Last 30 Days)
                </h3>
                <div className="h-[260px] min-w-0 sm:h-[300px]">
                  <Line data={growthData} options={lineOptions} />
                </div>
              </motion.div>

              {/* Match Status Chart */}
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
              >
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  Match Status Distribution
                </h3>
                <div className="flex h-[260px] items-center justify-center sm:h-[300px]">
                  <div className="h-[210px] w-[210px] sm:h-[230px] sm:w-[230px]">
                    <Doughnut data={matchStatusData} options={doughnutOptions} />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Top Players */}
            {data?.topPlayers && data.topPlayers.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
              >
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  Top Players
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-gray-900/60">
                      <tr className="text-left text-gray-400">
                        <th className="sticky left-0 z-10 bg-gray-900/95 px-4 py-3 font-medium backdrop-blur-xl">#</th>
                        <th className="sticky left-12 z-10 bg-gray-900/95 px-4 py-3 font-medium backdrop-blur-xl">Player</th>
                        <th className="px-4 py-3 text-center font-medium">Points</th>
                        <th className="px-4 py-3 text-center font-medium">W</th>
                        <th className="px-4 py-3 text-center font-medium">D</th>
                        <th className="px-4 py-3 text-center font-medium">L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.topPlayers.map((player, index) => (
                        <tr key={player.id} className="text-gray-300 transition-colors hover:bg-white/[0.03]">
                          <td className="sticky left-0 z-10 bg-gray-800/95 px-4 py-3 backdrop-blur-xl">
                            <span className="font-bold text-white">{rankMedal(index)}</span>
                          </td>
                          <td className="sticky left-12 z-10 bg-gray-800/95 px-4 py-3 text-white backdrop-blur-xl">
                            <span className="block max-w-[180px] truncate">{player.name}</span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-white">{player.points}</td>
                          <td className="px-4 py-3 text-center text-green-400">{player.wins}</td>
                          <td className="px-4 py-3 text-center text-yellow-400">{player.draws}</td>
                          <td className="px-4 py-3 text-center text-red-400">{player.losses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Recent Activity & Matches */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {data?.recentActivity && data.recentActivity.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    Recent Activity
                    <span className="rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                      {data.recentActivity.length}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 will-change-transform">
                    {data.recentActivity.slice(0, 10).map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </motion.div>
              )}

              {data?.recentMatches && data.recentMatches.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    Recent Matches
                    <span className="rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                      {data.recentMatches.length}
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 will-change-transform">
                    {data.recentMatches.map((match) => (
                      <MatchItem key={match.id} match={match} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB: REVENUE */}
        {/* ============================================================ */}
        {activeTab === "revenue" && (
          <motion.div variants={containerVariants} className="space-y-5">
            {/* Revenue Chart */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Revenue & Forecast
                </h3>
                <span className="text-xs text-gray-500">
                  Total:{" "}
                  {formatCurrency(
                    data?.revenueData?.reduce((sum, d) => sum + d.amount, 0) || 0
                  )}
                </span>
              </div>
              <div className="h-[300px] min-w-0">
                <Line data={revenueChartData} options={revenueOptions} />
              </div>
              <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-4 rounded bg-emerald-400" />
                  Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-4 rounded border-2 border-dashed border-yellow-400" />
                  Forecast
                </span>
              </div>
            </motion.div>

            {/* Revenue Stats */}
            {data?.revenueData && data.revenueData.length > 0 && (
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {[
                  {
                    label: "Total Revenue",
                    value: formatCurrency(data.revenueData.reduce((sum, d) => sum + d.amount, 0)),
                    icon: DollarSign,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Total Payments",
                    value: data.revenueData.reduce((sum, d) => sum + d.count, 0),
                    icon: CheckCircle,
                    color: "text-white",
                  },
                  {
                    label: "Days with Revenue",
                    value: data.revenueData.filter((d) => d.amount > 0).length,
                    icon: Calendar,
                    color: "text-white",
                  },
                  {
                    label: "Average Daily",
                    value: formatCurrency(
                      data.revenueData.reduce((sum, d) => sum + d.amount, 0) /
                        (data.revenueData.filter((d) => d.amount > 0).length || 1)
                    ),
                    icon: TrendingUp,
                    color: "text-indigo-400",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/30"
                    >
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB: PERFORMANCE */}
        {/* ============================================================ */}
        {activeTab === "performance" && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
          >
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Season Performance
              <span className="rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                {data?.seasonPerformance?.length || 0} seasons
              </span>
            </h3>
            {data?.seasonPerformance && data.seasonPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
                      <th className="pb-2 pr-2 font-medium">Season</th>
                      <th className="pb-2 pr-2 text-center font-medium">Matches</th>
                      <th className="pb-2 pr-2 text-center font-medium">Players</th>
                      <th className="pb-2 pr-2 text-center font-medium">Revenue</th>
                      <th className="pb-2 pr-2 text-center font-medium">Completion</th>
                      <th className="pb-2 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.seasonPerformance.map((season) => (
                      <tr key={season.seasonId} className="transition-colors hover:bg-white/5">
                        <td className="py-2.5 pr-2 font-medium text-white">
                          {season.seasonName}
                          {season.isActive && (
                            <span className="ml-2 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[8px] text-green-400">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-gray-300">
                          {season.completedMatches}/{season.matches}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-gray-300">{season.players}</td>
                        <td className="py-2.5 pr-2 text-center text-emerald-400">
                          {formatCurrency(season.revenue)}
                        </td>
                        <td className="py-2.5 pr-2 text-center">
                          <span
                            className={`font-medium ${
                              season.completionRate > 70 ? "text-green-400" : "text-yellow-400"
                            }`}
                          >
                            {season.completionRate}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              season.status === "LIVE"
                                ? "bg-green-500/15 text-green-400"
                                : season.status === "ENDED"
                                ? "bg-gray-500/15 text-gray-400"
                                : "bg-yellow-500/15 text-yellow-400"
                            }`}
                          >
                            {season.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Trophy className="mx-auto h-10 w-10 text-gray-600" />
                <p className="mt-2 text-sm">No season data available</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB: INSIGHTS */}
        {/* ============================================================ */}
        {activeTab === "insights" && (
          <motion.div variants={containerVariants} className="space-y-4">
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  AI Insights & Recommendations
                </h3>
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] text-amber-300">
                  Live
                </span>
                {data?.insights && data.insights.length > 0 && (
                  <span className="rounded-full bg-gray-700/30 px-2 py-0.5 text-[10px] text-gray-400">
                    {data.insights.length}
                  </span>
                )}
              </div>

              {data?.insights && data.insights.length > 0 ? (
                <div className="space-y-3">
                  {data.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Brain className="mx-auto h-10 w-10 text-gray-600" />
                  <p className="mt-2 text-sm">No insights available</p>
                  <p className="text-xs text-gray-600">Insights will appear as data grows</p>
                </div>
              )}
            </motion.div>

            {/* Quick Stats Summary */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {[
                {
                  label: "Platform Health",
                  value: data?.overview?.completionRate && data.overview.completionRate > 70
                    ? "✅ Good"
                    : "⚠️ Needs Attention",
                  color: data?.overview?.completionRate && data.overview.completionRate > 70
                    ? "text-green-400"
                    : "text-yellow-400",
                },
                {
                  label: "Engagement",
                  value: data?.overview?.activeUsers && data.overview.totalUsers
                    ? `${Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100)}%`
                    : "0%",
                  color: "text-white",
                },
                {
                  label: "Total Revenue",
                  value: formatCurrency(
                    data?.revenueData?.reduce((sum, d) => sum + d.amount, 0) || 0
                  ),
                  color: "text-emerald-400",
                },
                {
                  label: "Active Seasons",
                  value: data?.overview?.totalSeasons || 0,
                  color: "text-indigo-400",
                },
              ].map((item, index) => {
                const Icon = index === 0 ? Shield : index === 1 ? Users : index === 2 ? DollarSign : Trophy;
                return (
                  <motion.div
                    key={item.label}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/30"
                  >
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}