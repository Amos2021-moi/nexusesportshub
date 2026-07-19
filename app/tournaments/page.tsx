"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  ChevronRight,
  Crown,
  Sparkles,
  Clock,
  Flame,
  Award,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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
}

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    const res = await fetch("/api/tournaments");
    const data = await res.json();
    setTournaments(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  // Summary counts (read-only, derived from tournaments)
  const liveCount = useMemo(
    () => tournaments.filter((t) => t.status === "ACTIVE").length,
    [tournaments]
  );
  const upcomingCount = useMemo(
    () =>
      tournaments.filter(
        (t) => t.status !== "ACTIVE" && t.status !== "COMPLETED"
      ).length,
    [tournaments]
  );

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <DecorBackground />
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
          </div>
          <p className="mt-2 font-medium text-gray-400">
            Loading tournaments...
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          bg: "bg-green-500/20",
          text: "text-green-400",
          label: "LIVE",
          icon: Flame,
        };
      case "COMPLETED":
        return {
          bg: "bg-blue-500/20",
          text: "text-blue-400",
          label: "ENDED",
          icon: Crown,
        };
      default:
        return {
          bg: "bg-yellow-500/20",
          text: "text-yellow-400",
          label: "UPCOMING",
          icon: Clock,
        };
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "SINGLE_ELIM" ? "🏆" : "🥇";
  };

  return (
    <div className="relative min-h-screen py-8">
      <DecorBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl space-y-8 px-4"
      >
        {/* Hero Section */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl shadow-indigo-500/20"
        >
          <div className="absolute inset-0 bg-black/20" />
          <motion.div
            className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-pink-400/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                <Trophy className="h-7 w-7 text-yellow-300" />
              </span>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Tournaments
              </h1>
            </div>
            <p className="max-w-2xl text-lg text-white/80">
              Compete in knockout competitions and prove you&apos;re the
              champion
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
                <Sparkles size={14} className="text-yellow-300" />
                <span className="text-sm text-white/80">
                  Single Elimination
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
                <Crown size={14} className="text-yellow-300" />
                <span className="text-sm text-white/80">Win to Advance</span>
              </div>
              {liveCount > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1.5 backdrop-blur-sm ring-1 ring-green-400/30">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-300" />
                  <span className="text-sm font-medium text-green-200">
                    {liveCount} Live Now
                  </span>
                </div>
              )}
              {upcomingCount > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
                  <Clock size={14} className="text-white/80" />
                  <span className="text-sm text-white/80">
                    {upcomingCount} Upcoming
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              title="No Tournaments Yet"
              message="Stay tuned! Tournaments will appear here when they're created."
              icon={Trophy}
              buttonText="Check Back Later"
            />
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {tournaments.map((tournament, index) => {
                const statusConfig = getStatusColor(tournament.status);
                const StatusIcon = statusConfig.icon;
                const totalParticipants = tournament.participants?.length || 0;
                const totalMatches = tournament.matches?.length || 0;
                const completedMatches =
                  tournament.matches?.filter((m) => m.status === "COMPLETED")
                    .length || 0;
                const progress =
                  totalMatches > 0
                    ? (completedMatches / totalMatches) * 100
                    : 0;

                return (
                  <motion.div
                    key={tournament.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <Link href={`/tournaments/${tournament.id}`}>
                      <div className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/20">
                        {/* Gradient glow accent */}
                        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-opacity duration-300 group-hover:bg-indigo-500/20" />

                        {/* Top progress bar (active) */}
                        {tournament.status === "ACTIVE" && (
                          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            <motion.div
                              className="h-full bg-white/30"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                        )}

                        <div className="relative p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Header */}
                              <div className="mb-3 flex flex-wrap items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-2xl ring-1 ring-white/10">
                                  {getTypeIcon(tournament.type)}
                                </div>
                                <h2 className="text-xl font-bold text-white transition-colors group-hover:text-indigo-400">
                                  {tournament.name}
                                </h2>
                                <div
                                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ring-white/10 backdrop-blur-sm ${statusConfig.bg}`}
                                >
                                  <StatusIcon
                                    size={12}
                                    className={statusConfig.text}
                                  />
                                  <span
                                    className={`text-xs font-semibold ${statusConfig.text}`}
                                  >
                                    {statusConfig.label}
                                  </span>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                                {tournament.description ||
                                  "Compete in this exciting knockout tournament!"}
                              </p>

                              {/* Stats */}
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-gray-300 ring-1 ring-white/5">
                                  <Calendar
                                    size={14}
                                    className="text-indigo-400"
                                  />
                                  <span>
                                    {new Date(
                                      tournament.startDate
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                    {tournament.endDate &&
                                      ` - ${new Date(
                                        tournament.endDate
                                      ).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                      })}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-gray-300 ring-1 ring-white/5">
                                  <Users
                                    size={14}
                                    className="text-indigo-400"
                                  />
                                  <span>
                                    {totalParticipants} / {tournament.maxPlayers}{" "}
                                    Players
                                  </span>
                                </div>
                                {tournament.status === "ACTIVE" &&
                                  totalMatches > 0 && (
                                    <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-gray-300 ring-1 ring-white/5">
                                      <Trophy
                                        size={14}
                                        className="text-yellow-500"
                                      />
                                      <span>
                                        {completedMatches} / {totalMatches}{" "}
                                        Matches
                                      </span>
                                    </div>
                                  )}
                              </div>

                              {/* Capacity bar (subtle, for all statuses) */}
                              {tournament.maxPlayers > 0 && (
                                <div className="mt-4">
                                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                                    <span>Roster</span>
                                    <span>
                                      {Math.round(
                                        Math.min(
                                          (totalParticipants /
                                            tournament.maxPlayers) *
                                            100,
                                          100
                                        )
                                      )}
                                      % full
                                    </span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-700/60">
                                    <motion.div
                                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(
                                          (totalParticipants /
                                            tournament.maxPlayers) *
                                            100,
                                          100
                                        )}%`,
                                      }}
                                      transition={{
                                        duration: 0.6,
                                        ease: "easeOut",
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Arrow & CTA */}
                            <div className="flex items-center gap-4">
                              {tournament.status === "ACTIVE" && (
                                <div className="hidden items-center gap-1 rounded-full bg-green-500/20 px-3 py-1.5 ring-1 ring-green-400/30 sm:flex">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                                  <span className="text-xs font-medium text-green-400">
                                    LIVE
                                  </span>
                                </div>
                              )}
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700/50 ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600">
                                <ChevronRight
                                  size={20}
                                  className="text-gray-400 transition-colors group-hover:text-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Progress indicator for active tournaments */}
                          {tournament.status === "ACTIVE" &&
                            totalMatches > 0 && (
                              <div className="mt-4">
                                <div className="mb-1 flex justify-between text-xs text-gray-500">
                                  <span>Tournament Progress</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{
                                      duration: 0.6,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Footer Info */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-gray-800/40 p-5 text-center shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-green-400" />
              <span className="text-gray-400">Live Tournament</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={14} className="text-yellow-400" />
              <span className="text-gray-400">Winner Takes All</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-blue-400" />
              <span className="text-gray-400">Single Elimination</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* Decorative animated gradient background with blur orbs + grid overlay */
function DecorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-[120px]" />
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
