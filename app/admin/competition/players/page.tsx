"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Phone,
  Calendar,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  User,
  Mail,
  Receipt,
  Trophy,
  Crown,
  Medal,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface PlayerData {
  id: string;
  playerId: string;
  name: string;
  username: string;
  profilePicture: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  hasPaid: boolean;
  paidAt: string | null;
  paymentReceipt: string | null;
  paymentMethod: string | null;
  paymentPhone: string | null;
  paymentRequired: boolean;
  entryFee: number;
  status: string;
}

interface CompetitionData {
  players: PlayerData[];
  stats: {
    total: number;
    paid: number;
    unpaid: number;
    free: number;
  };
  settings: {
    paymentRequired: boolean;
    entryFee: number;
  };
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

const StatCard = memo(({ stat }: { stat: { label: string; value: number; color?: string } }) => (
  <motion.div
    variants={statCardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="will-change-transform"
  >
    <div className="group relative h-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-indigo-500/40">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl transition-opacity duration-500 group-hover:opacity-40" />
      <div className="relative">
        <p className={`text-2xl font-bold ${stat.color || "text-white"}`}>{stat.value}</p>
        <p className="text-sm text-gray-400">{stat.label}</p>
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

const StatusBadge = memo(({ player }: { player: PlayerData }) => {
  if (!player.paymentRequired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/30">
        🎯 Free
      </span>
    );
  }
  if (player.hasPaid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/30">
        <CheckCircle className="h-3 w-3" />
        Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/30">
      <XCircle className="h-3 w-3" />
      Unpaid
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

const PlayerRow = memo(({
  player,
  onMarkPaid,
  onMarkUnpaid,
  loadingId,
}: {
  player: PlayerData;
  onMarkPaid: (id: string) => void;
  onMarkUnpaid: (id: string) => void;
  loadingId: string | null;
}) => {
  const isProcessing = loadingId === player.playerId;

  return (
    <tr className="transition-colors hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {player.profilePicture ? (
            <img
              src={player.profilePicture}
              alt={player.username || "Player"}
              className="h-8 w-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
              {(player.username || "P").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {player.username || player.name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge player={player} />
      </td>
      <td className="px-4 py-3 text-center font-bold text-white">{player.points}</td>
      <td className="px-4 py-3 text-center text-gray-300">{player.played}</td>
      <td className="px-4 py-3 text-center text-green-400">{player.wins}</td>
      <td className="px-4 py-3 text-center text-yellow-400">{player.draws}</td>
      <td className="px-4 py-3 text-center text-red-400">{player.losses}</td>
      <td className="px-4 py-3 text-center text-sm text-gray-300">
        {player.paymentReceipt || "-"}
      </td>
      <td className="px-4 py-3 text-center">
        {player.paymentRequired && (
          player.hasPaid ? (
            <button
              onClick={() => onMarkUnpaid(player.playerId)}
              disabled={isProcessing}
              className="min-h-[32px] rounded-lg bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400 transition-all hover:bg-red-500/25 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Unmark"
              )}
            </button>
          ) : (
            <button
              onClick={() => onMarkPaid(player.playerId)}
              disabled={isProcessing}
              className="min-h-[32px] rounded-lg bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400 transition-all hover:bg-green-500/25 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Mark Paid"
              )}
            </button>
          )
        )}
      </td>
    </tr>
  );
});

PlayerRow.displayName = "PlayerRow";

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

export default function AdminCompetitionPlayersPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const seasonIdParam = searchParams.get("seasonId");

  const [data, setData] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedSeasonId, setSelectedSeasonId] = useState(seasonIdParam || "");
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      fetchData();
    }
  }, [selectedSeasonId, filter]);

  async function fetchSeasons() {
    try {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to fetch seasons");
      const data = await res.json();
      setSeasons(data);
      if (!selectedSeasonId && data.length > 0) {
        setSelectedSeasonId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      toast.error("Failed to load seasons");
    }
  }

  async function fetchData() {
    setLoading(true);
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/competition/players?seasonId=${selectedSeasonId}`);
      if (!res.ok) throw new Error("Failed to fetch competition data");
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching competition data:", error);
      toast.error("Failed to load competition data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleMarkPaid = useCallback(async (playerId: string) => {
    setLoadingId(playerId);
    try {
      const res = await fetch("/api/admin/competition/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: playerId,
          seasonId: selectedSeasonId,
          method: "ADMIN",
        }),
      });

      if (!res.ok) throw new Error("Failed to mark as paid");

      toast.success("Player marked as paid!");
      fetchData();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Failed to mark as paid");
    } finally {
      setLoadingId(null);
    }
  }, [selectedSeasonId]);

  const handleMarkUnpaid = useCallback(async (playerId: string) => {
    setLoadingId(playerId);
    try {
      const res = await fetch(`/api/admin/competition/players?userId=${playerId}&seasonId=${selectedSeasonId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to mark as unpaid");

      toast.success("Player marked as unpaid");
      fetchData();
    } catch (error) {
      console.error("Error marking as unpaid:", error);
      toast.error("Failed to mark as unpaid");
    } finally {
      setLoadingId(null);
    }
  }, [selectedSeasonId]);

  const filteredPlayers = useMemo(() => {
    const players = data?.players || [];
    if (!search) return players;
    const searchLower = search.toLowerCase();
    return players.filter(
      (player) =>
        player.name?.toLowerCase().includes(searchLower) ||
        player.username?.toLowerCase().includes(searchLower)
    );
  }, [data?.players, search]);

  const paymentRequired = data?.settings?.paymentRequired || false;
  const entryFee = data?.settings?.entryFee || 0;
  const paidPlayers = data?.stats?.paid || 0;
  const prizePool = paidPlayers * entryFee;

  const statCards = useMemo(() => [
    { label: "Total Players", value: data?.stats?.total || 0 },
    { label: "✅ Paid", value: data?.stats?.paid || 0, color: "text-green-400" },
    { label: "❌ Unpaid", value: data?.stats?.unpaid || 0, color: "text-red-400" },
    { label: "🎯 Free", value: data?.stats?.free || 0, color: "text-blue-400" },
  ], [data?.stats]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Users className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading players...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching player data</span>
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
                <Users className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  👥 Competition Players
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Manage players and their payment status
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
                      {season.name} {season.isActive ? "⭐" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-white transition-all hover:bg-gray-600/50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Payment Summary */}
        {paymentRequired && (
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-xl"
          >
            <p className="text-sm text-yellow-400">
              💰 Payment Required: KES {entryFee} per player •
              Prize Pool: KES {prizePool.toLocaleString()}
            </p>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search players..."
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-h-[44px] appearance-none rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-8 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="all">All Status</option>
                <option value="paid">✅ Paid</option>
                <option value="unpaid">❌ Unpaid</option>
                <option value="free">🎯 Free</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/60 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Player</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Points</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">P</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">W</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">D</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">L</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Receipt</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                      {search ? "No players match your search" : "No players found"}
                    </td>
                  </tr>
                ) : (
                  filteredPlayers
                    .filter((p) => {
                      if (filter === "paid") return p.hasPaid;
                      if (filter === "unpaid") return !p.hasPaid && p.paymentRequired;
                      if (filter === "free") return !p.paymentRequired;
                      return true;
                    })
                    .map((player) => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        onMarkPaid={handleMarkPaid}
                        onMarkUnpaid={handleMarkUnpaid}
                        loadingId={loadingId}
                      />
                    ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}