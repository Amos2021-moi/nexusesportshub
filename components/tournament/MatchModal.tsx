"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { X, User, Shield, Calendar, Trophy, CheckCircle, Clock, Image as ImageIcon, Eye, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homePlayerId: string | null;
  awayPlayerId: string | null;
  winnerId: string | null;
  status: string;
  homePlayer: { name: string; profile: { username: string; profilePicture: string; class?: string } } | null;
  awayPlayer: { name: string; profile: { username: string; profilePicture: string; class?: string } } | null;
  winner: { name: string; profile: { username: string; profilePicture?: string | null } } | null;
  result: { homeScore: number; awayScore: number; approved: boolean; evidenceImage?: string } | null;
}

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onUpdate?: () => void;
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
const StatusBadge = memo(({ status, approved }: { status: string; approved?: boolean }) => {
  let bgColor = "bg-blue-500/20 text-blue-400";
  let label = status;

  if (status === "COMPLETED") {
    bgColor = "bg-green-500/20 text-green-400";
    label = "Completed";
  } else if (status === "PENDING") {
    bgColor = "bg-yellow-500/20 text-yellow-400";
    label = "Pending";
  } else if (status === "SCHEDULED") {
    bgColor = "bg-blue-500/20 text-blue-400";
    label = "Scheduled";
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${bgColor}`}>
      {label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

// === STATIC Player Row ===
const PlayerRow = memo(({ 
  player, 
  name, 
  score, 
  isWinner, 
  isHome 
}: { 
  player: any; 
  name: string; 
  score: number | null | undefined; 
  isWinner: boolean; 
  isHome: boolean;
}) => {
  const gradientClass = isHome 
    ? "bg-gradient-to-r from-indigo-500 to-purple-500" 
    : "bg-gradient-to-r from-purple-500 to-pink-500";
  const playerClass = player?.profile?.class || "";

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      {player?.profile?.profilePicture ? (
        <img 
          src={player.profile.profilePicture} 
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`w-12 h-12 rounded-full ${gradientClass} flex items-center justify-center text-white font-bold text-lg`}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold text-white">{name}</p>
        {playerClass && <p className="text-xs text-gray-400">{playerClass}</p>}
      </div>
      {score !== undefined && score !== null && (
        <span className={`text-2xl font-bold ${isWinner ? "text-green-400" : "text-white"}`}>
          {score}
        </span>
      )}
    </div>
  );
});

PlayerRow.displayName = "PlayerRow";

// === STATIC Spinner ===
const Spinner = memo(() => {
  const isMobile = useIsMobile();
  const spinClass = isMobile ? "" : "animate-spin";

  return (
    <div className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full ${spinClass}`} />
  );
});

Spinner.displayName = "Spinner";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function MatchModal({ isOpen, onClose, match, onUpdate }: MatchModalProps) {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [approving, setApproving] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  // ✅ If no match or not open, return null
  if (!match || !isOpen) return null;

  const getPlayerName = useCallback((player: any) => {
    return player?.profile?.username || player?.name || "TBD";
  }, []);

  const homeName = getPlayerName(match.homePlayer);
  const awayName = getPlayerName(match.awayPlayer);
  const hasResult = match.result !== null;
  const isAdmin = session?.user?.role === "ADMIN";
  const isPending = match.status === "PENDING";

  const handleApprove = useCallback(async () => {
    if (!match?.result) return;

    setApproving(true);
    try {
      const res = await fetch("/api/admin/results/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id })
      });
      
      if (res.ok) {
        toast.success("Result approved!");
        if (onUpdate) onUpdate();
        onClose();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Error approving result:", error);
      toast.error("Network error");
    } finally {
      setApproving(false);
    }
  }, [match, onUpdate, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleEvidence = useCallback(() => {
    setShowEvidence(prev => !prev);
  }, []);

  // ✅ Modal - NO animations
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop - NO animation */}
      <div onClick={handleClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal - NO animations */}
      <div className="fixed inset-4 z-50 max-w-2xl mx-auto my-auto h-fit max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl" style={{ overscrollBehavior: 'contain' }}>
        {/* Header - NO animations */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 p-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Match Details</h2>
              <p className="text-xs text-gray-400">Match {match.matchNumber} • Round {match.round}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content - NO animations */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status} />
            {match.result?.approved && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={12} />
                Approved
              </span>
            )}
          </div>

          {/* Players - NO animations */}
          <div className="space-y-4">
            <PlayerRow 
              player={match.homePlayer}
              name={homeName}
              score={match.result?.homeScore}
              isWinner={match.winner?.profile?.username === homeName}
              isHome={true}
            />

            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-500">vs</span>
            </div>

            <PlayerRow 
              player={match.awayPlayer}
              name={awayName}
              score={match.result?.awayScore}
              isWinner={match.winner?.profile?.username === awayName}
              isHome={false}
            />
          </div>

          {/* Evidence - NO animations */}
          {match.result?.evidenceImage && (
            <div>
              <button
                onClick={toggleEvidence}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-150 min-h-[44px]"
              >
                <ImageIcon size={16} />
                {showEvidence ? "Hide Evidence" : "View Evidence"}
              </button>
              {showEvidence && (
                <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <img 
                    src={match.result.evidenceImage} 
                    alt="Evidence" 
                    className="max-h-64 w-full object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )}

          {/* Admin Actions - NO animations */}
          {isAdmin && isPending && (
            <div className="border-t border-gray-700 pt-4">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {approving ? (
                  <Spinner />
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Approve Result
                  </>
                )}
              </button>
            </div>
          )}

          {/* Player Actions - NO animations */}
          {!isAdmin && isPending && (
            <div className="border-t border-gray-700 pt-4 text-center">
              <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                <Clock size={16} />
                Waiting for admin approval
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

