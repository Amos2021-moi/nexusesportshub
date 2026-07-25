"use client";

import { useState, useCallback,useEffect, memo } from "react";
import Link from "next/link";
import { Clock, CheckCircle, ChevronRight, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";

interface MatchCardProps {
  match: {
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
  };
  onClick?: () => void;
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

// === STATIC Status Badge ===
const StatusBadge = memo(({ status }: { status: string }) => {
  const isCompleted = status === "COMPLETED";
  const isPending = status === "PENDING";
  const isScheduled = status === "SCHEDULED";

  let bgColor = "bg-gray-600/20 text-gray-400 ring-gray-500/30";
  let label = "Unknown";

  if (isCompleted) {
    bgColor = "bg-green-500/20 text-green-400 ring-green-500/30";
    label = "Completed";
  } else if (isPending) {
    bgColor = "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30";
    label = "Pending";
  } else if (isScheduled) {
    bgColor = "bg-blue-500/20 text-blue-400 ring-blue-500/30";
    label = "Scheduled";
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${bgColor}`}>
      {label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// === STATIC Player Row ===
const PlayerRow = memo(({ 
  player, 
  name, 
  initial, 
  isWinner, 
  score, 
  isHome 
}: { 
  player: any; 
  name: string; 
  initial: string; 
  isWinner: boolean; 
  score: number | null | undefined; 
  isHome: boolean;
}) => {
  const isMobile = useIsMobile();
  const gradientClass = isHome 
    ? "bg-gradient-to-br from-indigo-500/40 to-indigo-600/30" 
    : "bg-gradient-to-br from-purple-500/40 to-purple-600/30";
  const winnerGradientClass = isHome
    ? "bg-green-500/30 ring-green-400/60"
    : "bg-green-500/30 ring-green-400/60";

  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150 ${
      isWinner ? "bg-green-500/10 ring-1 ring-green-500/20" : ""
    }`}>
      <div className="flex items-center gap-2">
        {player?.profile?.profilePicture ? (
          <img
            src={player.profile.profilePicture}
            alt={name}
            className={`h-7 w-7 rounded-full object-cover ring-2 ${
              isWinner ? "ring-green-400/60" : "ring-white/10"
            }`}
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ${
              isWinner ? winnerGradientClass : gradientClass
            }`}
          >
            {initial}
          </div>
        )}
        <span className={`text-sm font-medium ${
          isWinner ? "font-semibold text-green-400" : "text-white"
        }`}>
          {name}
        </span>
        {isWinner && <Trophy size={12} className="text-yellow-400" />}
      </div>
      {score !== undefined && score !== null && (
        <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-sm font-bold ${
          isWinner
            ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/30"
            : "bg-white/5 text-white ring-1 ring-white/10"
        }`}>
          {score}
        </span>
      )}
    </div>
  );
});

PlayerRow.displayName = "PlayerRow";

// === STATIC VS Separator ===
const VSSeparator = memo(() => (
  <div className="flex items-center justify-center gap-2">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
      vs
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
  </div>
));

VSSeparator.displayName = "VSSeparator";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  const getPlayerName = useCallback((player: any) => {
    return player?.profile?.username || player?.name || "TBD";
  }, []);

  const getPlayerInitial = useCallback((player: any) => {
    const name = getPlayerName(player);
    return name.charAt(0).toUpperCase();
  }, [getPlayerName]);

  const homeName = getPlayerName(match.homePlayer);
  const awayName = getPlayerName(match.awayPlayer);
  const homeInitial = getPlayerInitial(match.homePlayer);
  const awayInitial = getPlayerInitial(match.awayPlayer);
  const winnerName = match.winner?.profile?.username || match.winner?.name || null;
  const hasResult = match.result !== null;

  const isUserPartOfMatch =
    match.homePlayerId === session?.user?.id ||
    match.awayPlayerId === session?.user?.id;

  const canSubmit =
    match.status === "SCHEDULED" &&
    match.homePlayerId &&
    match.awayPlayerId &&
    isUserPartOfMatch;

  const isPending = match.status === "PENDING";
  const isCompleted = match.status === "COMPLETED";
  const isScheduled = match.status === "SCHEDULED";

  const homeIsWinner = winnerName === homeName;
  const awayIsWinner = winnerName === awayName;

  // NO hover effects on mobile
  const hoverClass = isMobile ? "" : "hover:border-indigo-500/50 hover:shadow-indigo-500/10";

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-gray-800/50 shadow-lg backdrop-blur-xl transition-colors duration-150 ${hoverClass} ${
        isMobile ? "border-white/10" : "border-white/10"
      }`}
      onClick={onClick}
    >
      {/* Subtle glow accent - NO animation */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/5 blur-2xl transition-opacity duration-300 group-hover:bg-indigo-500/15" />

      {/* Match Header - NO animations */}
      <div className="relative flex items-center justify-between border-b border-white/5 bg-gray-900/40 px-3 py-1.5">
        <span className="text-xs text-gray-500">Match {match.matchNumber}</span>
        <StatusBadge status={match.status} />
      </div>

      {/* Match Content - NO animations */}
      <div className="relative space-y-2 p-3">
        <PlayerRow 
          player={match.homePlayer}
          name={homeName}
          initial={homeInitial}
          isWinner={homeIsWinner}
          score={match.result?.homeScore}
          isHome={true}
        />

        <VSSeparator />

        <PlayerRow 
          player={match.awayPlayer}
          name={awayName}
          initial={awayInitial}
          isWinner={awayIsWinner}
          score={match.result?.awayScore}
          isHome={false}
        />

        {/* Status Message and Submit Button - NO animations */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
          <div className="flex items-center gap-1">
            {isPending && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Clock size={12} />
                Pending approval
              </span>
            )}
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle size={12} />
                Completed
              </span>
            )}
            {isScheduled && !canSubmit && (
              <span className="text-xs text-gray-500">Waiting for players</span>
            )}
          </div>

          {canSubmit && isScheduled ? (
            <Link
              href={`/tournaments/matches/${match.id}/submit`}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-500/30 transition-colors duration-150 hover:shadow-indigo-500/50"
              onClick={(e) => e.stopPropagation()}
            >
              Submit Result
              <ChevronRight size={12} />
            </Link>
          ) : isPending ? (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <Clock size={12} />
              Pending
            </span>
          ) : isCompleted ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle size={12} />
              Done
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}