"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { 
  Trophy, Calendar, Users, Award, Clock, CheckCircle, 
  MessageCircle, Eye, TrendingUp, Shield, ArrowLeft,
  Share2, Activity, Lock
} from "lucide-react"
import toast from "react-hot-toast"
import Image from "next/image"

interface MatchData {
  match: {
    id: string
    homeScore: number | null
    awayScore: number | null
    scheduledDate: string
    status: string
    homePlayer: {
      id: string
      name: string
      profile: {
        username: string
        profilePicture: string
        totalPoints: number
      }
      squads: Array<{
        id: string
        screenshot: string
        formation: string
        teamStrength: number
        playstyle: string
      }>
    }
    awayPlayer: {
      id: string
      name: string
      profile: {
        username: string
        profilePicture: string
        totalPoints: number
      }
      squads: Array<{
        id: string
        screenshot: string
        formation: string
        teamStrength: number
        playstyle: string
      }>
    }
    season: {
      name: string
    }
    result: {
      homeScore: number
      awayScore: number
      evidenceImage: string
      approved: boolean
      user: {
        name: string
        profile: { username: string }
      }
    } | null
  }
  headToHead: {
    homeWins: number
    awayWins: number
    draws: number
    total: number
  }
  homeForm: string[]
  awayForm: string[]
  paymentRequired?: boolean
  hasPaid?: boolean
  message?: string
}

export default function MatchCenterPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEvidence, setShowEvidence] = useState(false)

  useEffect(() => {
    fetchMatch()
  }, [id])

  async function fetchMatch() {
    try {
      const res = await fetch(`/api/matches/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load match")
      const data = await res.json()
      setMatchData(data)
    } catch (error) {
      console.error("Error fetching match:", error)
      toast.error("Failed to load match")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading match center...</p>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Match not found</p>
        <Link href="/dashboard/fixtures" className="text-indigo-400 hover:underline mt-2 inline-block">
          Back to Fixtures
        </Link>
      </div>
    )
  }

  // ✅ Check if payment is required and not paid
  if (matchData.paymentRequired && !matchData.hasPaid) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link 
          href="/dashboard/fixtures" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Fixtures
        </Link>
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
          <Lock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">🔒 Payment Required</h2>
          <p className="text-gray-400">
            You need to pay the entry fee to view match details.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {matchData.message || "Please pay on your dashboard to access this match."}
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
          >
            Go to Dashboard to Pay
          </Link>
        </div>
      </div>
    )
  }

  const { match, headToHead, homeForm, awayForm } = matchData
  const homeName = match.homePlayer.profile?.username || match.homePlayer.name
  const awayName = match.awayPlayer.profile?.username || match.awayPlayer.name
  const hasResult = match.homeScore !== null
  const isApproved = match.result?.approved
  const homeSquad = match.homePlayer.squads?.[0]
  const awaySquad = match.awayPlayer.squads?.[0]

  const getFormColor = (result: string) => {
    if (result === "W") return "bg-green-500/20 text-green-400"
    if (result === "L") return "bg-red-500/20 text-red-400"
    if (result === "D") return "bg-yellow-500/20 text-yellow-400"
    return "bg-gray-500/20 text-gray-400"
  }

  // Safe clipboard copy function
  const copyLink = async () => {
    try {
      const url = window.location.href
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast.success("Match link copied!")
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast.success("Match link copied!")
      }
    } catch (err) {
      console.error("Clipboard error:", err)
      toast.error("Could not copy link. Please copy the URL manually.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Back Button */}
        <Link 
          href="/dashboard/fixtures" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Fixtures
        </Link>

        {/* Match Header */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              {match.season?.name}
            </div>
            <div className="flex items-center gap-2">
              {match.status === "COMPLETED" ? (
                <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle size={14} />
                  Completed
                </span>
              ) : match.status === "PENDING" ? (
                <span className="inline-flex items-center gap-1 text-yellow-400 text-sm">
                  <Clock size={14} />
                  Pending Approval
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-blue-400 text-sm">
                  <Calendar size={14} />
                  Upcoming
                </span>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Home Player */}
            <div className="flex-1 text-center">
              {match.homePlayer.profile?.profilePicture ? (
                <img 
                  src={match.homePlayer.profile.profilePicture} 
                  alt={homeName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 mx-auto mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                  {homeName.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-xl font-bold text-white">{homeName}</h2>
              <p className="text-sm text-gray-400">{match.homePlayer.profile?.totalPoints || 0} pts</p>
            </div>

            {/* Score */}
            <div className="px-6 text-center">
              {hasResult ? (
                <div className="text-4xl font-bold text-white">
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : (
                <div className="text-2xl text-gray-500">VS</div>
              )}
              <div className="mt-2">
                {match.status === "COMPLETED" && hasResult && (
                  <span className="text-sm text-green-400">
                    {match.homeScore !== null && match.awayScore !== null ? (
  match.homeScore > match.awayScore ? `${homeName} won` :
  match.awayScore > match.homeScore ? `${awayName} won` :
  "Draw"
) : "Result pending"}
                  </span>
                )}
              </div>
            </div>

            {/* Away Player */}
            <div className="flex-1 text-center">
              {match.awayPlayer.profile?.profilePicture ? (
                <img 
                  src={match.awayPlayer.profile.profilePicture} 
                  alt={awayName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500 mx-auto mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                  {awayName.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-xl font-bold text-white">{awayName}</h2>
              <p className="text-sm text-gray-400">{match.awayPlayer.profile?.totalPoints || 0} pts</p>
            </div>
          </div>

          {/* Match Date */}
          <div className="text-center mt-4 pt-4 border-t border-gray-700">
            <span className="text-gray-400 text-sm">
              {new Date(match.scheduledDate).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Squad Showcase */}
        {(homeSquad || awaySquad) && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-indigo-400" />
              Squads
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeSquad && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-white mb-2">{homeName}'s Squad</p>
                  <Image
                    src={homeSquad.screenshot}
                    alt="Home Squad"
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Formation: {homeSquad.formation}</span>
                    <span>Strength: {homeSquad.teamStrength}</span>
                    <span>Playstyle: {homeSquad.playstyle}</span>
                  </div>
                </div>
              )}
              {awaySquad && (
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-white mb-2">{awayName}'s Squad</p>
                  <Image
                    src={awaySquad.screenshot}
                    alt="Away Squad"
                    width={400}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Formation: {awaySquad.formation}</span>
                    <span>Strength: {awaySquad.teamStrength}</span>
                    <span>Playstyle: {awaySquad.playstyle}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Head to Head */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-yellow-400" />
            Head to Head
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{headToHead.homeWins}</p>
              <p className="text-sm text-gray-400">{homeName} Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{headToHead.draws}</p>
              <p className="text-sm text-gray-400">Draws</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{headToHead.awayWins}</p>
              <p className="text-sm text-gray-400">{awayName} Wins</p>
            </div>
          </div>
          <div className="text-center mt-2 text-xs text-gray-500">
            {headToHead.total} matches played
          </div>
        </div>

        {/* Recent Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">{homeName} Form</h4>
            <div className="flex gap-2">
              {homeForm.map((result, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getFormColor(result)}`}>
                  {result}
                </div>
              ))}
              {homeForm.length === 0 && (
                <span className="text-xs text-gray-500">No recent matches</span>
              )}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">{awayName} Form</h4>
            <div className="flex gap-2">
              {awayForm.map((result, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getFormColor(result)}`}>
                  {result}
                </div>
              ))}
              {awayForm.length === 0 && (
                <span className="text-xs text-gray-500">No recent matches</span>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Viewer */}
        {match.result?.evidenceImage && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="text-lg font-semibold text-white mb-4 flex items-center gap-2 hover:text-indigo-400 transition-colors"
            >
              <Eye size={18} className="text-blue-400" />
              {showEvidence ? "Hide" : "View"} Match Evidence
            </button>
            {showEvidence && (
              <Image
                src={`data:image/png;base64,${match.result.evidenceImage}`}
                alt="Match Evidence"
                width={400}
                height={200}
                className="rounded-lg max-h-96 mx-auto border border-gray-600"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Action Buttons - Only if user is part of match and season is LIVE */}
        {match.status === "SCHEDULED" && session && (
          <div className="text-center">
            <Link
              href={`/dashboard/results/submit/${match.id}`}
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Submit Result
            </Link>
          </div>
        )}

        {/* Share */}
        <div className="text-center">
          <button
            onClick={copyLink}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
          >
            <Share2 size={16} />
            Share Match
          </button>
        </div>
      </div>
    </div>
  )
}