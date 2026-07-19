"use client"

import MatchCard from "./MatchCard"

interface Match {
  id: string
  round: number
  matchNumber: number
  homePlayerId: string | null
  awayPlayerId: string | null
  winnerId: string | null
  status: string
  homePlayer: { name: string; profile: { username: string; profilePicture: string } } | null
  awayPlayer: { name: string; profile: { username: string; profilePicture: string } } | null
  winner: { name: string; profile: { username: string; profilePicture?: string | null } } | null
  result: { homeScore: number; awayScore: number; approved: boolean } | null
}

interface RoundSectionProps {
  roundNumber: number
  roundName: string
  matches: Match[]
  onMatchClick?: (match: Match) => void
}

export default function RoundSection({ roundNumber, roundName, matches, onMatchClick }: RoundSectionProps) {
  return (
    <div className="flex-1 min-w-[200px]">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4 border-b border-gray-700 pb-2">
        {roundName}
      </h3>
      <div className="flex flex-col gap-6">
        {matches.map((match, index) => (
          <MatchCard 
            key={match.id} 
            match={match}
            onClick={() => onMatchClick?.(match)}
          />
        ))}
      </div>
    </div>
  )
}