"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
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
  Loader2,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
  User,
  Mail,
  Receipt,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface LeagueEntryWithPayment {
  id: string;
  playerId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  seasonEntry: {
    id: string;
    status: string;
    entryFee: number;
    phoneNumber: string;
    mpesaReceipt: string | null;
    paidAt: string | null;
    createdAt: string;
    checkoutRequestId: string | null;
  } | null;
  player: {
    id: string;
    name: string;
    email: string;
    profile: {
      username: string;
      profilePicture: string | null;
    };
  };
  season: {
    id: string;
    name: string;
  };
}

interface Season {
  id: string;
  name: string;
  isActive: boolean;
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

const StatCard = memo(({ stat }: { stat: { label: string; value: number; subtext?: string; color?: string } }) => (
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
        {stat.subtext && <p className="text-xs text-gray-500">{stat.subtext}</p>}
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

const StatusBadge = memo(({ status }: { status: string | null }) => {
  const configs: Record<string, { icon: any; label: string; className: string }> = {
    ACTIVE: {
      icon: CheckCircle,
      label: "Paid ✅",
      className: "bg-green-500/15 text-green-400 border-green-500/30",
    },
    PAYMENT_PENDING: {
      icon: Clock,
      label: "Pending ⏳",
      className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    },
  };

  const config = configs[status || ""] || {
    icon: AlertCircle,
    label: "Unpaid",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

const EntryRow = memo(({ entry }: { entry: LeagueEntryWithPayment }) => {
  const playerName = entry.player.profile?.username || entry.player.name || "Unknown";
  const phoneNumber = entry.seasonEntry?.phoneNumber;
  const formattedPhone = phoneNumber
    ? phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
    : "-";

  return (
    <tr className="transition-colors hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {entry.player.profile?.profilePicture ? (
            <img
              src={entry.player.profile.profilePicture}
              alt={playerName}
              className="h-8 w-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
              {playerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{playerName}</p>
            <p className="truncate text-xs text-gray-400">{entry.player.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300">{entry.season.name}</td>
      <td className="px-4 py-3">
        <StatusBadge status={entry.seasonEntry?.status || null} />
      </td>
      <td className="px-4 py-3 text-center text-sm font-mono text-gray-300">
        {formattedPhone}
      </td>
      <td className="px-4 py-3 text-center text-sm">
        {entry.seasonEntry?.mpesaReceipt ? (
          <span className="font-mono text-green-400">{entry.seasonEntry.mpesaReceipt}</span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-sm text-gray-400">
        {entry.seasonEntry?.paidAt ? new Date(entry.seasonEntry.paidAt).toLocaleDateString() : "-"}
      </td>
    </tr>
  );
});

EntryRow.displayName = "EntryRow";

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

export default function AdminCompetitionEntries() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<LeagueEntryWithPayment[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"points" | "paid" | "name">("points");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchSeasons();
    const interval = setInterval(() => {
      if (selectedSeason) {
        fetchEntries();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      fetchEntries();
    }
  }, [selectedSeason, filter, sortBy, sortOrder]);

  async function fetchSeasons() {
    try {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to fetch seasons");
      const data = await res.json();
      setSeasons(data);

      const activeSeason = data.find((s: Season) => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason.id);
      } else if (data.length > 0) {
        setSelectedSeason(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      toast.error("Failed to load seasons");
    }
  }

  async function fetchEntries() {
    setLoading(true);
    setRefreshing(true);
    try {
      const url = new URL("/api/admin/competition/entries", window.location.origin);
      url.searchParams.set("seasonId", selectedSeason);
      if (filter !== "all") url.searchParams.set("status", filter);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();

      const sorted = sortEntries(data);
      setEntries(sorted);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const sortEntries = (data: LeagueEntryWithPayment[]) => {
    const sorted = [...data];

    switch (sortBy) {
      case "points":
        sorted.sort((a, b) => sortOrder === "desc" ? b.points - a.points : a.points - b.points);
        break;
      case "paid":
        sorted.sort((a, b) => {
          const aPaid = a.seasonEntry?.status === "ACTIVE" ? 1 : 0;
          const bPaid = b.seasonEntry?.status === "ACTIVE" ? 1 : 0;
          return sortOrder === "desc" ? bPaid - aPaid : aPaid - bPaid;
        });
        break;
      case "name":
        sorted.sort((a, b) => {
          const aName = (a.player.profile?.username || a.player.name || "").toLowerCase();
          const bName = (b.player.profile?.username || b.player.name || "").toLowerCase();
          return sortOrder === "desc" ? bName.localeCompare(aName) : aName.localeCompare(bName);
        });
        break;
    }
    return sorted;
  };

  const handleSort = (field: "points" | "paid" | "name") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const filteredEntries = useMemo(() => {
    if (!search) return entries;
    const searchLower = search.toLowerCase();
    return entries.filter((entry) =>
      entry.player.name?.toLowerCase().includes(searchLower) ||
      entry.player.email?.toLowerCase().includes(searchLower) ||
      entry.player.profile?.username?.toLowerCase().includes(searchLower)
    );
  }, [entries, search]);

  const totalEntries = entries.length;
  const paidEntries = entries.filter(e => e.seasonEntry?.status === "ACTIVE").length;
  const pendingEntries = entries.filter(e => e.seasonEntry?.status === "PAYMENT_PENDING").length;
  const unpaidEntries = entries.filter(e => !e.seasonEntry || e.seasonEntry?.status !== "ACTIVE").length;
  const paidPercentage = totalEntries > 0 ? Math.round((paidEntries / totalEntries) * 100) : 0;

  const statCards = useMemo(() => [
    { label: "Total Players", value: totalEntries, color: "text-white" },
    { label: "✅ Paid", value: paidEntries, subtext: `${paidPercentage}%`, color: "text-green-400" },
    { label: "⏳ Pending", value: pendingEntries, color: "text-yellow-400" },
    { label: "❌ Unpaid", value: unpaidEntries, color: "text-red-400" },
  ], [totalEntries, paidEntries, pendingEntries, unpaidEntries, paidPercentage]);

  if (loading && entries.length === 0) {
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
            <p className="mt-2 font-medium text-gray-400">Loading entries...</p>
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
                  🏆 Competition Entries
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Manage player registrations and payments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchEntries}
                disabled={refreshing}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-white transition-all hover:bg-gray-600/50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <span className="text-xs text-gray-500">Auto-refresh every 10s</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

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
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="min-h-[44px] appearance-none rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-8 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name} {season.isActive ? "⭐" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-h-[44px] appearance-none rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-8 text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Paid ✅</option>
                <option value="PAYMENT_PENDING">Pending ⏳</option>
                <option value="NOT_ENROLLED">Unpaid</option>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                    <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-white transition-colors">
                      Player
                      {sortBy === "name" && (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Season</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">
                    <button onClick={() => handleSort("paid")} className="flex items-center gap-1 hover:text-white transition-colors">
                      Status
                      {sortBy === "paid" && (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Phone Number</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Receipt</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      {search ? "No players match your search" : "No players found in this season"}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
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