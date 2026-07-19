"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Eye,
  BarChart3,
  ArrowRight,
  Wallet,
  UserPlus,
  CreditCard,
  Crown,
  Medal,
  Award,
  Landmark,
  Sparkles,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface CompetitionStats {
  total: number;
  paid: number;
  unpaid: number;
  free: number;
}

interface CompetitionData {
  players: any[];
  stats: CompetitionStats;
  settings: {
    paymentRequired: boolean;
    entryFee: number;
  };
}

/* ---------------- Shared animation variants ---------------- */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

/* ---------------- Decorative background ---------------- */
function DecorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

export default function AdminCompetitionPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [seasons, setSeasons] = useState<any[]>([]);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchData();
    }
  }, [selectedSeasonId]);

  async function fetchSeasons() {
    try {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to fetch seasons");
      const data = await res.json();
      setSeasons(data);
      if (data.length > 0) {
        setSelectedSeasonId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      toast.error("Failed to load seasons");
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/competition/players?seasonId=${selectedSeasonId}`
      );
      if (!res.ok) throw new Error("Failed to fetch competition data");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching competition data:", error);
      toast.error("Failed to load competition data");
      // ✅ Set empty data on error
      setData({
        players: [],
        stats: { total: 0, paid: 0, unpaid: 0, free: 0 },
        settings: { paymentRequired: false, entryFee: 0 },
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
            <p className="text-gray-400">Loading competition data...</p>
          </div>
        </div>
      </>
    );
  }

  const stats = data?.stats || { total: 0, paid: 0, unpaid: 0, free: 0 };
  const settings = data?.settings || { paymentRequired: false, entryFee: 0 };
  const players = data?.players || [];

  // ✅ Calculate prize pool
  const totalPrizePool = stats.paid * settings.entryFee;
  const championReward = totalPrizePool * 0.5;
  const runnerReward = totalPrizePool * 0.25;
  const topScorerReward = totalPrizePool * 0.1;
  const platformReserve = totalPrizePool * 0.15;

  const paidPct =
    stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

  /* ---------- Stat cards config ---------- */
  const statCards = [
    {
      label: "Total Players",
      value: stats.total,
      icon: Users,
      accent: "text-blue-400",
      ring: "border-blue-500/20",
      glow: "from-blue-500/20",
      hint: "All registered players",
    },
    {
      label: "✅ Paid",
      value: stats.paid,
      icon: CheckCircle,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
      hint: `${paidPct}% of players`,
    },
    {
      label: "❌ Unpaid",
      value: stats.unpaid,
      icon: AlertCircle,
      accent: "text-red-400",
      ring: "border-red-500/20",
      glow: "from-red-500/20",
      hint: "Awaiting payment",
    },
    {
      label: "💰 Prize Pool",
      value: `KES ${totalPrizePool.toLocaleString()}`,
      icon: Wallet,
      accent: "text-amber-400",
      ring: "border-amber-500/20",
      glow: "from-amber-500/20",
      hint: `${stats.paid} × KES ${settings.entryFee}`,
    },
  ];

  /* ---------- Prize distribution tiers ---------- */
  const prizeTiers = [
    {
      label: "Champion",
      value: championReward,
      pct: "50%",
      icon: Crown,
      accent: "text-yellow-400",
      bar: "bg-yellow-500",
      width: "50%",
    },
    {
      label: "Runner Up",
      value: runnerReward,
      pct: "25%",
      icon: Medal,
      accent: "text-gray-300",
      bar: "bg-gray-400",
      width: "25%",
    },
    {
      label: "Top Scorer",
      value: topScorerReward,
      pct: "10%",
      icon: Award,
      accent: "text-blue-400",
      bar: "bg-blue-400",
      width: "10%",
    },
    {
      label: "Platform",
      value: platformReserve,
      pct: "15%",
      icon: Landmark,
      accent: "text-gray-400",
      bar: "bg-gray-600",
      width: "15%",
    },
  ];

  /* ---------- Quick actions ---------- */
  const quickActions = [
    {
      label: "View All Players",
      desc: "See all players and their status",
      href: `/admin/competition/players?seasonId=${selectedSeasonId}`,
      icon: Eye,
      accent: "text-indigo-400",
    },
    {
      label: "Add Players",
      desc: "Add players to the season",
      href: "/admin/league",
      icon: UserPlus,
      accent: "text-blue-400",
    },
    {
      label: "Payment Settings",
      desc: "Toggle payment requirements",
      href: "/admin/settings/league",
      icon: CreditCard,
      accent: "text-amber-400",
    },
  ];

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 sm:space-y-6"
      >
        {/* ---------- Header ---------- */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-amber-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30 sm:h-12 sm:w-12">
                <Trophy className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  🏆 Competition Management
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Manage players, payments, and competition settings
                </p>
              </div>
            </div>

            {/* Season selector + refresh */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1 sm:flex-none">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-gray-800/70 py-2 pl-9 pr-9 text-sm text-white backdrop-blur-xl transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:w-auto"
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} {season.isActive ? "⭐" : ""}
                    </option>
                  ))}
                </select>
                <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-500" />
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={fetchData}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-gray-800/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition-all hover:border-indigo-500/40 hover:bg-gray-700/70"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ---------- Stats Cards ---------- */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`group relative min-h-[44px] overflow-hidden rounded-2xl border bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40 ${stat.ring}`}
            >
              <div
                className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity group-hover:opacity-70`}
              />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-gray-400 sm:text-sm">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-1 truncate text-xl font-bold sm:text-2xl ${stat.accent}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${stat.accent}`}
                >
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="relative mt-2 truncate text-[11px] text-gray-500">
                {stat.hint}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ---------- Settings Summary ---------- */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-gray-400">Payment Settings</p>
              <p className="mt-0.5 font-medium text-white">
                {settings.paymentRequired ? (
                  <span className="text-yellow-400">🔴 Payment Required</span>
                ) : (
                  <span className="text-green-400">🟢 Free Access</span>
                )}
                {settings.paymentRequired && (
                  <span className="ml-2 text-sm text-gray-400">
                    • Entry Fee: KES {settings.entryFee}
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/admin/settings/league"
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 text-sm font-medium text-indigo-300 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/20 sm:justify-start"
            >
              <Settings className="h-4 w-4" />
              Manage Settings
            </Link>
          </div>
        </motion.div>

        {/* ---------- Prize Pool Distribution ---------- */}
        <AnimatePresence mode="wait">
          {settings.paymentRequired && stats.paid > 0 ? (
            <motion.div
              key="prize-pool"
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                <BarChart3 className="h-5 w-5 text-amber-400" />
                Prize Pool Distribution
              </h2>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {prizeTiers.map((tier) => (
                  <motion.div
                    key={tier.label}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="rounded-xl border border-white/5 bg-gray-900/50 p-4 text-center shadow-lg"
                  >
                    <div className="mb-1 flex items-center justify-center gap-2">
                      <tier.icon className={`h-5 w-5 ${tier.accent}`} />
                      <p className="text-xs text-gray-400">{tier.label}</p>
                    </div>
                    <p className={`text-lg font-bold sm:text-xl ${tier.accent}`}>
                      KES {tier.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{tier.pct}</p>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                {prizeTiers.map((tier) => (
                  <div
                    key={tier.label}
                    className={`h-full ${tier.bar}`}
                    style={{ width: tier.width }}
                  />
                ))}
              </div>

              <p className="mt-3 text-center text-xs text-gray-500">
                Total Prize Pool:{" "}
                <span className="font-bold text-green-400">
                  KES {totalPrizePool.toLocaleString()}
                </span>{" "}
                from <span className="font-bold text-white">{stats.paid}</span>{" "}
                paid players
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="prize-empty"
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white sm:text-lg">
                <BarChart3 className="h-5 w-5 text-amber-400" />
                Prize Pool Distribution
              </h2>
              <div className="py-8 text-center">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                  <Wallet className="h-7 w-7 text-gray-500" />
                </span>
                <p className="px-4 text-gray-400">
                  {!settings.paymentRequired
                    ? "Payment is not required for this season"
                    : "No paid players yet. Prize pool will appear once players pay."}
                </p>
                {!settings.paymentRequired && (
                  <Link
                    href="/admin/settings/league"
                    className="mt-3 inline-flex min-h-[44px] items-center text-sm text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Enable Payment in Settings →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- Quick Actions ---------- */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {quickActions.map((action) => (
            <motion.div key={action.label} variants={itemVariants}>
              <Link
                href={action.href}
                className="group flex min-h-[44px] items-center gap-3 rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-gray-700/40 hover:shadow-indigo-500/10"
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${action.accent}`}
                >
                  <action.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {action.label}
                  </p>
                  <p className="truncate text-xs text-gray-400">{action.desc}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-gray-500 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}
