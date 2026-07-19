"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  Shield, Trophy, Users, Calendar, Award, Mail, Phone, Star, TrendingUp, 
  Target, Activity, CheckCircle, Crown, Sparkles, Eye, MessageCircle, Lock, EyeOff
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import TrustBadge from "@/components/ui/TrustBadge"

interface PlayerProfile {
  id: string
  username: string
  name: string
  profilePicture: string
  bannerImage: string
  bio: string
  class: string
  favoriteClub: string
  preferredFormation: string
  preferredPlaystyle: string
  isVerified: boolean
  trustScore: number
  verifiedBadge: boolean
  totalWins: number
  totalDraws: number
  totalLosses: number
  totalPoints: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  matchesPlayed: number
  winRate: number
  whatsappNumber: string
  whatsappVisible: boolean
  awards: { name: string; seasonName: string }[]
  squads: {
    id: string
    type: string
    screenshot: string
    formation: string
    teamStrength: number
    playstyle: string
  }[]
  recentMatches: {
    id: string
    opponentName: string
    score: string
    result: string
    date: string
  }[]
  seasonStats: {
    seasonName: string
    points: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
  }[]
  privacySettings?: {
    publicProfile: boolean
    showSquad: boolean
    showStats: boolean
    showLastSeen: boolean
    allowComments: boolean
  }
  isPrivate?: boolean
}

export default function PlayerProfilePage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("stats")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!id) {
      console.error("❌ No ID found in URL")
      setLoading(false)
      return
    }
    fetchProfile()
  }, [id])

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/players/${id}`)
      if (!res.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await res.json()
      setProfile(data)
      
      if (session?.user?.id === data.id) {
        setIsOwnProfile(true)
      }
      
      if (session?.user?.role === "ADMIN") {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users className="h-16 w-16 text-gray-600" />
        <p className="text-gray-400">No player ID provided</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300">Go Home</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading player profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users className="h-16 w-16 text-gray-600" />
        <p className="text-gray-400">Player not found</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300">Go Home</Link>
      </div>
    )
  }

  const privacy = profile.privacySettings || {
    publicProfile: true,
    showSquad: true,
    showStats: true,
    showLastSeen: true,
    allowComments: true
  }

  const isPrivate = profile.isPrivate || false

  if (isPrivate && !isOwnProfile && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-800/30 rounded-xl border border-gray-700 p-8">
        <Lock className="h-16 w-16 text-gray-500" />
        <h2 className="text-xl font-bold text-white">Profile is Private</h2>
        <p className="text-gray-400 text-center max-w-md">
          This player has chosen to keep their profile private. Only they can view their full profile.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <EyeOff size={14} />
          <span>Privacy settings applied</span>
        </div>
      </div>
    )
  }

  const canViewStats = privacy.showStats || isOwnProfile || isAdmin
  const canViewSquads = privacy.showSquad || isOwnProfile || isAdmin

  const tabs = []
  if (canViewStats) {
    tabs.push({ id: "stats", label: "Statistics", icon: TrendingUp })
    tabs.push({ id: "awards", label: "Awards", icon: Award })
    tabs.push({ id: "matches", label: "Match History", icon: Calendar })
  }
  if (canViewSquads) {
    tabs.push({ id: "squads", label: "Squads", icon: Shield })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 px-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
          {profile.bannerImage && (
  <Image
    src={profile.bannerImage}
    alt="Banner"
    width={1200}
    height={160}
    className="h-full w-full object-cover"
    loading="lazy"
  />
)}
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-wrap items-end gap-4 -mt-16">
            <div className="relative">

{profile.profilePicture ? (
  <Image
    src={profile.profilePicture}
    alt={profile.username || "Player"}
    width={112}
    height={112}
    className="w-28 h-28 rounded-full border-4 border-gray-800 object-cover"
    loading="lazy"
  />
) : (
  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-800">
    {(profile.username || "Player").charAt(0).toUpperCase()}
  </div>
)}
              {!profile.privacySettings?.publicProfile && (isOwnProfile || isAdmin) && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-gray-800">
                  <Lock size={12} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 pt-12">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{profile.username || "Player"}</h1>
                {profile.isVerified && <TrustBadge type="verified" />}
                {profile.trustScore >= 80 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">High Trust</span>
                )}
                {!privacy.publicProfile && !isOwnProfile && !isAdmin && (
                  <span className="text-xs bg-gray-600/50 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} /> Private
                  </span>
                )}
                {!privacy.publicProfile && (isOwnProfile || isAdmin) && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} /> Profile is Private
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-400">
                <span>{profile.class || "No class"}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Shield size={14} className="text-indigo-400" />
                  Trust: {profile.trustScore}/100
                </span>
                {canViewStats && (
                  <>
                    <span>•</span>
                    <span>{profile.matchesPlayed} matches</span>
                  </>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 text-gray-300 text-sm">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                {profile.favoriteClub && <span>⚽ {profile.favoriteClub}</span>}
                {profile.preferredFormation && <span>📋 {profile.preferredFormation}</span>}
                {profile.preferredPlaystyle && <span>🎯 {profile.preferredPlaystyle}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {canViewStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{profile.totalPoints}</p>
            <p className="text-xs text-gray-400">Points</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{profile.winRate}%</p>
            <p className="text-xs text-gray-400">Win Rate</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <Target className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-400">{profile.goalsFor}</p>
            <p className="text-xs text-gray-400">Goals For</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <Award className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-purple-400">{profile.awards?.length || 0}</p>
            <p className="text-xs text-gray-400">Awards</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/30 rounded-xl p-6 text-center border border-gray-700">
          <EyeOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Statistics are private</p>
        </div>
      )}

      {tabs.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-gray-800 pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {tabs.length > 0 && (
        <div className="pt-4">
          {activeTab === "stats" && canViewStats && (
            <div className="space-y-6">
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  Career Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-white">{profile.matchesPlayed}</p>
                    <p className="text-xs text-gray-400">Matches</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-400">{profile.totalWins}</p>
                    <p className="text-xs text-gray-400">Wins</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-yellow-400">{profile.totalDraws}</p>
                    <p className="text-xs text-gray-400">Draws</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-400">{profile.totalLosses}</p>
                    <p className="text-xs text-gray-400">Losses</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-400">{profile.goalsFor}</p>
                    <p className="text-xs text-gray-400">Goals For</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${profile.goalDifference >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {profile.goalDifference >= 0 ? "+" : ""}{profile.goalDifference}
                    </p>
                    <p className="text-xs text-gray-400">Goal Diff</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-400">{profile.goalsAgainst}</p>
                    <p className="text-xs text-gray-400">Goals Against</p>
                  </div>
                </div>
              </div>

              {profile.seasonStats && profile.seasonStats.length > 0 && (
                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-400" />
                    Season Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gray-400 border-b border-gray-700">
                        <tr>
                          <th className="text-left py-2">Season</th>
                          <th className="text-center py-2">P</th>
                          <th className="text-center py-2">W</th>
                          <th className="text-center py-2">D</th>
                          <th className="text-center py-2">L</th>
                          <th className="text-center py-2">Pts</th>
                          <th className="text-center py-2">GF</th>
                          <th className="text-center py-2">GA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {profile.seasonStats.map((stat, index) => (
                          <tr key={index} className="text-gray-300">
                            <td className="py-2 text-white">{stat.seasonName}</td>
                            <td className="text-center">{stat.wins + stat.draws + stat.losses}</td>
                            <td className="text-center text-green-400">{stat.wins}</td>
                            <td className="text-center text-yellow-400">{stat.draws}</td>
                            <td className="text-center text-red-400">{stat.losses}</td>
                            <td className="text-center font-bold text-white">{stat.points}</td>
                            <td className="text-center text-blue-400">{stat.goalsFor}</td>
                            <td className="text-center text-red-400">{stat.goalsAgainst}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "squads" && canViewSquads && (
            <>
              {profile.squads && profile.squads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.squads.map((squad) => (
                    <div key={squad.id} className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                      <div className="p-3 bg-gray-700/30 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm font-semibold text-white">{squad.type.replace("_", " ")}</span>
                          <span className="text-xs text-gray-500">{squad.formation}</span>
                        </div>
                      </div>
                      <img src={squad.screenshot} alt={squad.type} className="w-full h-40 object-contain p-2" />
                      <div className="p-3 text-xs text-gray-400 flex justify-between">
                        <span>Strength: {squad.teamStrength}</span>
                        <span>Playstyle: {squad.playstyle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No squads uploaded yet</div>
              )}
            </>
          )}
          {activeTab === "squads" && !canViewSquads && (
            <div className="text-center py-8 text-gray-400">
              <EyeOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p>Squads are private</p>
            </div>
          )}

          {activeTab === "awards" && canViewStats && (
            <>
              {profile.awards && profile.awards.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.awards.map((award, index) => (
                    <div key={index} className="bg-yellow-500/10 rounded-lg border border-yellow-500/20 px-4 py-2 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-400" />
                      <span className="text-white text-sm">{award.name}</span>
                      <span className="text-xs text-gray-400">• {award.seasonName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No awards yet</div>
              )}
            </>
          )}
          {activeTab === "awards" && !canViewStats && (
            <div className="text-center py-8 text-gray-400">
              <EyeOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p>Awards are private</p>
            </div>
          )}

          {activeTab === "matches" && canViewStats && (
            <>
              {profile.recentMatches && profile.recentMatches.length > 0 ? (
                <div className="space-y-2">
                  {profile.recentMatches.map((match, index) => (
                    <div key={index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          match.result === "W" ? "bg-green-500/20 text-green-400" :
                          match.result === "D" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {match.result}
                        </span>
                        <span className="text-white text-sm">vs {match.opponentName}</span>
                        <span className="text-sm font-bold text-white">{match.score}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(match.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No matches played yet</div>
              )}
            </>
          )}
          {activeTab === "matches" && !canViewStats && (
            <div className="text-center py-8 text-gray-400">
              <EyeOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p>Match history is private</p>
            </div>
          )}
        </div>
      )}

      {tabs.length === 0 && (
        <div className="bg-gray-800/30 rounded-xl p-12 text-center border border-gray-700">
          <EyeOff className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">This profile has no public content to display.</p>
        </div>
      )}

      {profile.whatsappVisible && profile.whatsappNumber && (
        <div className="fixed bottom-6 right-6">
          <a
            href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-600 transition-all"
          >
            <Phone size={18} />
            <span className="text-sm">Contact on WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  )
}