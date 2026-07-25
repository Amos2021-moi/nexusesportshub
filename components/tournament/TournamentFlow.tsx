"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MatchCard from "./MatchCard";
import ChampionSection from "./ChampionSection";

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
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Loading Spinner ===
const LoadingSpinner = memo(() => {
  const isMobile = useIsMobile();
  const spinClass = isMobile ? "" : "animate-spin";

  return (
    <div className="flex h-96 items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30" />
          <div className={`absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent ${spinClass}`} />
        </div>
        <p className="mt-2 font-medium text-gray-400">Loading bracket...</p>
      </div>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

// === STATIC Empty State ===
const EmptyState = memo(() => (
  <div className="flex h-96 flex-col items-center justify-center gap-4 px-4">
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
));

EmptyState.displayName = "EmptyState";

// === STATIC Round Header ===
const RoundHeader = memo(({ 
  roundName, 
  accent, 
  matchCount 
}: { 
  roundName: string; 
  accent: string; 
  matchCount: number;
}) => (
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
        {matchCount} {matchCount === 1 ? "match" : "matches"}
      </span>
    </div>
  </div>
));

RoundHeader.displayName = "RoundHeader";

// === STATIC Progress Bar ===
const ProgressBar = memo(({ 
  progress, 
  completedMatches, 
  totalMatches 
}: { 
  progress: number; 
  completedMatches: number; 
  totalMatches: number;
}) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-400">
      {completedMatches} / {totalMatches} matches
    </span>
    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-700/60">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
));

ProgressBar.displayName = "ProgressBar";

// === STATIC Bracket Header ===
const BracketHeader = memo(({ 
  tournamentName, 
  totalMatches, 
  completedMatches, 
  bracketProgress 
}: { 
  tournamentName: string; 
  totalMatches: number; 
  completedMatches: number; 
  bracketProgress: number;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4">
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
      <ProgressBar 
        progress={bracketProgress} 
        completedMatches={completedMatches} 
        totalMatches={totalMatches} 
      />
    )}
  </div>
));

BracketHeader.displayName = "BracketHeader";

// === STATIC Round Column ===
const RoundColumn = memo(({ 
  round, 
  roundName, 
  matches, 
  accent, 
  onMatchClick 
}: { 
  round: number; 
  roundName: string; 
  matches: Match[]; 
  accent: string; 
  onMatchClick: (match: Match) => void;
}) => {
  const isMobile = useIsMobile();
  const gapClass = isMobile ? "gap-4" : "gap-6";

  return (
    <div className="min-w-[180px] flex-1 sm:min-w-[220px]">
      <RoundHeader roundName={roundName} accent={accent} matchCount={matches.length} />
      <div className={`flex flex-col justify-center ${gapClass} lg:h-full`}>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onClick={() => onMatchClick(match)} />
        ))}
      </div>
    </div>
  );
});

RoundColumn.displayName = "RoundColumn";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function TournamentFlow() {
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = useCallback(async () => {
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
  }, [id]);

  // ✅ Memoized rounds grouping
  const { rounds, sortedRoundKeys, roundNames } = useMemo(() => {
    const roundsMap: { [key: number]: Match[] } = {};
    matches.forEach((match) => {
      if (!roundsMap[match.round]) roundsMap[match.round] = [];
      roundsMap[match.round].push(match);
    });

    const names: { [key: number]: string } = {
      1: "Quarter Finals",
      2: "Semi Finals",
      3: "Final",
      4: "Champion",
    };

    const sortedKeys = Object.keys(roundsMap).sort((a, b) => Number(a) - Number(b));

    return { rounds: roundsMap, sortedRoundKeys: sortedKeys, roundNames: names };
  }, [matches]);

  // ✅ Memoized champion
  const champion = useMemo(() => {
    if (tournament?.status !== "COMPLETED") return null;
    
    const finalRound = Math.max(...sortedRoundKeys.map(Number));
    const finalMatches = rounds[finalRound] || [];
    const finalMatch = finalMatches[0];

    if (finalMatch?.winner && finalMatch.winnerId) {
      return {
        id: finalMatch.winnerId,
        name: finalMatch.winner.name,
        profile: {
          username: finalMatch.winner.profile.username,
          profilePicture: finalMatch.winner.profile.profilePicture || "",
        },
      };
    }
    return null;
  }, [tournament, rounds, sortedRoundKeys]);

  // ✅ Memoized progress
  const { totalMatches, completedMatches, bracketProgress } = useMemo(() => {
    const total = matches.length;
    const completed = matches.filter((m) => m.status === "COMPLETED").length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { totalMatches: total, completedMatches: completed, bracketProgress: progress };
  }, [matches]);

  // ✅ Round accents
  const roundAccents = [
    "from-indigo-500 to-blue-500",
    "from-purple-500 to-indigo-500",
    "from-pink-500 to-purple-500",
    "from-yellow-500 to-orange-500",
  ];

  // ✅ Handle match click
  const handleMatchClick = useCallback((match: Match) => {
    // You can add navigation or modal opening here
    console.log("Match clicked:", match.id);
  }, []);

  // ✅ Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ Empty state
  if (!tournament) {
    return <EmptyState />;
  }

  const isCompleted = tournament.status === "COMPLETED";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Champion Section - Only show if tournament is COMPLETED */}
      {isCompleted && champion && (
        <ChampionSection
          champion={champion}
          tournamentName={tournament.name}
          tournamentId={tournament.id}
        />
      )}

      {/* Bracket - NO animations */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-2xl backdrop-blur-xl">
        {/* Bracket header with progress */}
        <BracketHeader 
          tournamentName={tournament.name}
          totalMatches={totalMatches}
          completedMatches={completedMatches}
          bracketProgress={bracketProgress}
        />

        {/* Scrollable bracket body - NO animations */}
        <div className="overflow-x-auto p-4 sm:p-6">
          <div className={`flex min-w-[700px] flex-col ${isMobile ? 'gap-8' : 'gap-8'} lg:flex-row`}>
            {sortedRoundKeys.map((roundKey, colIndex) => {
              const round = Number(roundKey);
              const roundMatches = rounds[round];
              const roundName = roundNames[round] || `Round ${round}`;
              const accent = roundAccents[colIndex % roundAccents.length];

              return (
                <RoundColumn
                  key={round}
                  round={round}
                  roundName={roundName}
                  matches={roundMatches}
                  accent={accent}
                  onMatchClick={handleMatchClick}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}