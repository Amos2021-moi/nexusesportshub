"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Trophy, Users, Calendar, Award, CheckCircle, Medal, ChevronLeft, TrendingUp, Crown, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
interface TournamentStats {
  tournament: {
    name: string
    type: string
    status: string
    startDate: string
    endDate: string
  }
  stats: {
    totalPlayers: number
    totalMatches: number
    completedMatches: number
    pendingMatches: number
    completionRate: number
  }
  leaderboard: Array<{
    playerId: string
    name: string
    profilePicture: string
    matches: number
    wins: number
    losses: number
    winRate: number
    isActive: boolean
  }>
  topScorer: {
    name: string
    wins: number
  } | null
}

export default function TournamentStatsPage() {
  const { id } = useParams()
  const [stats, setStats] = useState<TournamentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [id])

  async function fetchStats() {
    const res = await fetch(`/api/tournaments/${id}/stats`)
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Tournament not found</p>
        <Link href="/tournaments" className="text-indigo-400 hover:underline mt-2 inline-block">
          Back to Tournaments
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div>
          <Link href={`/tournaments/${id}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={18} />
            Back to Bracket
          </Link>
          
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-bold">{stats.tournament.name}</h1>
            </div>
            <p className="text-white/80">Tournament Statistics & Player Performance</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <Users className="h-8 w-8 text-blue-400 mb-3" />
            <p className="text-2xl font-bold text-white">{stats.stats.totalPlayers}</p>
            <p className="text-sm text-gray-400">Total Players</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <Trophy className="h-8 w-8 text-yellow-400 mb-3" />
            <p className="text-2xl font-bold text-white">{stats.stats.totalMatches}</p>
            <p className="text-sm text-gray-400">Total Matches</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <CheckCircle className="h-8 w-8 text-green-400 mb-3" />
            <p className="text-2xl font-bold text-white">{stats.stats.completedMatches}</p>
            <p className="text-sm text-gray-400">Completed</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <TrendingUp className="h-8 w-8 text-indigo-400 mb-3" />
            <p className="text-2xl font-bold text-white">{stats.stats.completionRate}%</p>
            <p className="text-sm text-gray-400">Completion Rate</p>
          </div>
        </div>

        {/* Top Performer */}
        {stats.topScorer && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-2xl p-6 border border-yellow-500/30 text-center">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1">Top Performer</h2>
            <p className="text-2xl font-bold text-yellow-400">{stats.topScorer.name}</p>
            <p className="text-sm text-gray-400">{stats.topScorer.wins} wins</p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Player Leaderboard
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Player</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400">Matches</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400">Wins</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400">Losses</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400">Win Rate</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats.leaderboard.map((player, index) => (
                  <tr key={player.playerId} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{index + 1}</span>
                        {index === 0 && <Crown size={14} className="text-yellow-500" />}
                        {index === 1 && <Medal size={14} className="text-gray-400" />}
                        {index === 2 && <Medal size={14} className="text-amber-600" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {player.profilePicture ? (
<Image
  src={player.profilePicture || "/default-avatar.png"}
  alt={player.name || "Player"}
  width={32}
  height={32}
  className="w-8 h-8 rounded-full object-cover"
  loading="lazy"
/>                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white">{player.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-300">{player.matches}</td>
                    <td className="px-6 py-4 text-center text-green-400 font-medium">{player.wins}</td>
                    <td className="px-6 py-4 text-center text-red-400">{player.losses}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-indigo-400 font-medium">{player.winRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {player.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Eliminated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}