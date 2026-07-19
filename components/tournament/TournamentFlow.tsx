"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MatchCard from "./MatchCard";
import ChampionSection from "./ChampionSection";
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

const roundColumnVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const matchVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function TournamentFlow() {
  const { id } = useParams();
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
      const data = await res.json();
      setTournament(data.tournament);
      setMatches(data.matches || []);
    } catch (error) {
      console.error("Error fetching tournament:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
          <p className="mt-2 font-medium text-gray-400">Loading bracket...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-10 text-center shadow-2xl backdrop-blur-xl">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 4h10v3a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V4Z" />
            <path d="M8 7h8" />
            <path d="M4 7a3 3 0 0 0 3 3h0" />
            <path d="M20 7a3 3 0 0 1-3 3h0" />
            <path d="M8 16h8" />
            <path d="M12 11v9" />
            <path d="M7 20h10" />
          </svg>
          <p className="mt-2 font-medium text-gray-400">Tournament not found</p>
        </div>
      </div>
    );
  }

  // Group matches by round
  const rounds: { [key: number]: Match[] } = {};
  matches.forEach((match) => {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  });

  const roundNames: { [key: number]: string } = {
    1: "Quarter Finals",
    2: "Semi Finals",
    3: "Final",
    4: "Champion",
  };

  // ✅ Get the champion from the final match with id
  const getChampion = () => {
    const finalRound = Math.max(...Object.keys(rounds).map(Number));
    const finalMatches = rounds[finalRound] || [];
    const finalMatch = finalMatches[0];

    if (finalMatch?.winner && finalMatch.winnerId) {
      return {
        id: finalMatch.winnerId,
        name: finalMatch.winner.name,
        profile: {
          username: finalMatch.winner.profile.username,
          // ensure profilePicture is always a string to satisfy ChampionSection prop types
          profilePicture: finalMatch.winner.profile.profilePicture || "",
        },
      };
    }
    return null;
  };

  const champion = getChampion();
  const isCompleted = tournament.status === "COMPLETED";

  const sortedRoundKeys = Object.keys(rounds).sort(
    (a, b) => Number(a) - Number(b)
  );

  // Total/completed for the bracket progress strip (read-only, derived)
  const totalMatches = matches.length;
  const completedMatches = matches.filter(
    (m) => m.status === "COMPLETED"
  ).length;
  const bracketProgress =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  /* Per-round accent color cycling through the brand palette */
  const roundAccents = [
    "from-indigo-500 to-blue-500",
    "from-purple-500 to-indigo-500",
    "from-pink-500 to-purple-500",
    "from-yellow-500 to-orange-500",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ✅ Champion Section - Only show if tournament is COMPLETED */}
      {isCompleted && champion && (
        <ChampionSection
          champion={champion}
          tournamentName={tournament.name}
          tournamentId={tournament.id}
        />
      )}

      {/* Bracket */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl">
        {/* Bracket header with progress */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 3v6a6 6 0 0 0 12 0V3" />
                <path d="M4 3h16" />
                <path d="M12 15v6" />
                <path d="M8 21h8" />
              </svg>
            </span>
            <h2 className="text-lg font-bold text-white">Tournament Bracket</h2>
          </div>
          {totalMatches > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {completedMatches} / {totalMatches} matches
              </span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-700/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${bracketProgress}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable bracket body */}
        <div className="overflow-x-auto p-6">
          <div className="flex min-w-[800px] flex-col gap-8 lg:flex-row">
            {sortedRoundKeys.map((roundKey, colIndex) => {
              const round = Number(roundKey);
              const roundMatches = rounds[round];
              const roundName = roundNames[round] || `Round ${round}`;
              const accent =
                roundAccents[colIndex % roundAccents.length];

              return (
                <motion.div
                  key={round}
                  variants={roundColumnVariants}
                  initial="hidden"
                  animate="visible"
                  className="min-w-[220px] flex-1"
                >
                  {/* Round header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${accent} px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg`}
                      >
                        {roundName}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-500">
                      <span>
                        {roundMatches.length}{" "}
                        {roundMatches.length === 1 ? "match" : "matches"}
                      </span>
                    </div>
                  </div>

                  {/* Matches in this round (vertically centered for bracket feel) */}
                  <div className="flex flex-col justify-center gap-6 lg:h-full">
                    {roundMatches.map((match) => (
                      <motion.div key={match.id} variants={matchVariants}>
                        <MatchCard match={match} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
