"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Trophy,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Pause,
  Users,
  Archive,
  Search,
  Filter,
  Sparkles,
  Clock,
  Shield,
  Zap,
  Crown,
  Eye,
  EyeOff,
  RefreshCw,
  Hash,
  List,
  LayoutGrid,
  Loader2,
  ChevronRight,
  Star,
  Medal,
  TrendingUp,
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
  { value: "PRESEASON", label: "Preseason", color: "border-yellow-400/20 bg-yellow-500/15 text-yellow-300", icon: Clock },
  { value: "REGISTRATION", label: "Registration", color: "border-blue-400/20 bg-blue-500/15 text-blue-300", icon: Users },
  { value: "FIXTURE_LOCK", label: "Fixtures Locked", color: "border-orange-400/20 bg-orange-500/15 text-orange-300", icon: Archive },
  { value: "LIVE", label: "Live", color: "border-green-400/20 bg-green-500/15 text-green-300", icon: Play },
  { value: "ENDED", label: "Ended", color: "border-red-400/20 bg-red-500/15 text-red-300", icon: CheckCircle },
  { value: "ARCHIVED", label: "Archived", color: "border-gray-400/20 bg-gray-500/15 text-gray-400", icon: Archive },
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
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

const StatusBadge = memo(({ status }: { status: string }) => {
  const option = statusOptions.find((s) => s.value === status) || statusOptions[0];
  const Icon = option.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${option.color}`}>
      <Icon className="h-3 w-3" />
      {option.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

const SeasonCard = memo(({
  season,
  onEdit,
  onDelete,
  onUpdateStatus,
  isDeleting,
  isUpdating,
}: {
  season: Season;
  onEdit: (season: Season) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  isDeleting: string | null;
  isUpdating: string | null;
}) => {
  const progress = getSeasonProgress(season);
  const statusColor = getStatusColor(season.status);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-emerald-500/40 sm:p-5"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-white sm:text-xl">{season.name}</h2>
              <StatusBadge status={season.status} />
              {season.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-400" />
                {formatDate(season.startDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-red-400" />
                {formatDate(season.endDate)}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(season)}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-300 transition-all hover:bg-blue-500/20"
              title="Edit season"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(season.id)}
              disabled={isDeleting === season.id}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
              title="Delete season"
            >
              {isDeleting === season.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-gray-500">Season Progress</span>
            <span className="font-medium text-emerald-300">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-900/70">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${statusColor}`}
            />
          </div>
        </div>

        {/* Status Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-4">
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = season.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onUpdateStatus(season.id, opt.value)}
                disabled={isActive || isUpdating === season.id}
                className={`flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    : "bg-gray-700/50 text-gray-300 hover:bg-emerald-600/30 hover:text-white"
                }`}
              >
                {isUpdating === season.id && !isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

SeasonCard.displayName = "SeasonCard";

/* -------------------------------------------------------------------------- */
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

function getStatusBadge(status: string) {
  const option = statusOptions.find((s) => s.value === status) || statusOptions[0];
  const Icon = option.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${option.color}`}
    >
      <Icon className="h-3 w-3" />
      {option.label}
    </span>
  );
}

function getSeasonProgress(season: Season) {
  if (season.status === "ARCHIVED" || season.status === "ENDED") return 100;
  if (season.status === "LIVE") return 75;
  if (season.status === "FIXTURE_LOCK") return 50;
  if (season.status === "REGISTRATION") return 25;
  return 10;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PRESEASON: "from-yellow-500 to-amber-500",
    REGISTRATION: "from-blue-500 to-cyan-500",
    FIXTURE_LOCK: "from-orange-500 to-amber-500",
    LIVE: "from-green-500 to-emerald-500",
    ENDED: "from-red-500 to-rose-500",
    ARCHIVED: "from-gray-500 to-gray-600",
  };
  return colors[status] || "from-gray-500 to-gray-600";
}

function formatDate(date: string) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-green-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-teal-600/15 blur-3xl"
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
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
      setFormData({ name: "", startDate: "", endDate: "", isActive: false, status: "PRESEASON" });
      fetchSeasons();
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to save season");
    }
    setSubmitting(false);
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure? This will delete all fixtures and results for this season.")) return;

    setDeleting(id);
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
    setDeleting(null);
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

    setUpdating(id);
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
    setUpdating(null);
  }, []);

  const filteredSeasons = useMemo(() => {
    return seasons.filter((season) => {
      const matchesSearch = season.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || season.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [seasons, searchTerm, filterStatus]);

  const stats = useMemo(() => [
    {
      label: "Total Seasons",
      value: seasons.length,
      icon: Calendar,
      accent: "text-emerald-400",
      ring: "border-emerald-500/20",
      glow: "from-emerald-500/20",
    },
    {
      label: "Active",
      value: seasons.filter((s) => s.isActive).length,
      icon: Zap,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
    {
      label: "Live",
      value: seasons.filter((s) => s.status === "LIVE").length,
      icon: Play,
      accent: "text-blue-400",
      ring: "border-blue-500/20",
      glow: "from-blue-500/20",
    },
    {
      label: "Archived",
      value: seasons.filter((s) => s.status === "ARCHIVED").length,
      icon: Archive,
      accent: "text-gray-400",
      ring: "border-gray-500/20",
      glow: "from-gray-500/20",
    },
  ], [seasons]);

  const filterButtons = useMemo(() => [
    { value: "ALL", label: "All", count: seasons.length },
    ...statusOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: seasons.filter((s) => s.status === opt.value).length,
    })),
  ], [seasons]);

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex min-h-[50vh] items-center justify-center">
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-teal-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30 sm:h-12 sm:w-12">
                <Calendar className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-white sm:text-2xl">
                  📅 Season Management
                </h1>
                <p className="mt-0.5 truncate text-xs text-gray-300 sm:text-sm">
                  Create and manage league seasons with lifecycle tracking
                </p>
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

        {/* Stats - Mobile responsive grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Search & Filter - Fully mobile responsive */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl sm:p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search seasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[120px] md:w-48">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-8 text-sm text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {filterButtons.map((btn) => (
                    <option key={btn.value} value={btn.value}>
                      {btn.label} ({btn.count})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1 rounded-xl border border-white/10 bg-gray-900/50 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg transition-all ${
                    viewMode === "list" ? "bg-emerald-500/20 text-emerald-300" : "text-gray-400 hover:text-white"
                  }`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Seasons - Mobile responsive grid */}
        {filteredSeasons.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
              {searchTerm || filterStatus !== "ALL" ? "No Matching Seasons" : "No Seasons Yet"}
            </h3>
            <p className="px-4 text-sm text-gray-400 sm:text-base">
              {searchTerm || filterStatus !== "ALL"
                ? "Try adjusting your search or filter."
                : 'Click "Create Season" to start your first league season.'}
            </p>
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredSeasons.map((season) => (
              <SeasonCard
                key={season.id}
                season={season}
                onEdit={(s) => {
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
                onUpdateStatus={handleUpdateStatus}
                isDeleting={deleting}
                isUpdating={updating}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-3">
            {filteredSeasons.map((season) => (
              <motion.div
                key={season.id}
                variants={itemVariants}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-emerald-500/40 sm:p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-white">{season.name}</h3>
                      <StatusBadge status={season.status} />
                      {season.isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-300">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-400">
                      <span>{formatDate(season.startDate)} → {formatDate(season.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingSeason(season);
                          setFormData({
                            name: season.name,
                            startDate: season.startDate.split("T")[0],
                            endDate: season.endDate.split("T")[0],
                            isActive: season.isActive,
                            status: season.status,
                          });
                          setShowForm(true);
                        }}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-300 transition-all hover:bg-blue-500/20"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(season.id)}
                        disabled={deleting === season.id}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deleting === season.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create/Edit Modal - Mobile responsive */}
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
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-gray-900/40 px-4 py-2.5 transition-colors hover:bg-gray-900/60">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-300">Activate this season immediately</span>
                </label>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:from-emerald-700 hover:to-green-700 disabled:opacity-50"
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
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gray-700 px-6 py-2.5 font-semibold text-gray-300 transition-all hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}