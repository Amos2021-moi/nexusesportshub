"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  Trophy, Calendar, Users, Award, Star, Medal, 
  Crown, TrendingUp, ArrowLeft, CheckCircle, Clock,
  Shield, Activity, Target, GitBranch
} from "lucide-react"
import Image from "next/image"
interface SeasonArchive {
  season: {
    id: string
    name: string
    startDate: string
    endDate: string
    status: string
    isActive: boolean
    leagueEntries: Array<{
      id: string
      playerId: string
      played: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      goalDifference: number
      points: number
      player: {
        name: string
        profile: {
          username: string
          profilePicture: string
        }
      }
    }>
    fixtures: Array<{
      id: string
      homeScore: number | null
      awayScore: number | null
      scheduledDate: string
      status: string
      homePlayer: {
        name: string
        profile: { username: string }
      }
      awayPlayer: {
        name: string
        profile: { username: string }
      }
    }>
    awards: Array<{
      id: string
      name: string
      description: string
      winner: {
        name: string
        profile: { username: string; profilePicture: string }
      }
    }>
    hallOfFame: Array<{
      id: string
      category: string
      reason: string
      player: {
        name: string
        profile: { username: string; profilePicture: string }
      }
    }>
  }
  stats: {
    totalMatches: number
    completedMatches: number
    totalGoals: number
    completionRate: number
    totalPlayers: number
    totalAwards: number
    totalTournaments: number
  }
  champion: {
    id: string
    name: string
    points: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    profilePicture: string
  } | null
  topScorer: {
    name: string
    goals: number
  } | null
}

export default function SeasonArchivePage() {
  const { id } = useParams()
  const [data, setData] = useState<SeasonArchive | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSeasonArchive()
  }, [id])

  async function fetchSeasonArchive() {
    try {
      const res = await fetch(`/api/seasons/${id}/archive`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load season")
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error("Error fetching season:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading season archive...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Season not found</p>
        <Link href="/dashboard/standings" className="text-indigo-400 hover:underline mt-2 inline-block">
          Back to Standings
        </Link>
      </div>
    )
  }

  const { season, stats, champion, topScorer } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div>
          <Link 
            href="/dashboard/standings" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Back to Standings
          </Link>
          <div className="flex items-center gap-4">
            <Trophy className="h-10 w-10 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">{season.name}</h1>
              <p className="text-gray-400">
                {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
              </p>
            </div>
            {season.isActive && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Active</span>
            )}
            {season.status === "ENDED" && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">Ended</span>
            )}
            {season.status === "ARCHIVED" && (
              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">Archived</span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs text-gray-400">Players</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalPlayers}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-green-400" />
              <span className="text-xs text-gray-400">Matches</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.completedMatches}/{stats.totalMatches}</p>
            <p className="text-xs text-gray-500">{stats.completionRate}% completed</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-red-400" />
              <span className="text-xs text-gray-400">Goals</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalGoals}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-400">Awards</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalAwards}</p>
          </div>
        </div>

        {/* Champion & Top Scorer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {champion && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl p-6 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-white">Champion</h2>
              </div>
              <div className="flex items-center gap-4">
                {champion.profilePicture ? (
<Image
  src={champion.profilePicture || "/default-avatar.png"}
  alt={champion.name}
  width={64}
  height={64}
  className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
  loading="lazy"
/>                ) : (
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl font-bold text-yellow-500">
                    {champion.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xl font-bold text-white">{champion.name}</p>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>{champion.points} pts</span>
                    <span>{champion.wins}W</span>
                    <span>{champion.draws}D</span>
                    <span>{champion.losses}L</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {topScorer && (
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Top Scorer</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400">
                  {topScorer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{topScorer.name}</p>
                  <p className="text-sm text-blue-400">{topScorer.goals} goals</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* League Table */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              Final Standings
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Player</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">P</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">W</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">D</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">L</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">GF</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">GA</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">GD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {season.leagueEntries.map((entry, index) => {
                  const isChampion = index === 0
                  return (
                    <tr key={entry.id} className={`hover:bg-gray-700/30 transition-colors ${isChampion ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isChampion ? 'text-yellow-500' : 'text-gray-300'}`}>
                            {index + 1}
                          </span>
                          {isChampion && <Crown size={14} className="text-yellow-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.player.profile?.profilePicture ? (
                            <img src={entry.player.profile.profilePicture} alt={entry.player.profile?.username} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                              {entry.player.profile?.username?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <span className="text-white text-sm">{entry.player.profile?.username || entry.player.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{entry.played}</td>
                      <td className="px-4 py-3 text-center text-green-400">{entry.wins}</td>
                      <td className="px-4 py-3 text-center text-yellow-400">{entry.draws}</td>
                      <td className="px-4 py-3 text-center text-red-400">{entry.losses}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{entry.goalsFor}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{entry.goalsAgainst}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${entry.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {entry.goalDifference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-white ${isChampion ? 'text-lg text-yellow-500' : ''}`}>
                          {entry.points}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Awards */}
        {season.awards.length > 0 && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award size={18} className="text-purple-400" />
              Season Awards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {season.awards.map((award) => (
                <div key={award.id} className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Award size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{award.name}</p>
                      <p className="text-sm text-gray-400">{award.winner.profile?.username || award.winner.name}</p>
                    </div>
                  </div>
                  {award.description && (
                    <p className="text-xs text-gray-500 mt-2">{award.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hall of Fame */}
        {season.hallOfFame.length > 0 && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star size={18} className="text-yellow-400" />
              Hall of Fame Inductees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {season.hallOfFame.map((entry) => (
                <div key={entry.id} className="bg-gray-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {entry.player.profile?.profilePicture ? (
                      <img src={entry.player.profile.profilePicture} alt={entry.player.profile?.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                        {entry.player.profile?.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{entry.player.profile?.username || entry.player.name}</p>
                      <p className="text-sm text-yellow-400">{entry.category}</p>
                      <p className="text-xs text-gray-500">{entry.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}