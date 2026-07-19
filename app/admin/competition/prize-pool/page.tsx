"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import {
  Trophy,
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Crown,
  Medal,
  Save,
  RefreshCw,
  Edit2,
  X,
  AlertCircle,
  Calendar,
  Percent,
  BarChart3,
  Wallet,
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  Star,
  Target,
  Landmark,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface PrizePool {
  id: string;
  seasonId: string;
  totalCollected: number;
  entryFee: number;
  registeredPlayers: number;
  championReward: number;
  runnerReward: number;
  topScorerReward: number;
  platformReserve: number;
  updatedAt: string;
  season: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface Season {
  id: string;
  name: string;
  status: string;
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

const StatCard = memo(({ stat }: { stat: { label: string; value: string | number; icon: any; color?: string } }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="will-change-transform"
    >
      <div className="group relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40">
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color || "text-white"}`}>{stat.value}</p>
          </div>
          <Icon className={`h-8 w-8 ${stat.color || "text-white/50"}`} />
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

const PrizeTierCard = memo(({
  icon: Icon,
  label,
  amount,
  percentage,
  color,
  bg,
}: {
  icon: any;
  label: string;
  amount: number;
  percentage: number;
  color: string;
  bg: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={`rounded-xl border p-4 text-center ${bg}`}
  >
    <div className="mb-1 flex items-center justify-center gap-2">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
    <p className={`text-lg font-bold sm:text-xl ${color}`}>
      KES {amount.toLocaleString()}
    </p>
    <p className="text-xs text-gray-500">{percentage}%</p>
  </motion.div>
));

PrizeTierCard.displayName = "PrizeTierCard";

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
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"
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

export default function AdminPrizePoolPage() {
  const { data: session } = useSession();
  const [prizePool, setPrizePool] = useState<PrizePool | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    entryFee: 0,
    championPercent: 50,
    runnerPercent: 25,
    topScorerPercent: 10,
    platformPercent: 15,
  });

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchPrizePool(selectedSeasonId);
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

  async function fetchPrizePool(seasonId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/competition/prize-pool?seasonId=${seasonId}`);
      if (!res.ok) throw new Error("Failed to fetch prize pool");
      const data = await res.json();
      setPrizePool(data);

      if (data) {
        setFormData({
          entryFee: data.entryFee || 0,
          championPercent: data.totalCollected > 0 ? Math.round((data.championReward / data.totalCollected) * 100) : 50,
          runnerPercent: data.totalCollected > 0 ? Math.round((data.runnerReward / data.totalCollected) * 100) : 25,
          topScorerPercent: data.totalCollected > 0 ? Math.round((data.topScorerReward / data.totalCollected) * 100) : 10,
          platformPercent: data.totalCollected > 0 ? Math.round((data.platformReserve / data.totalCollected) * 100) : 15,
        });
      }
    } catch (error) {
      console.error("Error fetching prize pool:", error);
      toast.error("Failed to load prize pool");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const totalPercent = formData.championPercent + formData.runnerPercent +
        formData.topScorerPercent + formData.platformPercent;

      if (totalPercent !== 100) {
        toast.error(`Percentages must total 100%. Currently: ${totalPercent}%`);
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/competition/prize-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId: selectedSeasonId,
          entryFee: formData.entryFee,
          championPercent: formData.championPercent,
          runnerPercent: formData.runnerPercent,
          topScorerPercent: formData.topScorerPercent,
          platformPercent: formData.platformPercent,
        }),
      });

      if (!res.ok) throw new Error("Failed to save prize pool");

      toast.success("Prize pool updated successfully!");
      setIsEditing(false);
      fetchPrizePool(selectedSeasonId);
    } catch (error) {
      console.error("Error saving prize pool:", error);
      toast.error("Failed to save prize pool");
    } finally {
      setSaving(false);
    }
  }, [formData, selectedSeasonId]);

  const getSafeValue = (value: number | undefined | null, fallback: number = 0) => {
    return value ?? fallback;
  };

  const safeTotalCollected = getSafeValue(prizePool?.totalCollected);
  const safeChampionReward = getSafeValue(prizePool?.championReward);
  const safeRunnerReward = getSafeValue(prizePool?.runnerReward);
  const safeTopScorerReward = getSafeValue(prizePool?.topScorerReward);
  const safePlatformReserve = getSafeValue(prizePool?.platformReserve);
  const safeEntryFee = getSafeValue(prizePool?.entryFee);
  const safeRegisteredPlayers = getSafeValue(prizePool?.registeredPlayers);

  const statCards = useMemo(() => [
    {
      label: "Entry Fee",
      value: `KES ${safeEntryFee.toLocaleString()}`,
      icon: DollarSign,
      color: "text-white",
    },
    {
      label: "Paid Players",
      value: safeRegisteredPlayers,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Total Prize Pool",
      value: `KES ${safeTotalCollected.toLocaleString()}`,
      icon: Wallet,
      color: "text-green-400",
    },
    {
      label: "Season Status",
      value: prizePool?.season?.status || "N/A",
      icon: Calendar,
      color: "text-yellow-400",
    },
  ], [safeEntryFee, safeRegisteredPlayers, safeTotalCollected, prizePool?.season?.status]);

  const prizeTiers = useMemo(() => [
    {
      icon: Crown,
      label: "Champion",
      amount: safeChampionReward,
      percentage: safeTotalCollected > 0 ? Math.round((safeChampionReward / safeTotalCollected) * 100) : 0,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      icon: Medal,
      label: "Runner Up",
      amount: safeRunnerReward,
      percentage: safeTotalCollected > 0 ? Math.round((safeRunnerReward / safeTotalCollected) * 100) : 0,
      color: "text-gray-300",
      bg: "bg-gray-500/10 border-gray-400/20",
    },
    {
      icon: Award,
      label: "Top Scorer",
      amount: safeTopScorerReward,
      percentage: safeTotalCollected > 0 ? Math.round((safeTopScorerReward / safeTotalCollected) * 100) : 0,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Landmark,
      label: "Platform Reserve",
      amount: safePlatformReserve,
      percentage: safeTotalCollected > 0 ? Math.round((safePlatformReserve / safeTotalCollected) * 100) : 0,
      color: "text-gray-500",
      bg: "bg-gray-600/10 border-gray-500/20",
    },
  ], [safeChampionReward, safeRunnerReward, safeTopScorerReward, safePlatformReserve, safeTotalCollected]);

  const progressBars = useMemo(() => [
    { label: "Champion", width: safeTotalCollected > 0 ? (safeChampionReward / safeTotalCollected) * 100 : 0, color: "bg-yellow-500" },
    { label: "Runner Up", width: safeTotalCollected > 0 ? (safeRunnerReward / safeTotalCollected) * 100 : 0, color: "bg-gray-400" },
    { label: "Top Scorer", width: safeTotalCollected > 0 ? (safeTopScorerReward / safeTotalCollected) * 100 : 0, color: "bg-blue-400" },
    { label: "Reserve", width: safeTotalCollected > 0 ? (safePlatformReserve / safeTotalCollected) * 100 : 0, color: "bg-gray-600" },
  ], [safeChampionReward, safeRunnerReward, safeTopScorerReward, safePlatformReserve, safeTotalCollected]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading prize pool...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Calculating prizes</span>
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
        className="space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
                <Trophy className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  💰 Prize Pool Management
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Configure prize distribution for competitions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="min-h-[44px] appearance-none rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-8 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => fetchPrizePool(selectedSeasonId)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-white transition-all hover:bg-gray-600/50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Prize Distribution */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gray-900/40 p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Prize Distribution</h2>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-sm text-white transition-all hover:bg-gray-600/50"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Info message */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 backdrop-blur-sm">
              <p className="text-sm text-blue-400">
                Prize pool is calculated from {safeRegisteredPlayers} paid players × KES {safeEntryFee} = KES {safeTotalCollected.toLocaleString()}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Entry Fee (KES)
                    </label>
                    <input
                      type="number"
                      value={formData.entryFee}
                      onChange={(e) => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be the entry fee for ALL players</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { key: "championPercent", label: "Champion (%)", value: formData.championPercent },
                      { key: "runnerPercent", label: "Runner Up (%)", value: formData.runnerPercent },
                      { key: "topScorerPercent", label: "Top Scorer (%)", value: formData.topScorerPercent },
                      { key: "platformPercent", label: "Platform Reserve (%)", value: formData.platformPercent },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {field.label}
                        </label>
                        <input
                          type="number"
                          value={field.value}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.key]: Number(e.target.value) })
                          }
                          className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          min="0"
                          max="100"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-gray-900/40 p-3">
                    <p className="text-sm text-gray-400">
                      Total: <span className="font-bold text-white">
                        {formData.championPercent + formData.runnerPercent +
                          formData.topScorerPercent + formData.platformPercent}%
                      </span>
                      {formData.championPercent + formData.runnerPercent +
                        formData.topScorerPercent + formData.platformPercent !== 100 && (
                          <span className="ml-2 text-red-400">(Must equal 100%)</span>
                        )}
                    </p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Prize Distribution
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {prizeTiers.map((tier) => (
                      <PrizeTierCard
                        key={tier.label}
                        icon={tier.icon}
                        label={tier.label}
                        amount={tier.amount}
                        percentage={tier.percentage}
                        color={tier.color}
                        bg={tier.bg}
                      />
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="rounded-xl bg-gray-900/40 p-4">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      {progressBars.map((bar) => (
                        <span key={bar.label}>{bar.label}</span>
                      ))}
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full">
                      {progressBars.map((bar, index) => (
                        <motion.div
                          key={bar.label}
                          initial={{ width: 0 }}
                          animate={{ width: `${bar.width}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                          className={`h-full ${bar.color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center text-xs text-gray-500">
                    Last updated: {prizePool?.updatedAt ? new Date(prizePool.updatedAt).toLocaleString() : "Never"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}