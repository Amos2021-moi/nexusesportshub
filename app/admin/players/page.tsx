"use client";

import { useEffect, useMemo, useState, useCallback, memo, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Users,
  Archive,
  Search,
  Filter,
  Sparkles,
  Clock,
  Lock,
  Trophy,
  ChevronRight,
  Loader2,
  RefreshCw,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  _count?: {
    leagueEntries?: number;
    fixtures?: number;
    tournaments?: number;
  };
}

const statusOptions = [
  {
    value: "PRESEASON",
    label: "Preseason",
    color: "bg-gray-500/15 text-gray-300 border-gray-400/20",
    accent: "text-gray-300",
    icon: Clock,
  },
  {
    value: "REGISTRATION",
    label: "Registration Open",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    accent: "text-emerald-300",
    icon: Users,
  },
  {
    value: "FIXTURE_LOCK",
    label: "Fixtures Locked",
    color: "bg-blue-500/15 text-blue-300 border-blue-400/20",
    accent: "text-blue-300",
    icon: Lock,
  },
  {
    value: "LIVE",
    label: "Live",
    color: "bg-purple-500/15 text-purple-300 border-purple-400/20",
    accent: "text-purple-300",
    icon: Play,
  },
  {
    value: "ENDED",
    label: "Ended",
    color: "bg-orange-500/15 text-orange-300 border-orange-400/20",
    accent: "text-orange-300",
    icon: Trophy,
  },
  {
    value: "ARCHIVED",
    label: "Archived",
    color: "bg-red-500/15 text-red-300 border-red-400/20",
    accent: "text-red-300",
    icon: Archive,
  },
];

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSeasonProgress(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  if (!start || !end || end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;

  return Math.round(((now - start) / (end - start)) * 100);
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
    <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-emerald-500/40 ${stat.ring}`}>
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

const SeasonCard = memo(({ season, onEdit, onDelete, onStatusUpdate }: {
  season: Season;
  onEdit: (season: Season) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (id: string, status: string) => void;
}) => {
  const progress = getSeasonProgress(season.startDate, season.endDate);
  const statusOption = statusOptions.find((s) => s.value === season.status) || statusOptions[0];
  const StatusIcon = statusOption.icon;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-emerald-500/40 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 truncate text-lg font-semibold text-white sm:text-xl">{season.name}</h2>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusOption.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusOption.label}
            </span>
            {season.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-300">
                <CheckCircle size={12} />
                Active
              </span>
            )}
          </div>

          <div className="grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Calendar size={14} className="text-emerald-400" />
              Start: {formatDate(season.startDate)}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Calendar size={14} className="text-emerald-400" />
              End: {formatDate(season.endDate)}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Users size={14} className="text-blue-400" />
              Players: {season._count?.leagueEntries || 0}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-gray-900/40 px-3 py-2">
              <Trophy size={14} className="text-yellow-400" />
              Fixtures: {season._count?.fixtures || 0}
            </span>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-gray-500">Season timeline</span>
              <span className="font-medium text-emerald-300">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-900/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              />
            </div>
          </div>

          {/* Status Update Buttons */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusUpdate(season.id, opt.value)}
                disabled={season.status === opt.value}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  season.status === opt.value
                    ? "cursor-not-allowed bg-gray-700/50 text-gray-500"
                    : "bg-gray-900/60 text-gray-300 hover:bg-emerald-600 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 sm:flex-col">
          <button
            onClick={() => onEdit(season)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300 transition-all hover:bg-blue-500/20"
            aria-label="Edit season"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(season.id)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500/20"
            aria-label="Delete season"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

SeasonCard.displayName = "SeasonCard";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-green-500/10 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl"
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

export default function AdminSeasonsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
    status: "PRESEASON",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchSeasons();
    }
  }, [session]);

  async function fetchSeasons() {
    const res = await fetch("/api/seasons", { credentials: "include" });
    const data = await res.json();
    setSeasons(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);

    const url = editingSeason ? `/api/seasons/${editingSeason.id}` : "/api/seasons";
    const method = editingSeason ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      toast.success(editingSeason ? "Season updated!" : "Season created!");
      setShowForm(false);
      setEditingSeason(null);
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        isActive: false,
        status: "PRESEASON",
      });
      fetchSeasons();
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to save season");
    }
    setSubmitting(false);
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure? This will delete all fixtures and results for this season.")) return;

    const res = await fetch(`/api/seasons/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      toast.success("Season deleted");
      fetchSeasons();
    } else {
      toast.error("Failed to delete");
    }
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: string) => {
    const confirmMessages: Record<string, string> = {
      ARCHIVED: "Are you sure you want to archive this season? This will make it read-only.",
      ENDED: "Are you sure you want to end this season? No more results can be submitted.",
      LIVE: "Are you sure you want to start this season? Results can now be submitted.",
    };

    if (confirmMessages[newStatus]) {
      if (!confirm(confirmMessages[newStatus])) return;
    }

    const res = await fetch(`/api/seasons/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success(`Season status updated to ${newStatus}`);
      fetchSeasons();
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to update status");
    }
  }, []);

  const getStatusBadge = (seasonStatus: string) => {
    const option = statusOptions.find((s) => s.value === seasonStatus) || statusOptions[0];
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${option.color}`}>
        <Icon className="h-3 w-3" />
        {option.label}
      </span>
    );
  };

  const filteredSeasons = seasons.filter((season) => {
    const matchesSearch = season.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      season.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || season.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalFixtures = seasons.reduce((sum, s) => sum + (s._count?.fixtures || 0), 0);
  const totalPlayers = seasons.reduce((sum, s) => sum + (s._count?.leagueEntries || 0), 0);

  const stats = useMemo(
    () => [
      {
        label: "Total Seasons",
        value: seasons.length,
        icon: Calendar,
        accent: "text-emerald-400",
        ring: "border-emerald-500/20",
        glow: "from-emerald-500/20",
        hint: "All seasons created",
      },
      {
        label: "Active",
        value: seasons.filter((s) => s.isActive).length,
        icon: CheckCircle,
        accent: "text-green-400",
        ring: "border-green-500/20",
        glow: "from-green-500/20",
        hint: "Currently active seasons",
      },
      {
        label: "Live",
        value: seasons.filter((s) => s.status === "LIVE").length,
        icon: Play,
        accent: "text-purple-400",
        ring: "border-purple-500/20",
        glow: "from-purple-500/20",
        hint: "Live seasons in progress",
      },
      {
        label: "Archived",
        value: seasons.filter((s) => s.status === "ARCHIVED").length,
        icon: Archive,
        accent: "text-red-400",
        ring: "border-red-500/20",
        glow: "from-red-500/20",
        hint: "Archived seasons",
      },
    ],
    [seasons]
  );

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <Calendar className="absolute inset-0 m-auto h-6 w-6 text-emerald-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading seasons...</p>
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

  return (
    <>
      <DecorBackground />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5 will-change-transform sm:space-y-6">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-indigo-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 sm:h-12 sm:w-12">
                <Calendar className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">📅 Season Management</h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">Create and manage league seasons with lifecycle tracking</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <span className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 sm:w-auto">
                <Sparkles className="h-3.5 w-3.5" />
                {seasons.length} seasons
              </span>
              <button
                onClick={() => {
                  setEditingSeason(null);
                  setFormData({ name: "", startDate: "", endDate: "", isActive: false, status: "PRESEASON" });
                  setShowForm(true);
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:from-emerald-700 hover:to-green-700 sm:w-auto"
              >
                <Plus size={18} />
                Create Season
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
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search seasons by name or status..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="relative sm:w-64">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-8 text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="ALL">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-500" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500 sm:grid-cols-3">
            <span>Total players tracked: <b className="text-gray-300">{totalPlayers}</b></span>
            <span>Total fixtures: <b className="text-gray-300">{totalFixtures}</b></span>
            <span className="col-span-2 sm:col-span-1">Showing: <b className="text-gray-300">{filteredSeasons.length}</b></span>
          </div>
        </motion.div>

        {/* Seasons */}
        {seasons.length === 0 ? (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Seasons Yet</h3>
            <p className="px-4 text-gray-400">Click "Create Season" to start your first league season.</p>
          </motion.div>
        ) : filteredSeasons.length === 0 ? (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl">
            <Search className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Matching Seasons</h3>
            <p className="px-4 text-gray-400">Try a different search term or status filter.</p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredSeasons.map((season) => (
              <SeasonCard
                key={season.id}
                season={season}
                onEdit={(s: Season) => {
                  setEditingSeason(s);
                  setFormData({
                    name: s.name,
                    startDate: s.startDate.split("T")[0],
                    endDate: s.endDate.split("T")[0],
                    isActive: s.isActive,
                    status: s.status,
                  });
                  setShowForm(true);
                }}
                onDelete={handleDelete}
                onStatusUpdate={handleUpdateStatus}
              />
            ))}
          </motion.div>
        )}

        {/* Create/Edit Modal */}
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
                    {editingSeason ? "✏️ Edit Season" : "📅 Create New Season"}
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
                    <label className="mb-1 block text-sm font-medium text-gray-300">Season Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Spring 2025 Season"
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-300">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-gray-900/40 p-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-600"
                    />
                    Activate this season immediately
                  </label>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 py-2 font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingSeason ? (
                        "Update Season"
                      ) : (
                        "Create Season"
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