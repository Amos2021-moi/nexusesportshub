"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, Plus, X, Trophy, Calendar, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"

interface Player {
  id: string
  name: string
  profile: { username: string; profilePicture: string }
}

interface Participant {
  id: string
  playerId: string
  seed: number
  eliminated: boolean
  player: Player
}

export default function ManageTournamentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    console.log("🔍 Manage page mounted with ID:", id)
    if (id) {
      fetchData()
    }
  }, [id])

  async function fetchData() {
    try {
      console.log("🔍 Fetching data for tournament ID:", id)
      setLoading(true)
      
      // Fetch tournament
      const tournamentRes = await fetch(`/api/tournaments/${id}`)
      console.log("🔍 Tournament response status:", tournamentRes.status)
      
      if (!tournamentRes.ok) {
        throw new Error(`HTTP ${tournamentRes.status}`)
      }
      
      const tournamentData = await tournamentRes.json()
      console.log("✅ Tournament data:", tournamentData)
      setTournament(tournamentData)
      
      // Fetch participants
      const participantsRes = await fetch(`/api/tournaments/${id}/players`)
      const participantsData = await participantsRes.json()
      setParticipants(Array.isArray(participantsData) ? participantsData : [])
      
      // Fetch available players
      const playersRes = await fetch("/api/players")
      const playersData = await playersRes.json()
      setAvailablePlayers(Array.isArray(playersData) ? playersData.filter((p: any) => p.role === "PLAYER") : [])
      
    } catch (error) {
      console.error("❌ Error fetching data:", error)
      toast.error("Failed to load tournament data")
      setTournament(null)
    } finally {
      setLoading(false)
    }
  }

  async function addPlayer() {
    if (!selectedPlayer) return
    
    try {
      const res = await fetch(`/api/tournaments/${id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: [selectedPlayer] })
      })
      
      if (res.ok) {
        toast.success("Player added!")
        setSelectedPlayer("")
        setShowAddPlayer(false)
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add player")
      }
    } catch (error) {
      console.error("Error adding player:", error)
      toast.error("Failed to add player")
    }
  }

  async function removePlayer(participantId: string) {
    if (!confirm("Are you sure you want to remove this player from the tournament?")) return
    
    try {
      const res = await fetch(`/api/tournaments/${id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId })
      })
      
      if (res.ok) {
        toast.success("Player removed from tournament")
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to remove player")
      }
    } catch (error) {
      console.error("Error removing player:", error)
      toast.error("Failed to remove player")
    }
  }

  async function generateBracket() {
    if (participants.length < 2) {
      toast.error("Need at least 2 players")
      return
    }
    
    setGenerating(true)
    try {
      const res = await fetch(`/api/tournaments/${id}/bracket`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      if (res.ok) {
        toast.success("Bracket generated!")
        router.push(`/tournaments/${id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to generate bracket")
      }
    } catch (error) {
      console.error("Error generating bracket:", error)
      toast.error("Failed to generate bracket")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading tournament data...</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
        <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Tournament Not Found</h3>
        <p className="text-gray-400">The tournament you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push("/admin/tournaments")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Tournaments
        </button>
      </div>
    )
  }

  const currentPlayers = participants.filter(p => !p.eliminated).length
  const canGenerate = participants.length >= 2 && (!tournament?.matches || tournament.matches.length === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{tournament?.name || "Tournament"}</h1>
        <p className="text-gray-400 mt-1">Manage participants and generate bracket</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <Users className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{participants.length}</p>
          <p className="text-xs text-gray-400">Registered Players</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <Trophy className="h-5 w-5 text-yellow-400 mb-2" />
          <p className="text-2xl font-bold text-white">{currentPlayers}</p>
          <p className="text-xs text-gray-400">Active Players</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <Calendar className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">{tournament?.maxPlayers || 0}</p>
          <p className="text-xs text-gray-400">Max Capacity</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Participants</h2>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-indigo-700"
          >
            <Plus size={14} />
            Add Player
          </button>
        </div>
        <div className="divide-y divide-gray-700">
          {participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No players added yet. Add players to start the tournament.
            </div>
          ) : (
            participants.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                  {p.seed || idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white">{p.player.profile?.username || p.player.name}</p>
                </div>
                {p.eliminated && (
                  <span className="text-xs text-red-400">Eliminated</span>
                )}
                <button
                  onClick={() => removePlayer(p.id)}
                  className="text-red-400 hover:text-red-300 transition-all p-1"
                  title="Remove player"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {canGenerate && participants.length >= 2 && (
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/20 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Ready to Generate Bracket</h2>
          <p className="text-gray-400 text-sm mb-4">
            {participants.length} players registered. Generate the tournament bracket to start matches.
          </p>
          <button
            onClick={generateBracket}
            disabled={generating}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Bracket"}
          </button>
        </div>
      )}

      {showAddPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Add Player</h2>
              <button onClick={() => setShowAddPlayer(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
            >
              <option value="">Select Player</option>
              {availablePlayers.filter(p => !participants.some(part => part.playerId === p.id)).map(p => (
                <option key={p.id} value={p.id}>
                  {p.profile?.username || p.name}
                </option>
              ))}
            </select>
            <button
              onClick={addPlayer}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Add Player
            </button>
          </div>
        </div>
      )}
    </div>
  )
}