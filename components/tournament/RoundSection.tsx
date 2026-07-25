"use client";

import { memo, useEffect, useState } from "react";
import MatchCard from "./MatchCard";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homePlayerId: string | null;
  awayPlayerId: string | null;
  winnerId: string | null;
  status: string;
  homePlayer: { name: string; profile: { username: string; profilePicture: string } } | null;
  awayPlayer: { name: string; profile: { username: string; profilePicture: string } } | null;
  winner: { name: string; profile: { username: string; profilePicture?: string | null } } | null;
  result: { homeScore: number; awayScore: number; approved: boolean } | null;
}

interface RoundSectionProps {
  roundNumber: number;
  roundName: string;
  matches: Match[];
  onMatchClick?: (match: Match) => void;
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

// === STATIC Round Header ===
const RoundHeader = memo(({ roundName }: { roundName: string }) => (
  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4 border-b border-gray-700 pb-2">
    {roundName}
  </h3>
));

RoundHeader.displayName = "RoundHeader";

// === STATIC Empty State ===
const EmptyState = memo(() => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`text-center py-6 ${isMobile ? 'px-2' : ''}`}>
      <p className="text-xs text-gray-500">No matches in this round</p>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

/* -------------------------------------------------------------------------- */
/*                           Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function RoundSection({ 
  roundNumber, 
  roundName, 
  matches, 
  onMatchClick 
}: RoundSectionProps) {
  const isMobile = useIsMobile();

  // ✅ Handle match click
  const handleMatchClick = (match: Match) => {
    if (onMatchClick) {
      onMatchClick(match);
    }
  };

  // ✅ Determine min-width based on device
  const minWidth = isMobile ? "min-w-[140px]" : "min-w-[200px]";
  const gapClass = isMobile ? "gap-4" : "gap-6";

  return (
    <div className={`flex-1 ${minWidth}`}>
      <RoundHeader roundName={roundName} />
      
      {matches.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={`flex flex-col ${gapClass}`}>
          {matches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match}
              onClick={() => handleMatchClick(match)}
            />
          ))}
        </div>
      )}
    </div>
  );
}