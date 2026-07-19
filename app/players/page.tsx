"use client";

import EmptyState from "@/components/ui/EmptyState";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Search,
  Users,
  Trophy,
  Shield,
  Star,
  ChevronRight,
  Crown,
  Award,
  TrendingUp,
  Target,
  Flame,
  Zap,
  Filter,
  Grid3x3,
  List,
  UserPlus,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface Player {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  profile: {
    username: string;
    profilePicture: string;
    trustScore: number;
    verifiedBadge: boolean;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* Trust score → color tier (visual only). */
function trustTier(score: number) {
  if (score >= 80)
    return { label: "Elite", text: "text-emerald-300", bg: "bg-emerald-500/15", ring: "ring-emerald-500/30" };
  if (score >= 50)
    return { label: "Pro", text: "text-yellow-300", bg: "bg-yellow-500/15", ring: "ring-yellow-500/30" };
  return { label: "Player", text: "text-purple-300", bg: "bg-purple-500/15", ring: "ring-purple-500/30" };
}

export default function PlayersPage() {
  const { data: session } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "top" | "rising">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ✅ Force dark mode on mount
  useEffect(() => {
    // Check if dark mode is enabled
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark";
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const res = await fetch("/api/public/players");
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPlayers = players.filter((player) => {
    const username = player.profile?.username || player.name || "";
    const matchesSearch = username.toLowerCase().includes(search.toLowerCase());

    if (filter === "verified") {
      return matchesSearch && player.isVerified;
    }
    if (filter === "top") {
      return matchesSearch && (player.profile?.trustScore || 0) >= 80;
    }
    if (filter === "rising") {
      return (
        matchesSearch &&
        (player.profile?.trustScore || 0) >= 60 &&
        (player.profile?.trustScore || 0) < 80
      );
    }
    return matchesSearch;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    return (b.profile?.trustScore || 0) - (a.profile?.trustScore || 0);
  });

  const totalPlayers = players.length;
  const verifiedCount = players.filter((p) => p.isVerified).length;
  const topCount = players.filter((p) => (p.profile?.trustScore || 0) >= 80).length;
  const risingCount = players.filter(
    (p) => (p.profile?.trustScore || 0) >= 60 && (p.profile?.trustScore || 0) < 80,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
            <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400 h-5 w-5" />
          </div>
          <p className="text-gray-400 text-sm">Loading players...</p>
        </div>
      </div>
    );
  }

  /* Stats card config. */
  const statCards = [
    { value: totalPlayers, label: "Total Players", icon: Users, tint: "text-blue-400", bg: "bg-blue-500/20" },
    { value: verifiedCount, label: "Verified", icon: CheckCircle, tint: "text-green-400", bg: "bg-green-500/20" },
    { value: topCount, label: "Top Players", icon: Star, tint: "text-yellow-400", bg: "bg-yellow-500/20" },
    { value: risingCount, label: "Rising", icon: TrendingUp, tint: "text-purple-400", bg: "bg-purple-500/20" },
  ];

  const filterButtons = [
    { id: "all" as const, label: "All", icon: null, active: "bg-indigo-600" },
    { id: "verified" as const, label: "Verified", icon: CheckCircle, active: "bg-green-600" },
    { id: "top" as const, label: "Top", icon: Star, active: "bg-yellow-600" },
    { id: "rising" as const, label: "Rising", icon: TrendingUp, active: "bg-purple-600" },
  ];

  return (
    <div className="relative">
      {/* Decorative gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 sm:text-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </span>
            Players
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Discover and connect with players in the league
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {statCards.map((s) => (
            <motion.div
              key={s.label}
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-gray-800/40 p-3 backdrop-blur-xl transition hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 ${s.bg} rounded-lg`}>
                  <s.icon className={`h-4 w-4 ${s.tint}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-gray-800/40 p-3 backdrop-blur-xl"
        >
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 pl-9 pr-9 py-2 text-sm text-white placeholder-gray-400 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              {/* Clear search button */}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-gray-900/40 p-0.5">
            {filterButtons.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                  filter === f.id
                    ? `${f.active} text-white`
                    : "text-gray-400 hover:bg-gray-600/30 hover:text-white"
                }`}
              >
                {f.icon && <f.icon size={11} />}
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 rounded-lg bg-gray-900/40 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-600/30 hover:text-white"
              }`}
            >
              <Grid3x3 size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-gray-600/30 hover:text-white"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </motion.div>

        {/* Players Grid / List */}
        {sortedPlayers.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              title="No Players Found"
              message={
                search
                  ? `No players match "${search}". Try a different search.`
                  : "There are no registered players yet. Check back later."
              }
              icon={Users}
            />
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          >
            {sortedPlayers.map((player) => {
              const username =
                player.profile?.username || player.name || "Unknown";
              const initial = username.charAt(0).toUpperCase();
              const trustScore = player.profile?.trustScore || 0;
              const isVerified = player.isVerified;
              const tier = trustTier(trustScore);

              return (
                <motion.div key={player.id} variants={itemVariants}>
                  <Link
                    href={`/players/${player.id}`}
                    className="group block rounded-2xl border border-white/10 bg-gray-800/40 p-4 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative">
                        {player.profile?.profilePicture ? (
                          <Image
                            src={
                              player.profile?.profilePicture ||
                              "/default-avatar.png"
                            }
                            alt={username || "Player"}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10 transition group-hover:ring-indigo-500/50"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-600 bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white transition-all group-hover:border-indigo-500">
                            {initial}
                          </div>
                        )}
                        {isVerified && (
                          <div className="absolute -top-0.5 -right-0.5 rounded-full border-2 border-gray-900 bg-blue-500 p-0.5">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 w-full">
                        <div className="flex items-center justify-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-indigo-400">
                            {username}
                          </p>
                          {trustScore >= 80 && (
                            <Star className="h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>

                        {/* Tier + trust chips */}
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tier.bg} ${tier.text} ${tier.ring}`}
                          >
                            {tier.label}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/50 px-2 py-0.5 text-[10px] text-gray-300 ring-1 ring-white/10">
                            <Shield size={9} className="text-indigo-400" />
                            {trustScore}
                          </span>
                        </div>

                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 transition group-hover:gap-1.5">
                          View Profile
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-2">
            {sortedPlayers.map((player) => {
              const username =
                player.profile?.username || player.name || "Unknown";
              const initial = username.charAt(0).toUpperCase();
              const trustScore = player.profile?.trustScore || 0;
              const isVerified = player.isVerified;
              const tier = trustTier(trustScore);

              return (
                <motion.div key={player.id} variants={itemVariants}>
                  <Link
                    href={`/players/${player.id}`}
                    className="group flex min-h-[44px] items-center gap-3 rounded-2xl border border-white/10 bg-gray-800/40 p-3 backdrop-blur-xl transition-all hover:border-indigo-500/40"
                  >
                    <div className="relative flex-shrink-0">
                      {player.profile?.profilePicture ? (
                        <Image
                          src={
                            player.profile.profilePicture || "/default-avatar.png"
                          }
                          alt={username}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                          {initial}
                        </div>
                      )}
                      {isVerified && (
                        <div className="absolute -top-0.5 -right-0.5 rounded-full border-2 border-gray-900 bg-blue-500 p-0.5">
                          <Shield className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-indigo-400">
                          {username}
                        </p>
                        {trustScore >= 80 && (
                          <Star className="h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                        )}
                        {isVerified && (
                          <span className="flex items-center gap-0.5 text-[10px] text-green-400">
                            <CheckCircle size={10} />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tier.bg} ${tier.text}`}
                        >
                          {tier.label}
                        </span>
                        <span>Trust: {trustScore}</span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-gray-500 transition-all group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="border-t border-white/10 pt-3 text-center text-xs text-gray-500"
        >
          Showing {sortedPlayers.length} of {players.length} players
        </motion.div>
      </motion.div>
    </div>
  );
}
