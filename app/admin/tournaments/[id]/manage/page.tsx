"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, Plus, X, Trophy, Calendar,RefreshCw, ChevronRight, Loader2, Search, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

interface Player {
  id: string;
  name: string;
  email?: string;
  role?: string;
  profile: { username: string; profilePicture: string };
}

interface Participant {
  id: string;
  playerId: string;
  seed: number;
  eliminated: boolean;
  player: Player;
}

interface Tournament {
  id: string;
  name: string;
  maxPlayers: number;
  status: string;
  type: string;
  matches: any[];
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
/*                           STATIC Background                               */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  color: string;
}) => (
  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm">
    <Icon className={`h-5 w-5 ${color} mb-2`} />
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </div>
));

StatCard.displayName = "StatCard";

const ParticipantRow = memo(({ 
  participant, 
  index, 
  onRemove 
}: { 
  participant: Participant; 
  index: number; 
  onRemove: (id: string) => void;
}) => {
  const handleRemove = useCallback(() => {
    onRemove(participant.id);
  }, [onRemove, participant.id]);

  const playerName = participant.player?.profile?.username || participant.player?.name || "Unknown Player";

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
        {participant.seed || index + 1}
      </div>
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{playerName}</p>
        {participant.player?.email && (
          <p className="text-xs text-gray-500">{participant.player.email}</p>
        )}
      </div>
      {participant.eliminated && (
        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Eliminated</span>
      )}
      <button
        onClick={handleRemove}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-150 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
        title="Remove player"
      >
        <X size={16} />
      </button>
    </div>
  );
});

ParticipantRow.displayName = "ParticipantRow";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function ManageTournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // ✅ Fetch tournament data
      const tournamentRes = await fetch(`/api/tournaments/${id}`);
      if (!tournamentRes.ok) throw new Error(`HTTP ${tournamentRes.status}`);
      const tournamentData = await tournamentRes.json();
      setTournament(tournamentData);
      
      // ✅ Fetch participants
      const participantsRes = await fetch(`/api/tournaments/${id}/players`);
      const participantsData = await participantsRes.json();
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      
      // ✅ Fetch ALL players (with proper error handling)
      const playersRes = await fetch("/api/players");
      let playersData = [];
      
      if (playersRes.ok) {
        const rawData = await playersRes.json();
        
        // ✅ Handle both array and paginated responses
        if (Array.isArray(rawData)) {
          playersData = rawData;
        } else if (rawData.data && Array.isArray(rawData.data)) {
          playersData = rawData.data;
        } else if (rawData.players && Array.isArray(rawData.players)) {
          playersData = rawData.players;
        } else {
          playersData = [];
        }
      }
      
      // ✅ Filter only PLAYER role
      const filteredPlayers = playersData.filter((p: any) => p.role === "PLAYER" || p.role === "player");
      
      // ✅ Format players to match the Player interface
      const formattedPlayers = filteredPlayers.map((p: any) => ({
        id: p.id,
        name: p.name || p.email || "Unknown",
        email: p.email,
        role: p.role,
        profile: {
          username: p.profile?.username || p.name || p.email?.split('@')[0] || "player",
          profilePicture: p.profile?.profilePicture || "",
        }
      }));
      
      setAvailablePlayers(formattedPlayers);
      
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      toast.error("Failed to load tournament data");
    } finally {
      setLoading(false);
    }
  }

  const addPlayer = useCallback(async () => {
    if (!selectedPlayer) {
      toast.error("Please select a player");
      return;
    }
    
    try {
      const res = await fetch(`/api/tournaments/${id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: [selectedPlayer] })
      });
      
      if (res.ok) {
        toast.success("Player added successfully!");
        setSelectedPlayer("");
        setShowAddPlayer(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add player");
      }
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player");
    }
  }, [selectedPlayer, id]);

  const removePlayer = useCallback(async (participantId: string) => {
    if (!confirm("Remove this player from the tournament?")) return;
    
    try {
      const res = await fetch(`/api/tournaments/${id}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId })
      });
      
      if (res.ok) {
        toast.success("Player removed from tournament");
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to remove player");
      }
    } catch (error) {
      console.error("Error removing player:", error);
      toast.error("Failed to remove player");
    }
  }, [id]);

  const generateBracket = useCallback(async () => {
    if (participants.length < 2) {
      toast.error("Need at least 2 players to generate a bracket");
      return;
    }
    
    setGenerating(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/bracket`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (res.ok) {
        toast.success("Bracket generated successfully!");
        router.push(`/tournaments/${id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to generate bracket");
      }
    } catch (error) {
      console.error("Error generating bracket:", error);
      toast.error("Failed to generate bracket");
    } finally {
      setGenerating(false);
    }
  }, [participants, id, router]);

  // ✅ Filter available players by search term and exclude already added
  const filteredAvailablePlayers = useCallback(() => {
    const participantIds = new Set(participants.map(p => p.playerId));
    return availablePlayers
      .filter(p => !participantIds.has(p.id))
      .filter(p => {
        if (!searchTerm) return true;
        const name = (p.profile?.username || p.name || "").toLowerCase();
        const email = (p.email || "").toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      });
  }, [availablePlayers, participants, searchTerm]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400">Loading tournament data...</p>
          </div>
        </div>
      </>
    );
  }

  if (!tournament) {
    return (
      <>
        <DecorBackground />
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700 px-4">
          <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Tournament Not Found</h3>
          <p className="text-gray-400">The tournament you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/admin/tournaments")}
            className="mt-4 min-h-[44px] px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-150"
          >
            Back to Tournaments
          </button>
        </div>
      </>
    );
  }

  const currentPlayers = participants.filter(p => !p.eliminated).length;
  const canGenerate = participants.length >= 2 && (!tournament?.matches || tournament.matches.length === 0);
  const availableList = filteredAvailablePlayers();

  return (
    <>
      <DecorBackground />
      <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{tournament?.name || "Tournament"}</h1>
            <p className="text-gray-400 mt-1">Manage participants and generate bracket</p>
          </div>
          <button
            onClick={fetchData}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-gray-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.14]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Users} value={participants.length} label="Registered Players" color="text-blue-400" />
          <StatCard icon={Trophy} value={currentPlayers} label="Active Players" color="text-yellow-400" />
          <StatCard icon={Calendar} value={tournament?.maxPlayers || 0} label="Max Capacity" color="text-green-400" />
        </div>

        {/* Participants List */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
          <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
            <h2 className="text-lg font-semibold text-white">Participants ({participants.length}/{tournament?.maxPlayers || 0})</h2>
            {participants.length < (tournament?.maxPlayers || 999) && (
              <button
                onClick={() => setShowAddPlayer(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-colors duration-150 min-h-[44px]"
              >
                <Plus size={16} />
                Add Player
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-700/50">
            {participants.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p>No players added yet.</p>
                <p className="text-sm mt-1">Click "Add Player" to start building your tournament.</p>
              </div>
            ) : (
              participants.map((p, idx) => (
                <ParticipantRow key={p.id} participant={p} index={idx} onRemove={removePlayer} />
              ))
            )}
          </div>
        </div>

        {/* Generate Bracket */}
        {canGenerate && participants.length >= 2 && (
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-2">🚀 Ready to Generate Bracket</h2>
            <p className="text-gray-400 text-sm mb-4">
              {participants.length} players registered. Generate the tournament bracket to start matches.
            </p>
            <button
              onClick={generateBracket}
              disabled={generating}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors duration-150 disabled:opacity-50 min-h-[44px] flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Generate Bracket
                </>
              )}
            </button>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Add Player</h2>
                <button 
                  onClick={() => {
                    setShowAddPlayer(false);
                    setSelectedPlayer("");
                    setSearchTerm("");
                  }} 
                  className="text-gray-400 hover:text-white rounded-lg transition-colors duration-150 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search players..."
                  className="w-full min-h-[44px] pl-10 pr-4 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Player Select */}
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="w-full min-h-[44px] p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white mb-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Select a player --</option>
                {availableList.length === 0 ? (
                  <option value="" disabled>No available players</option>
                ) : (
                  availableList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.profile?.username || p.name || p.email} {p.email ? `(${p.email})` : ''}
                    </option>
                  ))
                )}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={addPlayer}
                  disabled={!selectedPlayer}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white min-h-[44px] py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  Add Player
                </button>
                <button
                  onClick={() => {
                    setShowAddPlayer(false);
                    setSelectedPlayer("");
                    setSearchTerm("");
                  }}
                  className="px-4 min-h-[44px] py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors duration-150"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500 text-center">
                {availableList.length} players available
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}