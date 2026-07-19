"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Users, Calendar, Award, Medal, ChevronDown, LogIn } from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
interface StandingsEntry {
  id: string
  playerId: string
  playerName: string
  profilePicture: string | null
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface Season {
  id: string
  name: string
  isActive: boolean
  startDate: string
  endDate: string
}

export default function StandingsPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<StandingsEntry[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const [totalAwards, setTotalAwards] = useState(0)

  useEffect(() => {
    fetchStandings()
  }, [selectedSeasonId])

  async function fetchStandings() {
    setLoading(true)
    const url = selectedSeasonId 
      ? `/api/public/standings?seasonId=${selectedSeasonId}`
      : "/api/public/standings"
    
    const res = await fetch(url)
    const data = await res.json()
    
    setEntries(data.entries || [])
    setSeasons(data.seasons || [])
    setTotalPlayers(data.totalPlayers || 0)
    setTotalMatches(data.totalMatches || 0)
    setTotalAwards(data.totalAwards || 0)
    
    if (!selectedSeasonId && data.seasons && data.seasons.length > 0) {
      const activeSeason = data.seasons.find((s: Season) => s.isActive)
      setSelectedSeasonId(activeSeason?.id || data.seasons[0].id)
    }
    
    setLoading(false)
  }

  const getMedal = (index: number) => {
    if (index === 0) return <Medal className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />
    return null
  }

  const getPositionBadge = (index: number) => {
    if (index === 0) return "bg-yellow-500/20 text-yellow-500"
    if (index === 1) return "bg-gray-500/20 text-gray-400"
    if (index === 2) return "bg-amber-500/20 text-amber-500"
    return "bg-gray-700/50 text-gray-400"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              League Standings
            </h1>
            <p className="text-gray-400 mt-1">Premier eFootball League rankings</p>
          </div>
          
          {/* Season Selector */}
          {seasons.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id} className="bg-gray-800">
                    {season.name} {season.isActive && "• Active"}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
            <Users className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{totalPlayers}</p>
            <p className="text-xs text-gray-400">Total Players</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
            <Calendar className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{totalMatches}</p>
            <p className="text-xs text-gray-400">Matches Played</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
            <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{totalAwards}</p>
            <p className="text-xs text-gray-400">Awards Given</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-2xl font-bold text-white">{entries.length}</div>
            <p className="text-xs text-gray-400">Competing Players</p>
          </div>
        </div>

        {/* Join CTA for Non-Logged In Users */}
        {!session && (
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/30 mb-8 text-center">
            <p className="text-white/80 mb-3">
              🔒 Want to see your name on this leaderboard?
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Join the League Now
            </Link>
          </div>
        )}

        {/* Standings Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-400">Loading standings...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Standings Yet</h3>
            <p className="text-gray-400">Matches haven't been played yet this season.</p>
            {!session && (
              <Link
                href="/auth/signup"
                className="inline-block mt-4 text-indigo-400 hover:text-indigo-300 transition-all"
              >
                Be the first to compete →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/80 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">P</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">W</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">D</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">L</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">GF</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">GA</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">GD</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {entries.map((entry, index) => {
                    const isTop3 = index < 3
                    return (
                      <tr 
                        key={entry.id} 
                        className={`hover:bg-gray-700/30 transition-colors ${
                          isTop3 ? "bg-gradient-to-r from-yellow-500/5 to-transparent" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${getPositionBadge(index)}`}>
                              {index + 1}
                            </span>
                            {getMedal(index)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {entry.profilePicture ? (
                              <Image
  src={entry.profilePicture || "/default-avatar.png"}
  alt={entry.playerName}
  width={32}
  height={32}
  className="h-8 w-8 rounded-full object-cover border border-gray-600"
  loading="lazy"
/>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {entry.playerName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-white text-sm">{entry.playerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{entry.played}</td>
                        <td className="px-4 py-3 text-center text-green-400 font-medium">{entry.wins}</td>
                        <td className="px-4 py-3 text-center text-yellow-400 font-medium">{entry.draws}</td>
                        <td className="px-4 py-3 text-center text-red-400 font-medium">{entry.losses}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{entry.goalsFor}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{entry.goalsAgainst}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-semibold ${entry.goalDifference >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {entry.goalDifference >= 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-white text-lg">{entry.points}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-500">
              Points: Win = 3, Draw = 1, Loss = 0
            </div>
          </div>
        )}

        {/* Bottom CTA for Visitors */}
        {!session && entries.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-3">
              Want to compete and see your name on this leaderboard?
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign Up and Start Playing
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}