"use client";

import { useEffect, useState, useMemo, useCallback,memo } from "react";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Users,
  Calendar,
  Award,
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  CheckCircle,
  XCircle,
  MinusCircle,
  Star,
  Crown,
  Sparkles,
  ChevronDown,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Minus,
  Zap,
  Flame,
  Medal,
  ArrowUpRight,
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
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import toast from "react-hot-toast";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  type Variants,
} from "framer-motion";

// Register ChartJS components
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

interface PlayerStats {
  profile: {
    username: string;
    profilePicture: string;
    trustScore: number;
    verifiedBadge: boolean;
  };
  seasonStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    winRate: number;
    season: {
      id: string;
      name: string;
      status: string;
    };
  } | null;
  careerStats: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    winRate: number;
  };
  awards: {
    id: string;
    name: string;
    category: string;
    icon: string;
    description: string;
    awardedAt: string;
    season: { name: string };
  }[];
  seasons: {
    id: string;
    name: string;
    status: string;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
  }[];
  totalSeasons: number;
}

interface MatchHistory {
  matches: {
    id: string;
    opponentName: string;
    opponentId: string;
    isHome: boolean;
    scheduledDate: string;
    status: string;
    result: string;
    score: string;
    myScore: number;
    opponentScore: number;
    seasonName: string;
    approved: boolean;
  }[];
  summary: {
    total: number;
    completed: number;
    wins: number;
    draws: number;
    losses: number;
    pending: number;
    winRate: number;
  };
  form: string;
}

interface H2HStats {
  opponentId: string;
  opponentName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  lastMatch: string | null;
  winRate: number;
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
/*                         Animated number counter                            */
/* -------------------------------------------------------------------------- */

function AnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );
  const [display, setDisplay] = useState(decimals > 0 ? "0.00" : "0");

  useEffect(() => {
    const controls = animate(count, value || 0, {
      duration: 1,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value]);

  return (
    <span>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Trend indicator helper                            */
/* -------------------------------------------------------------------------- */

function TrendBadge({ winRate }: { winRate: number }) {
  let icon = <Minus className="h-3 w-3" />;
  let label = "Steady";
  let color = "text-gray-300 bg-gray-500/15 ring-gray-500/30";

  if (winRate >= 70) {
    icon = <TrendingUp className="h-3 w-3" />;
    label = "Excellent";
    color = "text-emerald-300 bg-emerald-500/15 ring-emerald-500/30";
  } else if (winRate >= 50) {
    icon = <TrendingUp className="h-3 w-3" />;
    label = "Strong";
    color = "text-green-300 bg-green-500/15 ring-green-500/30";
  } else if (winRate >= 33) {
    icon = <Minus className="h-3 w-3" />;
    label = "Average";
    color = "text-yellow-300 bg-yellow-500/15 ring-yellow-500/30";
  } else {
    icon = <TrendingDown className="h-3 w-3" />;
    label = "Building";
    color = "text-red-300 bg-red-500/15 ring-red-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const HeroStat = memo(({ stat }: { stat: any }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="will-change-transform"
    >
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
        <div
          className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40`}
        />
        <div className="relative flex items-start justify-between">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.glow}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </span>
          <Sparkles className="h-4 w-4 text-white/20" />
        </div>
        <p className="relative mt-4 text-3xl font-extrabold text-white">
          <AnimatedCounter value={stat.value} suffix={stat.suffix} />
        </p>
        <p className="relative mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          {stat.name}
        </p>
      </div>
    </motion.div>
  );
});

HeroStat.displayName = "HeroStat";

const PerfCard = memo(({
  icon: Icon,
  label,
  value,
  suffix = "",
  accent,
  ring,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  ring: string;
}) => (
  <motion.div
    variants={statCardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="will-change-transform"
  >
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-xl backdrop-blur-xl ring-1 ${ring}`}>
      <span className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-xl font-bold text-white">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </motion.div>
));

PerfCard.displayName = "PerfCard";

const AwardChip = memo(({ award, index }: { award: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.05 * index, type: "spring", stiffness: 300 }}
    whileHover={{ y: -2 }}
    className="flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 shadow-md shadow-yellow-500/10"
  >
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500">
      <Star className="h-3.5 w-3.5 text-white" />
    </span>
    <span className="text-sm font-medium text-white">{award.name}</span>
    <span className="text-xs text-gray-400">• {award.season.name}</span>
  </motion.div>
));

AwardChip.displayName = "AwardChip";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-3xl"
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
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function StatisticsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistory | null>(null);
  const [h2hStats, setH2hStats] = useState<H2HStats[]>([]);
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const seasonParam = selectedSeason !== "all" ? `?seasonId=${selectedSeason}` : "";

      const [statsRes, matchesRes, h2hRes] = await Promise.all([
        fetch(`/api/statistics/player${seasonParam}`),
        fetch(`/api/statistics/matches${seasonParam}`),
        fetch(`/api/statistics/h2h${seasonParam}`),
      ]);

      const statsData = await statsRes.json();
      setStats(statsData);

      if (statsData.seasons) {
        setSeasons(statsData.seasons.map((s: any) => ({ id: s.id, name: s.name })));
      }

      const matchesData = await matchesRes.json();
      setMatchHistory(matchesData);

      const h2hData = await h2hRes.json();
      setH2hStats(h2hData);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, [selectedSeason]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const currentSeasonStats = stats?.seasonStats;

  const played = currentSeasonStats?.played ?? stats?.careerStats.matches ?? 0;
  const wins = currentSeasonStats?.wins ?? stats?.careerStats.wins ?? 0;
  const draws = currentSeasonStats?.draws ?? stats?.careerStats.draws ?? 0;
  const losses = currentSeasonStats?.losses ?? stats?.careerStats.losses ?? 0;
  const points = currentSeasonStats?.points ?? stats?.careerStats.points ?? 0;
  const winRate = currentSeasonStats?.winRate ?? stats?.careerStats.winRate ?? 0;
  const goalsFor = currentSeasonStats?.goalsFor ?? stats?.careerStats.goalsFor ?? 0;
  const goalsAgainst = currentSeasonStats?.goalsAgainst ?? stats?.careerStats.goalsAgainst ?? 0;
  const goalDifference = currentSeasonStats?.goalDifference ?? stats?.careerStats.goalDifference ?? 0;
  const goalsPerMatch = played > 0 ? goalsFor / played : 0;

  const performanceData = {
    labels: matchHistory?.matches.slice(0, 10).map((m) => new Date(m.scheduledDate).toLocaleDateString()).reverse() || [],
    datasets: [
      {
        label: "Goals Scored",
        data: matchHistory?.matches.slice(0, 10).map((m) => m.myScore || 0).reverse() || [],
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#818cf8",
        pointBorderColor: "#fff",
        pointRadius: 3,
      },
      {
        label: "Goals Conceded",
        data: matchHistory?.matches.slice(0, 10).map((m) => m.opponentScore || 0).reverse() || [],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#f87171",
        pointBorderColor: "#fff",
        pointRadius: 3,
      },
    ],
  };

  const resultData = {
    labels: ["Wins", "Draws", "Losses"],
    datasets: [
      {
        data: [matchHistory?.summary.wins || 0, matchHistory?.summary.draws || 0, matchHistory?.summary.losses || 0],
        backgroundColor: ["#22C55E", "#EAB308", "#EF4444"],
        borderColor: ["#16a34a", "#ca8a04", "#dc2626"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const totalGoals = goalsFor + goalsAgainst;
  const gfPercent = totalGoals > 0 ? (goalsFor / totalGoals) * 100 : 50;
  const gaPercent = totalGoals > 0 ? (goalsAgainst / totalGoals) * 100 : 50;

  const heroStats = useMemo(
    () => [
      {
        name: "Matches",
        value: played,
        icon: Activity,
        gradient: "from-blue-500 to-cyan-500",
        glow: "shadow-blue-500/40",
        accent: "text-blue-400",
      },
      {
        name: "Wins",
        value: wins,
        icon: CheckCircle,
        gradient: "from-emerald-500 to-green-500",
        glow: "shadow-emerald-500/40",
        accent: "text-emerald-400",
      },
      {
        name: "Goals For",
        value: goalsFor,
        icon: Target,
        gradient: "from-indigo-500 to-purple-500",
        glow: "shadow-indigo-500/40",
        accent: "text-indigo-400",
      },
      {
        name: "Win Rate",
        value: winRate,
        suffix: "%",
        icon: TrendingUp,
        gradient: "from-amber-500 to-orange-500",
        glow: "shadow-amber-500/40",
        accent: "text-amber-400",
      },
    ],
    [played, wins, goalsFor, winRate]
  );

  const perfStats = useMemo(() => [
    { label: "Matches", value: played, icon: Activity, accent: "text-blue-400", ring: "ring-blue-500/20" },
    { label: "Wins", value: wins, icon: CheckCircle, accent: "text-emerald-400", ring: "ring-emerald-500/20" },
    { label: "Draws", value: draws, icon: MinusCircle, accent: "text-yellow-400", ring: "ring-yellow-500/20" },
    { label: "Losses", value: losses, icon: XCircle, accent: "text-red-400", ring: "ring-red-500/20" },
    { label: "Points", value: points, icon: Trophy, accent: "text-amber-400", ring: "ring-amber-500/20" },
    { label: "Win Rate", value: winRate, suffix: "%", icon: TrendingUp, accent: "text-green-400", ring: "ring-green-500/20" },
  ], [played, wins, draws, losses, points, winRate]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <BarChart3 className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading statistics...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Crunching your numbers</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
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
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">📊 Player Statistics</h1>
              <p className="mt-1 text-gray-400">Track your performance and progress</p>
            </div>
          </div>

          {/* Season Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
            <Calendar className="ml-1 h-4 w-4 text-gray-400" />
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="min-h-[44px] appearance-none rounded-lg border border-white/10 bg-gray-900/60 px-4 py-2 pr-10 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="all">All Seasons</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {heroStats.map((stat) => (
            <HeroStat key={stat.name} stat={stat} />
          ))}
        </motion.div>

        {/* Performance Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {perfStats.map((stat) => (
            <PerfCard key={stat.label} {...stat} />
          ))}
        </motion.div>

        {/* Goals Stats */}
        <motion.div variants={containerVariants} className="grid gap-3 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/30">
                <Target className="h-5 w-5 text-blue-400" />
              </span>
              <p className="text-3xl font-extrabold text-blue-400">
                <AnimatedCounter value={goalsFor} />
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-400">Goals For</p>
            <p className="text-xs text-gray-500">{goalsPerMatch.toFixed(2)} per match</p>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/30">
                <Shield className="h-5 w-5 text-red-400" />
              </span>
              <p className="text-3xl font-extrabold text-red-400">
                <AnimatedCounter value={goalsAgainst} />
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-400">Goals Against</p>
            <p className="text-xs text-gray-500">{played > 0 ? (goalsAgainst / played).toFixed(2) : "0.00"} per match</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className={`rounded-2xl border bg-white/5 p-5 backdrop-blur-xl ${goalDifference >= 0 ? "border-emerald-500/20" : "border-red-500/20"}`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${goalDifference >= 0 ? "bg-emerald-500/15 ring-emerald-500/30" : "bg-red-500/15 ring-red-500/30"}`}>
                {goalDifference >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
              </span>
              <p className={`text-3xl font-extrabold ${goalDifference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {goalDifference >= 0 ? "+" : ""}<AnimatedCounter value={Math.abs(goalDifference)} />
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-400">Goal Difference</p>
            <p className="text-xs text-gray-500">{goalsPerMatch.toFixed(2)} goals/match</p>
          </motion.div>
        </motion.div>

        {/* Attack vs Defense Bar */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              Attack vs Defense
            </h3>
            <span className="text-xs text-gray-500">{goalsFor} GF · {goalsAgainst} GA</span>
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-gray-900/60 ring-1 ring-white/10">
            <motion.div
              className="flex items-center justify-start bg-gradient-to-r from-blue-500 to-indigo-500 pl-2 text-[10px] font-bold text-white"
              initial={{ width: 0 }}
              animate={{ width: `${gfPercent}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              {gfPercent > 12 && `${Math.round(gfPercent)}%`}
            </motion.div>
            <motion.div
              className="flex items-center justify-end bg-gradient-to-r from-red-500 to-rose-500 pr-2 text-[10px] font-bold text-white"
              initial={{ width: 0 }}
              animate={{ width: `${gaPercent}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              {gaPercent > 12 && `${Math.round(gaPercent)}%`}
            </motion.div>
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Goals For
            </span>
            <span className="flex items-center gap-1 text-red-400">
              Goals Against <span className="h-2 w-2 rounded-full bg-red-500" />
            </span>
          </div>
        </motion.div>

        {/* Form Guide */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Activity className="h-4 w-4 text-indigo-400" />
                Recent Form
              </h3>
              <div className="flex gap-1.5">
                {(matchHistory?.form || "").split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 400, damping: 18 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ring-1 ${
                      letter === "W" ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30 shadow-md shadow-emerald-500/20" :
                      letter === "D" ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30" :
                      letter === "L" ? "bg-red-500/20 text-red-400 ring-red-500/30" :
                      "bg-gray-600/20 text-gray-400 ring-gray-500/30"
                    }`}
                  >
                    {letter}
                  </motion.span>
                ))}
                {!matchHistory?.form && <span className="text-xs text-gray-500">No recent matches</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                <span className="text-emerald-400">{matchHistory?.summary.wins || 0}W</span> -
                <span className="text-yellow-400">{matchHistory?.summary.draws || 0}D</span> -
                <span className="text-red-400">{matchHistory?.summary.losses || 0}L</span>
              </span>
              <TrendBadge winRate={winRate} />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span>Win Rate</span>
              <span className="font-semibold text-white">{winRate}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-900/60 ring-1 ring-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(winRate, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <LineChartIcon className="h-4 w-4 text-indigo-400" />
              Performance Trend
            </h3>
            <div className="h-[220px]">
              <Line data={performanceData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: "#9CA3AF", font: { size: 11 } } } },
                scales: {
                  x: { grid: { color: "rgba(55,65,81,0.4)" }, ticks: { color: "#9CA3AF", font: { size: 9 } } },
                  y: { grid: { color: "rgba(55,65,81,0.4)" }, ticks: { color: "#9CA3AF", font: { size: 10 } } },
                },
              }} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <PieChartIcon className="h-4 w-4 text-indigo-400" />
              Result Distribution
            </h3>
            <div className="flex h-[220px] items-center justify-center">
              <div className="h-[200px] w-[200px]">
                <Doughnut data={resultData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { color: "#9CA3AF", font: { size: 11 }, padding: 12 } } },
                  cutout: "62%",
                }} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Awards */}
        {stats?.awards && stats.awards.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.07] to-amber-500/[0.04] p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Crown className="h-4 w-4 text-yellow-400" />
              Awards & Achievements
            </h3>
            <div className="flex flex-wrap gap-3">
              {stats.awards.map((award, i) => (
                <AwardChip key={award.id} award={award} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Head-to-Head */}
        {h2hStats.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-indigo-400" />
              Head-to-Head Records
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="pb-3 font-medium">Opponent</th>
                    <th className="pb-3 text-center font-medium">Played</th>
                    <th className="pb-3 text-center font-medium">W</th>
                    <th className="pb-3 text-center font-medium">D</th>
                    <th className="pb-3 text-center font-medium">L</th>
                    <th className="pb-3 text-center font-medium">GF</th>
                    <th className="pb-3 text-center font-medium">GA</th>
                    <th className="pb-3 text-center font-medium">GD</th>
                    <th className="pb-3 text-center font-medium">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {h2hStats.slice(0, 10).map((stat) => (
                    <tr key={stat.opponentId} className="text-gray-300 transition-colors hover:bg-white/5">
                      <td className="py-3 font-medium text-white">{stat.opponentName}</td>
                      <td className="py-3 text-center">{stat.played}</td>
                      <td className="py-3 text-center text-emerald-400">{stat.wins}</td>
                      <td className="py-3 text-center text-yellow-400">{stat.draws}</td>
                      <td className="py-3 text-center text-red-400">{stat.losses}</td>
                      <td className="py-3 text-center">{stat.goalsFor}</td>
                      <td className="py-3 text-center">{stat.goalsAgainst}</td>
                      <td className={`py-3 text-center font-medium ${stat.goalDifference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stat.goalDifference >= 0 ? "+" : ""}{stat.goalDifference}
                      </td>
                      <td className="py-3 text-center text-blue-400">{stat.winRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Season History */}
        {stats?.seasons && stats.seasons.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Season History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="pb-3 font-medium">Season</th>
                    <th className="pb-3 text-center font-medium">P</th>
                    <th className="pb-3 text-center font-medium">W</th>
                    <th className="pb-3 text-center font-medium">D</th>
                    <th className="pb-3 text-center font-medium">L</th>
                    <th className="pb-3 text-center font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.seasons.map((s) => {
                    const isCurrent = currentSeasonStats?.season?.id === s.id || selectedSeason === s.id;
                    return (
                      <tr key={s.id} className={`transition-colors hover:bg-white/5 ${isCurrent ? "bg-indigo-500/[0.07]" : ""}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {isCurrent && <span className="h-2 w-2 rounded-full bg-indigo-400 shadow shadow-indigo-400/50" />}
                            <span className="font-medium text-white">{s.name}</span>
                            {s.status && <span className="rounded-full bg-gray-700/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400 ring-1 ring-white/10">{s.status}</span>}
                          </div>
                        </td>
                        <td className="py-3 text-center text-gray-300">{s.played}</td>
                        <td className="py-3 text-center text-emerald-400">{s.wins}</td>
                        <td className="py-3 text-center text-yellow-400">{s.draws}</td>
                        <td className="py-3 text-center text-red-400">{s.losses}</td>
                        <td className="py-3 text-center font-bold text-white">{s.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Career Summary */}
        {stats?.totalSeasons && stats.totalSeasons > 1 && selectedSeason === "all" && (
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <h3 className="relative mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Career Summary
            </h3>
            <div className="relative grid grid-cols-2 gap-4 text-center md:grid-cols-4">
              {[
                { label: "Total Matches", value: stats.careerStats.matches },
                { label: "Total Wins", value: stats.careerStats.wins },
                { label: "Total Points", value: stats.careerStats.points },
                { label: "Seasons Played", value: stats.totalSeasons },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-3xl font-extrabold text-white"><AnimatedCounter value={item.value} /></p>
                  <p className="mt-1 text-xs text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Matches */}
        {matchHistory?.matches && matchHistory.matches.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Recent Matches
            </h3>
            <div className="space-y-2">
              {matchHistory.matches.slice(0, 10).map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  whileHover={{ x: 4 }}
                  className="flex min-h-[44px] items-center justify-between rounded-xl border border-white/5 bg-gray-900/40 p-3 transition-colors hover:bg-gray-900/70"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ring-1 ${
                      match.result === "WIN" ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30" :
                      match.result === "DRAW" ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30" :
                      match.result === "LOSS" ? "bg-red-500/20 text-red-400 ring-red-500/30" :
                      "bg-gray-500/20 text-gray-400 ring-gray-500/30"
                    }`}>
                      {match.result}
                    </span>
                    <span className="text-sm text-white">vs {match.opponentName}</span>
                    {match.score && (
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-sm font-bold text-white ring-1 ring-white/10">
                        {match.score}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{match.isHome ? "🏠 Home" : "✈️ Away"}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(match.scheduledDate).toLocaleDateString()}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}