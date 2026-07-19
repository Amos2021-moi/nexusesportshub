"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, User, Shield, Calendar, Trophy, CheckCircle, Clock, Image, Eye } from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"

interface Match {
  id: string
  round: number
  matchNumber: number
  homePlayerId: string | null
  awayPlayerId: string | null
  winnerId: string | null
  status: string
  homePlayer: { name: string; profile: { username: string; profilePicture: string; class?: string } } | null
  awayPlayer: { name: string; profile: { username: string; profilePicture: string; class?: string } } | null
  winner: { name: string; profile: { username: string; profilePicture?: string | null } } | null
  result: { homeScore: number; awayScore: number; approved: boolean; evidenceImage?: string } | null
}

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  match: Match | null
  onUpdate?: () => void
}

export default function MatchModal({ isOpen, onClose, match, onUpdate }: MatchModalProps) {
  const { data: session } = useSession()
  const [approving, setApproving] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)

  if (!match) return null

  const getPlayerName = (player: any) => {
    return player?.profile?.username || player?.name || "TBD"
  }

  const getPlayerClass = (player: any) => {
    return player?.profile?.class || ""
  }

  const homeName = getPlayerName(match.homePlayer)
  const awayName = getPlayerName(match.awayPlayer)
  const homeClass = getPlayerClass(match.homePlayer)
  const awayClass = getPlayerClass(match.awayPlayer)
  const hasResult = match.result !== null
  const isAdmin = session?.user?.role === "ADMIN"
  const isPending = match.status === "PENDING"

  const handleApprove = async () => {
    if (!match?.result) return

    setApproving(true)
    try {
      // send matchId since result object does not contain an id in the client model
      const res = await fetch("/api/admin/results/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id })
      })
      
      if (res.ok) {
        toast.success("Result approved!")
        if (onUpdate) onUpdate()
        onClose()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to approve")
      }
    } catch (error) {
      console.error("Error approving result:", error)
      toast.error("Network error")
    } finally {
      setApproving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-4 z-50 max-w-2xl mx-auto my-auto h-fit max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 p-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Match Details</h2>
                  <p className="text-xs text-gray-400">Match {match.matchNumber} • Round {match.round}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-all"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  match.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                  match.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-blue-500/20 text-blue-400"
                }`}>
                  {match.status}
                </span>
                {match.result?.approved && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    Approved
                  </span>
                )}
              </div>

              {/* Players */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  {match.homePlayer?.profile?.profilePicture ? (
                    <img 
                      src={match.homePlayer.profile.profilePicture} 
                      alt={homeName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {homeName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">{homeName}</p>
                    {homeClass && <p className="text-xs text-gray-400">{homeClass}</p>}
                  </div>
                  {hasResult && (
                    <span className={`text-2xl font-bold ${match.winner?.profile?.username === homeName ? "text-green-400" : "text-white"}`}>
                      {match.result?.homeScore}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <span className="text-sm text-gray-500">vs</span>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  {match.awayPlayer?.profile?.profilePicture ? (
                    <img 
                      src={match.awayPlayer.profile.profilePicture} 
                      alt={awayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {awayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">{awayName}</p>
                    {awayClass && <p className="text-xs text-gray-400">{awayClass}</p>}
                  </div>
                  {hasResult && (
                    <span className={`text-2xl font-bold ${match.winner?.profile?.username === awayName ? "text-green-400" : "text-white"}`}>
                      {match.result?.awayScore}
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence */}
              {match.result?.evidenceImage && (
                <div>
                  <button
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-all"
                  >
                    <Image size={16} />
                    {showEvidence ? "Hide Evidence" : "View Evidence"}
                  </button>
                  {showEvidence && (
                    <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <img 
                        src={match.result.evidenceImage} 
                        alt="Evidence" 
                        className="max-h-64 w-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && isPending && (
                <div className="border-t border-gray-700 pt-4">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Approve Result
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Player Actions */}
              {!isAdmin && isPending && (
                <div className="border-t border-gray-700 pt-4 text-center">
                  <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                    <Clock size={16} />
                    Waiting for admin approval
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}