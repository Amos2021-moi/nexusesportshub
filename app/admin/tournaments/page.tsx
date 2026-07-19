"use client";

import { useEffect, useMemo, useState, memo, type FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  Trash2,
  Eye,
  Search,
  Filter,
  Sparkles,
  X,
  Crown,
  CheckCircle,
  Clock,
  ShieldAlert,
  Swords,
  GitBranch,
  ArrowRight,
  Play,
  Loader2,
  ChevronRight,
  Star,
  Zap,
  Medal,
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  maxPlayers: number;
  participants: any[];
  matches: any[];
  _count?: {
    participants?: number;
    matches?: number;
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
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

const statusMeta: Record<
  string,
  { label: string; color: string; icon: any; accent: string }
> = {
  PENDING: {
    label: "Pending",
    color: "border-yellow-400/20 bg-yellow-500/15 text-yellow-300",
    icon: Clock,
    accent: "text-yellow-400",
  },
  ACTIVE: {
    label: "Active",
    color: "border-green-400/20 bg-green-500/15 text-green-300",
    icon: Play,
    accent: "text-green-400",
  },
  COMPLETED: {
    label: "Completed",
    color: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    icon: CheckCircle,
    accent: "text-blue-400",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "border-red-400/20 bg-red-500/15 text-red-300",
    icon: ShieldAlert,
    accent: "text-red-400",
  },
};

function typeLabel(type: string) {
  return type === "SINGLE_ELIM" ? "Single Elimination" : "Double Elimination";
}

function formatDate(date: string) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTournamentProgress(tournament: Tournament) {
  const matchCount = tournament._count?.matches ?? tournament.matches?.length ?? 0;
  const participantCount =
    tournament._count?.participants ?? tournament.participants?.length ?? 0;

  if (tournament.status === "COMPLETED") return 100;
  if (tournament.status === "CANCELLED") return 100;
  if (tournament.status === "ACTIVE") {
    const base = tournament.maxPlayers
      ? Math.round((participantCount / tournament.maxPlayers) * 50)
      : 25;
    return Math.min(95, Math.max(35, base + Math.min(45, matchCount * 5)));
  }
  return tournament.maxPlayers
    ? Math.min(100, Math.round((participantCount / tournament.maxPlayers) * 100))
    : 0;
}

function participantCount(tournament: Tournament) {
  return tournament._count?.participants ?? tournament.participants?.length ?? 0;
}

function matchCount(tournament: Tournament) {
  return tournament._count?.matches ?? tournament.matches?.length ?? 0;
}

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat }: { stat: any }) => (
  <motion.div
    variants={statCardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="will-change-transform"
  >
    <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-amber-500/40 ${stat.ring}`}>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
        </div>
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${stat.accent}`}>
          <stat.icon className="h-5 w-5" />
        </span>
      </div>
      <p className="relative mt-2 truncate text-[11px] text-gray-500">{stat.hint}</p>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

const TournamentCard = memo(({ tournament, onDelete, onManage, onView }: {
  tournament: Tournament;
  onDelete: (id: string) => void;
  onManage: (id: string) => void;
  onView: (id: string) => void;
}) => {
  const meta = statusMeta[tournament.status] || statusMeta.PENDING;
  const StatusIcon = meta.icon;
  const players = participantCount(tournament);
  const matches = matchCount(tournament);
  const progress = getTournamentProgress(tournament);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-amber-500/40 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-amber-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 truncate text-lg font-semibold text-white sm:text-xl">
              {tournament.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-gray-900/40 px-2.5 py-1 text-xs text-gray-300">
              {tournament.type === "SINGLE_ELIM" ? (
                <Swords className="h-3 w-3" />
              ) : (
                <GitBranch className="h-3 w-3" />
              )}
              {typeLabel(tournament.type)}
            </span>
          </div>

          <p className="mb-4 line-clamp-2 text-sm text-gray-400">
            {tournament.description || "No description provided."}
          </p>

          <div className="grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Calendar size={14} className="text-amber-400" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Users size={14} className="text-blue-400" />
              {players} / {tournament.maxPlayers} players
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Trophy size={14} className="text-yellow-400" />
              {matches} matches
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Crown size={14} className="text-purple-400" />
              Bracket ready
            </span>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-gray-500">Tournament progress</span>
              <span className="font-medium text-amber-300">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-900/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
              />
            </div>
          </div>

          {/* Mini bracket preview */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-gray-900/30 p-3">
            {["R1", "Semi", "Final"].map((round, index) => (
              <div key={round} className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">{round}</p>
                <div
                  className={`h-2 rounded-full ${
                    progress > index * 35
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gray-700"
                  }`}
                />
                <div
                  className={`h-2 rounded-full ${
                    progress > index * 35 + 15 ? "bg-amber-500/60" : "bg-gray-700"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col">
          <button
            onClick={() => onView(tournament.id)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300 transition-all hover:bg-blue-500/20"
            title="View Bracket"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onManage(tournament.id)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 transition-all hover:bg-indigo-500/20"
            title="Manage participants"
          >
            <Users size={18} />
          </button>
          <button
            onClick={() => onDelete(tournament.id)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500/20"
            title="Delete tournament"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

TournamentCard.displayName = "TournamentCard";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl"
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
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "SINGLE_ELIM",
    startDate: "",
    endDate: "",
    maxPlayers: "8",
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    const res = await fetch("/api/tournaments");
    const data = await res.json();
    setTournaments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      toast.success("Tournament created!");
      setShowForm(false);
      setFormData({
        name: "",
        description: "",
        type: "SINGLE_ELIM",
        startDate: "",
        endDate: "",
        maxPlayers: "8",
      });
      fetchTournaments();
    } else {
      toast.error("Failed to create tournament");
    }
    setSubmitting(false);
  }

  const deleteTournament = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;
    const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Tournament deleted");
      fetchTournaments();
    } else {
      toast.error("Failed to delete");
    }
  }, []);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch = [
        tournament.name,
        tournament.description,
        tournament.type,
        tournament.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" || tournament.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, searchTerm, tournaments]);

  const stats = useMemo(() => [
    {
      label: "Total Tournaments",
      value: tournaments.length,
      hint: "All tournaments",
      icon: Trophy,
      accent: "text-amber-400",
      ring: "border-amber-500/20",
      glow: "from-amber-500/20",
    },
    {
      label: "Active",
      value: tournaments.filter((t) => t.status === "ACTIVE").length,
      hint: "Currently active",
      icon: Play,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
    {
      label: "Completed",
      value: tournaments.filter((t) => t.status === "COMPLETED").length,
      hint: "Finished tournaments",
      icon: CheckCircle,
      accent: "text-blue-400",
      ring: "border-blue-500/20",
      glow: "from-blue-500/20",
    },
    {
      label: "Ongoing Slots",
      value: tournaments.reduce((sum, t) => sum + participantCount(t), 0),
      hint: "Total participants",
      icon: Users,
      accent: "text-purple-400",
      ring: "border-purple-500/20",
      glow: "from-purple-500/20",
    },
  ], [tournaments]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <Crown className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading tournaments...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your data</span>
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
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-amber-600/20 via-yellow-600/20 to-purple-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30 sm:h-12 sm:w-12">
                <Crown className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  🏆 Tournament Management
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Create and manage knockout tournaments
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <span className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 sm:w-auto">
                <Sparkles className="h-3.5 w-3.5" />
                {tournaments.length} tournaments
              </span>
              <button
                onClick={() => setShowForm(true)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 transition-all hover:from-amber-700 hover:to-yellow-700 sm:w-auto"
              >
                <Plus size={18} />
                Create Tournament
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Search / Filter */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tournaments by name, type, or status..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div className="relative sm:w-64">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-8 text-white transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-500" />
            </div>
          </div>
        </motion.div>

        {/* Tournaments List */}
        {tournaments.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Tournaments Yet</h3>
            <p className="px-4 text-gray-400">
              Click "Create Tournament" to start your first knockout competition.
            </p>
          </motion.div>
        ) : filteredTournaments.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Matching Tournaments</h3>
            <p className="px-4 text-gray-400">Try a different search term or status filter.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onDelete={deleteTournament}
                onManage={(id: string) => router.push(`/admin/tournaments/${id}/manage`)}
                onView={(id: string) => router.push(`/tournaments/${id}`)}
              />
            ))}
          </motion.div>
        )}

        {/* Create Tournament Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-gray-800/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">
                    🏆 Create Tournament
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Tournament Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      placeholder="e.g., Spring Knockout Cup"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      placeholder="Tournament description..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      >
                        <option value="SINGLE_ELIM">Single Elimination</option>
                        <option value="DOUBLE_ELIM">Double Elimination</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">Max Players</label>
                      <select
                        value={formData.maxPlayers}
                        onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      >
                        <option value="4">4 Players</option>
                        <option value="8">8 Players</option>
                        <option value="16">16 Players</option>
                        <option value="32">32 Players</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-2 font-semibold text-white shadow-lg shadow-amber-900/30 transition-all hover:from-amber-700 hover:to-yellow-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Tournament"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gray-700 py-2 font-semibold text-white transition-all hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}