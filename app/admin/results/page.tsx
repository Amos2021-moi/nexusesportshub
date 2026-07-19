"use client";

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trophy,
  Users,
  Calendar,
  Image as ImageIcon,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ChevronRight,
  Loader2,
  ZoomIn,
  FileImage,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";

interface PendingResult {
  id: string;
  homeScore: number;
  awayScore: number;
  evidenceImage: string;
  submittedBy: string;
  approved: boolean;
  source: string;
  createdAt: string;
  fixture: {
    id: string;
    homePlayer: {
      name: string;
      email: string;
      profile: { username: string; profilePicture: string };
    };
    awayPlayer: {
      name: string;
      email: string;
      profile: { username: string; profilePicture: string };
    };
    scheduledDate: string;
  } | null;
  tournamentMatch: {
    homePlayer: { name: string; profile: { username: string } };
    awayPlayer: { name: string; profile: { username: string } };
    tournament: { name: string };
  } | null;
  user: { name: string; email: string; profile: { username: string } };
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

function playerName(player?: { name: string; profile?: { username: string } } | null) {
  return player?.profile?.username || player?.name || "Player";
}

function isToday(date: string) {
  const input = new Date(date);
  const now = new Date();
  return (
    input.getFullYear() === now.getFullYear() &&
    input.getMonth() === now.getMonth() &&
    input.getDate() === now.getDate()
  );
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
    <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white/5 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-orange-500/40 ${stat.ring}`}>
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

const ResultCard = memo(({ result, onApprove, onReject, onViewEvidence }: {
  result: PendingResult;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewEvidence: (image: string) => void;
}) => {
  const isPending = !result.approved;
  const isTournament = !result.fixture && result.tournamentMatch;
  const homeName = result.fixture
    ? playerName(result.fixture.homePlayer)
    : playerName(result.tournamentMatch?.homePlayer);
  const awayName = result.fixture
    ? playerName(result.fixture.awayPlayer)
    : playerName(result.tournamentMatch?.awayPlayer);
  const submittedBy = result.user?.profile?.username || result.user?.name || result.user?.email || "Unknown";
  const matchDate = result.fixture?.scheduledDate || result.createdAt;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative overflow-hidden rounded-2xl border bg-white/5 shadow-xl backdrop-blur-xl transition-colors ${
        isPending
          ? "border-yellow-500/20 hover:border-yellow-500/50"
          : "border-green-500/15 hover:border-green-500/40"
      }`}
    >
      <div
        className={`h-1 ${
          isPending
            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
            : "bg-gradient-to-r from-green-500 to-emerald-500"
        }`}
      />

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isTournament
                ? "border-purple-400/20 bg-purple-500/15 text-purple-300"
                : "border-blue-400/20 bg-blue-500/15 text-blue-300"
            }`}
          >
            <Trophy size={12} />
            {isTournament ? "Tournament" : "League"}
          </span>
          {isTournament && (
            <span className="rounded-full border border-white/10 bg-gray-900/40 px-2.5 py-1 text-xs text-gray-400">
              {result.tournamentMatch?.tournament?.name || "Match"}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
              isPending
                ? "border-yellow-400/20 bg-yellow-500/15 text-yellow-300"
                : "border-green-400/20 bg-green-500/15 text-green-300"
            }`}
          >
            {isPending ? <Clock size={12} /> : <CheckCircle size={12} />}
            {isPending ? "Pending" : "Approved"}
          </span>
        </div>

        {/* Match display */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-gray-900/40 p-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white">
                {homeName.charAt(0).toUpperCase()}
              </span>
              <span className="truncate font-semibold text-white">{homeName}</span>
            </div>

            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-gray-950/50 px-5 py-3 shadow-inner">
              <span className="text-2xl font-black text-white sm:text-3xl">{result.homeScore}</span>
              <span className="text-gray-500">-</span>
              <span className="text-2xl font-black text-white sm:text-3xl">{result.awayScore}</span>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-gray-900/40 p-3 sm:justify-end">
              <span className="truncate font-semibold text-white">{awayName}</span>
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
                {awayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-400 md:grid-cols-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-900/30 px-3 py-2">
            <Calendar size={14} className="flex-shrink-0 text-orange-300" />
            <span className="truncate">{new Date(matchDate).toLocaleDateString()}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-900/30 px-3 py-2">
            <Users size={14} className="flex-shrink-0 text-blue-300" />
            <span className="truncate">Submitted by: {submittedBy}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-900/30 px-3 py-2">
            <Clock size={14} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{new Date(result.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Evidence + actions */}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {result.evidenceImage ? (
              <button
                onClick={() => onViewEvidence(result.evidenceImage)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
              >
                <FileImage size={16} />
                View Evidence
                <Eye size={14} />
              </button>
            ) : (
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-4 text-sm text-gray-500">
                <AlertTriangle size={16} />
                No evidence attached
              </span>
            )}
          </div>

          {isPending && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => onApprove(result.id)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition-all hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle size={16} />
                Approve Result
              </button>
              <button
                onClick={() => onReject(result.id)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-semibold text-red-300 transition-all hover:bg-red-600/25"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ResultCard.displayName = "ResultCard";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-red-600/15 blur-3xl"
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
/*                            Filter Button Component                         */
/* -------------------------------------------------------------------------- */

const FilterButton = memo(({ button, filter, setFilter }: {
  button: { value: "pending" | "approved" | "all"; label: string; icon: any; count: number; active: string };
  filter: string;
  setFilter: (value: "pending" | "approved" | "all") => void;
}) => {
  const Icon = button.icon;
  const isActive = filter === button.value;

  return (
    <button
      onClick={() => setFilter(button.value)}
      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
        isActive ? button.active : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={14} />
      <span className="hidden sm:inline">{button.label}</span>
      <span>({button.count})</span>
    </button>
  );
});

FilterButton.displayName = "FilterButton";

/* -------------------------------------------------------------------------- */
/*                            Evidence Modal                                  */
/* -------------------------------------------------------------------------- */

const EvidenceModal = memo(({ image, onClose }: { image: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 18 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative max-h-[92vh] w-full max-w-5xl rounded-2xl border border-white/10 bg-gray-900/80 p-3 shadow-2xl backdrop-blur-xl sm:p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute -top-12 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white transition-all hover:bg-white/10 hover:text-gray-300 sm:-top-14"
        aria-label="Close evidence preview"
      >
        <X size={24} />
      </button>
      <Image
        src={`data:image/png;base64,${image}`}
        alt="Evidence"
        width={1000}
        height={750}
        className="max-h-[85vh] w-full rounded-xl object-contain"
        loading="lazy"
      />
    </motion.div>
  </motion.div>
));

EvidenceModal.displayName = "EvidenceModal";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminResultsPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    const res = await fetch("/api/admin/results");
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const approveResult = useCallback(async (resultId: string) => {
    setApprovingId(resultId);
    try {
      const res = await fetch("/api/admin/results/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Result approved!");
        fetchResults();
      } else {
        toast.error(data.error || "Failed to approve");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setApprovingId(null);
    }
  }, []);

  const rejectResult = useCallback(async (resultId: string) => {
    if (!confirm("Are you sure you want to reject this result?")) return;

    setRejectingId(resultId);
    try {
      const res = await fetch("/api/admin/results/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId }),
      });

      if (res.ok) {
        toast.success("Result rejected");
        fetchResults();
      } else {
        toast.error("Failed to reject");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setRejectingId(null);
    }
  }, []);

  const pendingResults = useMemo(() => results.filter((r) => !r.approved), [results]);
  const approvedResults = useMemo(() => results.filter((r) => r.approved), [results]);
  const todayResults = useMemo(() => results.filter((r) => isToday(r.createdAt)), [results]);

  const displayResults = useMemo(() => {
    const byStatus =
      filter === "all" ? results : filter === "pending" ? pendingResults : approvedResults;

    if (!searchTerm.trim()) return byStatus;

    const query = searchTerm.toLowerCase();
    return byStatus.filter((result) => {
      const homeName = result.fixture
        ? playerName(result.fixture.homePlayer)
        : playerName(result.tournamentMatch?.homePlayer);
      const awayName = result.fixture
        ? playerName(result.fixture.awayPlayer)
        : playerName(result.tournamentMatch?.awayPlayer);
      const submitter = result.user?.profile?.username || result.user?.name || result.user?.email || "";
      const tournament = result.tournamentMatch?.tournament?.name || "";
      return [homeName, awayName, submitter, tournament, result.source]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [approvedResults, filter, pendingResults, results, searchTerm]);

  const statCards = useMemo(() => [
    {
      label: "Pending",
      value: pendingResults.length,
      hint: "Awaiting approval",
      icon: Clock,
      accent: "text-yellow-400",
      ring: "border-yellow-500/20",
      glow: "from-yellow-500/20",
    },
    {
      label: "Approved",
      value: approvedResults.length,
      hint: "Approved results",
      icon: CheckCircle,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
    {
      label: "Today",
      value: todayResults.length,
      hint: "Submitted today",
      icon: Flame,
      accent: "text-orange-400",
      ring: "border-orange-500/20",
      glow: "from-orange-500/20",
    },
    {
      label: "Total",
      value: results.length,
      hint: "Total submissions",
      icon: Trophy,
      accent: "text-indigo-400",
      ring: "border-indigo-500/20",
      glow: "from-indigo-500/20",
    },
  ], [pendingResults, approvedResults, todayResults, results]);

  const filterButtons = useMemo(() => [
    { value: "pending" as const, label: "Pending", icon: Clock, count: pendingResults.length, active: "bg-yellow-500/20 text-yellow-300" },
    { value: "approved" as const, label: "Approved", icon: CheckCircle, count: approvedResults.length, active: "bg-green-500/20 text-green-300" },
    { value: "all" as const, label: "All", icon: Filter, count: results.length, active: "bg-indigo-500/20 text-indigo-300" },
  ], [pendingResults, approvedResults, results]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
              <ShieldCheck className="absolute inset-0 m-auto h-6 w-6 text-orange-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading results...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching submissions</span>
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
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-purple-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                  📋 Result Management
                </h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">
                  Review and manage match result submissions
                </p>
              </div>
            </div>
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-300">
              <Sparkles className="h-3.5 w-3.5" />
              {pendingResults.length} pending
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search player, submitter, tournament, or source..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-gray-900/40 p-1">
              {filterButtons.map((button) => (
                <FilterButton
                  key={button.value}
                  button={button}
                  filter={filter}
                  setFilter={setFilter}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results List */}
        {displayResults.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Results Found</h3>
            <p className="px-4 text-gray-400">
              {searchTerm
                ? "No results match your search."
                : filter === "pending"
                ? "No pending results waiting for approval."
                : filter === "approved"
                ? "No approved results yet."
                : "No result submissions yet."}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-4">
            {displayResults.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                onApprove={approveResult}
                onReject={rejectResult}
                onViewEvidence={setSelectedImage}
              />
            ))}
          </motion.div>
        )}

        {/* Evidence Modal */}
        <AnimatePresence>
          {selectedImage && (
            <EvidenceModal image={selectedImage} onClose={() => setSelectedImage(null)} />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}