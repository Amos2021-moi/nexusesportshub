"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle, ChevronRight, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

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
  onClick?: () => void; // ✅ ADD THIS
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);

  const getPlayerName = (player: any) => {
    return player?.profile?.username || player?.name || "TBD";
  };

  const getPlayerInitial = (player: any) => {
    const name = getPlayerName(player);
    return name.charAt(0).toUpperCase();
  };

  const homeName = getPlayerName(match.homePlayer);
  const awayName = getPlayerName(match.awayPlayer);
  const homeInitial = getPlayerInitial(match.homePlayer);
  const awayInitial = getPlayerInitial(match.awayPlayer);
  const winnerName =
    match.winner?.profile?.username || match.winner?.name || null;
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

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-gray-800/50 shadow-lg backdrop-blur-xl transition-all ${
        isHovered
          ? "border-indigo-500/50 shadow-indigo-500/10"
          : "border-white/10"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Subtle glow accent */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/5 blur-2xl transition-opacity duration-300 group-hover:bg-indigo-500/15" />

      {/* Match Header */}
      <div className="relative flex items-center justify-between border-b border-white/5 bg-gray-900/40 px-3 py-1.5">
        <span className="text-xs text-gray-500">Match {match.matchNumber}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
            isCompleted
              ? "bg-green-500/20 text-green-400 ring-green-500/30"
              : isPending
              ? "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30"
              : isScheduled
              ? "bg-blue-500/20 text-blue-400 ring-blue-500/30"
              : "bg-gray-600/20 text-gray-400 ring-gray-500/30"
          }`}
        >
          {isCompleted
            ? "Completed"
            : isPending
            ? "Pending"
            : isScheduled
            ? "Scheduled"
            : "Unknown"}
        </span>
      </div>

      {/* Match Content */}
      <div className="relative space-y-2 p-3">
        {/* Home Player */}
        <div
          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
            homeIsWinner ? "bg-green-500/10 ring-1 ring-green-500/20" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {match.homePlayer?.profile?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.homePlayer.profile.profilePicture}
                alt={homeName}
                className={`h-7 w-7 rounded-full object-cover ring-2 ${
                  homeIsWinner ? "ring-green-400/60" : "ring-white/10"
                }`}
              />
            ) : (
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ${
                  homeIsWinner
                    ? "bg-green-500/30 ring-green-400/60"
                    : "bg-gradient-to-br from-indigo-500/40 to-indigo-600/30 ring-white/10"
                }`}
              >
                {homeInitial}
              </div>
            )}
            <span
              className={`text-sm font-medium ${
                homeIsWinner ? "font-semibold text-green-400" : "text-white"
              }`}
            >
              {homeName}
            </span>
            {homeIsWinner && (
              <Trophy size={12} className="text-yellow-400" />
            )}
          </div>
          {hasResult && (
            <span
              className={`flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-sm font-bold ${
                homeIsWinner
                  ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/30"
                  : "bg-white/5 text-white ring-1 ring-white/10"
              }`}
            >
              {match.result?.homeScore}
            </span>
          )}
        </div>

        {/* VS Separator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            vs
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Away Player */}
        <div
          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
            awayIsWinner ? "bg-green-500/10 ring-1 ring-green-500/20" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {match.awayPlayer?.profile?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={match.awayPlayer.profile.profilePicture}
                alt={awayName}
                className={`h-7 w-7 rounded-full object-cover ring-2 ${
                  awayIsWinner ? "ring-green-400/60" : "ring-white/10"
                }`}
              />
            ) : (
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ${
                  awayIsWinner
                    ? "bg-green-500/30 ring-green-400/60"
                    : "bg-gradient-to-br from-purple-500/40 to-purple-600/30 ring-white/10"
                }`}
              >
                {awayInitial}
              </div>
            )}
            <span
              className={`text-sm font-medium ${
                awayIsWinner ? "font-semibold text-green-400" : "text-white"
              }`}
            >
              {awayName}
            </span>
            {awayIsWinner && (
              <Trophy size={12} className="text-yellow-400" />
            )}
          </div>
          {hasResult && (
            <span
              className={`flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-sm font-bold ${
                awayIsWinner
                  ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/30"
                  : "bg-white/5 text-white ring-1 ring-white/10"
              }`}
            >
              {match.result?.awayScore}
            </span>
          )}
        </div>

        {/* Status Message and Submit Button */}
        <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-2">
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

          {canSubmit && isScheduled ? (
            <Link
              href={`/tournaments/matches/${match.id}/submit`}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50"
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
    </motion.div>
  );
}
