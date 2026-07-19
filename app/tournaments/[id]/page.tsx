"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Trophy,
  Calendar,
  Users,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Flame,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import TournamentFlow from "@/components/tournament/TournamentFlow";
import { SkeletonTournamentBracket, Skeleton } from "@/components/ui/Skeleton";
import { motion, type Variants } from "framer-motion";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homePlayerId: string | null;
  awayPlayerId: string | null;
  winnerId: string | null;
  status: string;
  homePlayer: {
    name: string;
    profile: { username: string; profilePicture: string };
  } | null;
  awayPlayer: {
    name: string;
    profile: { username: string; profilePicture: string };
  } | null;
  winner: {
    name: string;
    profile: { username: string; profilePicture?: string | null };
  } | null;
  result: { homeScore: number; awayScore: number; approved: boolean } | null;
}

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

/* Status presentation helper */
function statusConfig(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Live",
        dot: "bg-green-400 animate-pulse",
        pill: "bg-green-500/30 ring-green-400/40",
        icon: Flame,
        iconColor: "text-green-300",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        dot: "bg-blue-400",
        pill: "bg-blue-500/30 ring-blue-400/40",
        icon: Crown,
        iconColor: "text-blue-300",
      };
    default:
      return {
        label: "Upcoming",
        dot: "bg-yellow-400",
        pill: "bg-yellow-500/30 ring-yellow-400/40",
        icon: Clock,
        iconColor: "text-yellow-300",
      };
  }
}

export default function TournamentPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchTournament() {
    try {
      const res = await fetch(`/api/tournaments/${id}`);

      if (!res.ok) {
        if (res.status === 404) {
          setTournament(null);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setTournament(data.tournament);
      setMatches(data.matches || []);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      toast.error("Failed to load tournament");
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Show header with tournament info
  if (loading) {
    return (
      <div className="relative min-h-screen py-8">
        <DecorBackground />
        <div className="mx-auto max-w-7xl px-4">
          <Skeleton variant="card" className="mb-8 h-40" />
          <SkeletonTournamentBracket />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4">
        <DecorBackground />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-white/10 bg-gray-800/40 p-10 text-center shadow-2xl backdrop-blur-xl"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/40 ring-1 ring-white/10">
            <Trophy className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Tournament Not Found
          </h2>
          <p className="text-gray-400">
            The tournament you&apos;re looking for doesn&apos;t exist or
            hasn&apos;t been created yet.
          </p>
          <Link
            href="/tournaments"
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-4 py-2 text-indigo-400 transition-all hover:bg-white/10 hover:text-indigo-300"
          >
            <ArrowLeft size={16} />
            View All Tournaments
          </Link>
        </motion.div>
      </div>
    );
  }

  const cfg = statusConfig(tournament.status);
  const StatusIcon = cfg.icon;
  const participantCount = tournament.participants?.length || 0;

  return (
    <div className="relative min-h-screen py-8">
      <DecorBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-4"
      >
        {/* Back link */}
        <motion.div variants={itemVariants} className="mb-4">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            All Tournaments
          </Link>
        </motion.div>

        {/* ✅ Header - Restored with View Stats */}
        <motion.div
          variants={itemVariants}
          className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 shadow-2xl shadow-indigo-500/20 md:p-8"
        >
          <div className="absolute inset-0 bg-black/20" />
          <motion.div
            className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-pink-400/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                    <Trophy className="h-7 w-7 text-yellow-300" />
                  </span>
                  <h1 className="text-2xl font-bold text-white md:text-3xl">
                    {tournament.name}
                  </h1>
                </div>
                <p className="max-w-2xl text-sm text-white/80 md:text-base">
                  {tournament.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs md:text-sm">
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur-sm">
                    <Calendar size={14} className="text-white/70" />
                    <span className="text-white/80">
                      {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur-sm">
                    <Users size={14} className="text-white/70" />
                    <span className="text-white/80">
                      {participantCount} / {tournament.maxPlayers} Players
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 backdrop-blur-sm ${cfg.pill}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <StatusIcon size={13} className={cfg.iconColor} />
                    <span className="font-medium text-white/90">
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Participant avatar stack */}
                {participantCount > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {tournament.participants
                        .slice(0, 6)
                        .map((p: any, i: number) => {
                          const pName =
                            p?.user?.profile?.username ||
                            p?.user?.name ||
                            p?.profile?.username ||
                            p?.name ||
                            "P";
                          return (
                            <span
                              key={i}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white ring-2 ring-purple-700/60"
                              title={pName}
                            >
                              {String(pName).charAt(0).toUpperCase()}
                            </span>
                          );
                        })}
                    </div>
                    {participantCount > 6 && (
                      <span className="text-xs font-medium text-white/80">
                        +{participantCount - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Link
                href={`/tournaments/${id}/stats`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/20 backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <BarChart3 size={16} />
                View Stats →
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ✅ Tournament Flow - Contains Champion Section */}
        <motion.div variants={itemVariants}>
          <TournamentFlow />
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
