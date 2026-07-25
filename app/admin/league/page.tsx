"use client";

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  Calendar,
  RefreshCw,
  X,
  UserPlus,
  Users2,
  Trophy,
  Crown,
  Sparkles,
  CheckCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ListChecks,
  Loader2,
  ChevronRight,
  Star,
  Zap,
  Medal,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { QUERY_KEYS, useAppMutation } from "@/lib/mutations";

interface Player {
  id: string;
  name: string;
  email: string;
  role: string;
  profile: { username: string } | null;
}

interface Season {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface LeagueEntry {
  id: string;
  playerId: string;
  player: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

// === Mobile Detection Hook ===
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
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

function playerLabel(player: Player) {
  return player.profile?.username || player.name || player.email;
}

function rankMedal(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Background - NO ANIMATIONS               */
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
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           Memoized Components                             */
/* -------------------------------------------------------------------------- */

// === STATIC Stat Card ===
const StatCard = memo(({ stat }: { stat: any }) => {
  const Icon = stat.icon;
  
  return (
    <div className={`group relative h-full overflow-hidden rounded-2xl border bg-white/5 p-3 shadow-xl backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/40 sm:p-4 ${stat.ring}`}>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-70`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xl font-bold sm:text-2xl ${stat.accent}`}>{stat.value}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">{stat.label}</p>
        </div>
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 sm:h-10 sm:w-10 ${stat.accent}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p className="relative mt-1 truncate text-[10px] text-gray-500 sm:text-[11px]">{stat.hint}</p>
    </div>
  );
});

StatCard.displayName = "StatCard";

// === STATIC Player Checkbox ===
const PlayerCheckbox = memo(({ player, isSelected, onToggle }: {
  player: Player;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) => {
  const handleToggle = useCallback(() => {
    onToggle(player.id);
  }, [onToggle, player.id]);

  return (
    <label
      className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-colors duration-150 ${
        isSelected
          ? "border-indigo-500 bg-indigo-500/20"
          : "border-white/10 bg-gray-800/50 hover:bg-gray-700/60"
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleToggle}
        className="h-4 w-4 flex-shrink-0 accent-indigo-500"
      />
      <span className="min-w-0 truncate text-sm text-white">
        {playerLabel(player)}
      </span>
    </label>
  );
});

PlayerCheckbox.displayName = "PlayerCheckbox";

// === STATIC League Table Row ===
const LeagueTableRow = memo(({ entry, index, onRemove }: { entry: LeagueEntry; index: number; onRemove: (entryId: string) => void }) => {
  const handleRemove = useCallback(() => {
    onRemove(entry.id);
  }, [onRemove, entry.id]);

  return (
    <tr className="transition-colors duration-150 hover:bg-white/5">
      <td className="sticky left-0 z-10 bg-gray-800/95 px-2 py-2 text-white backdrop-blur-xl sm:px-4 sm:py-3">
        <span className="text-sm sm:text-base">{rankMedal(index)}</span>
      </td>
      <td className="sticky left-8 z-10 bg-gray-800/95 px-2 py-2 text-white backdrop-blur-xl sm:left-12 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white sm:h-8 sm:w-8">
            {playerLabel(entry.player).charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate text-sm sm:max-w-[160px] sm:text-base">
            {playerLabel(entry.player)}
          </span>
        </div>
      </td>
      <td className="px-2 py-2 text-center text-gray-300 sm:px-4 sm:py-3">{entry.played}</td>
      <td className="px-2 py-2 text-center text-green-400 sm:px-4 sm:py-3">{entry.wins}</td>
      <td className="px-2 py-2 text-center text-yellow-400 sm:px-4 sm:py-3">{entry.draws}</td>
      <td className="px-2 py-2 text-center text-red-400 sm:px-4 sm:py-3">{entry.losses}</td>
      <td className="px-2 py-2 text-center font-bold text-white sm:px-4 sm:py-3">{entry.points}</td>
      <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
        <button
          onClick={handleRemove}
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-red-400 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-300"
          title="Remove player from season"
        >
          <X size={16} />
        </button>
      </td>
    </tr>
  );
});

LeagueTableRow.displayName = "LeagueTableRow";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function AdminLeaguePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [singlePlayerId, setSinglePlayerId] = useState("");

  // ✅ Role check - redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // ✅ Query: Fetch Seasons with caching
  const { data: seasons = [], isLoading: seasonsLoading } = useQuery({
    queryKey: ['admin-seasons'],
    queryFn: async () => {
      const res = await fetch("/api/seasons", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch seasons");
      return res.json();
    },
    staleTime: 300000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // ✅ Don't refetch on tab switch
    enabled: !!session && session.user?.role === "ADMIN",
  });

  // ✅ Query: Fetch Players with caching
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['admin-players'],
    queryFn: async () => {
      const res = await fetch("/api/players", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch players");
      const data = await res.json();
      return data?.data || data || [];
    },
    staleTime: 300000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!session && session.user?.role === "ADMIN",
  });

  // ✅ Query: Fetch League Entries with caching
  const { data: entries = [], isLoading: entriesLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['league-entries', selectedSeason],
    queryFn: async () => {
      if (!selectedSeason) return [];
      const timestamp = Date.now();
      const res = await fetch(`/api/league/entries?seasonId=${selectedSeason}&_=${timestamp}`, {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0, // Always fresh for entries
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!selectedSeason && !!session && session.user?.role === "ADMIN",
  });

  // ✅ Set selected season when seasons load
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      const activeSeason = seasons.find((s: Season) => s.isActive);
      setSelectedSeason(activeSeason?.id || seasons[0].id);
    }
  }, [seasons, selectedSeason]);

  const isLoading = seasonsLoading || playersLoading || entriesLoading;

  // ✅ Mutation for adding a single player
  const addPlayerMutation = useAppMutation(
    async ({ seasonId, playerId }: { seasonId: string; playerId: string }) => {
      const response = await fetch("/api/league/add-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ seasonId, playerId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add player");
      }
      
      await fetch("/api/competition/player-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId, userId: playerId }),
      });
      
      return response.json();
    },
    {
      successMessage: "Player added to season! ✅",
      invalidateKeys: [
        QUERY_KEYS.LEAGUE_ENTRIES,
        QUERY_KEYS.COMPETITION_ENTRIES,
        QUERY_KEYS.LEAGUE,
        QUERY_KEYS.COMPETITION,
      ],
      onSuccess: () => {
        setSinglePlayerId("");
        refetchEntries();
      },
    }
  );

  // ✅ Mutation for bulk adding players
  const bulkAddPlayersMutation = useAppMutation(
    async ({ seasonId, playerIds }: { seasonId: string; playerIds: string[] }) => {
      const results = [];
      for (const playerId of playerIds) {
        try {
          const response = await fetch("/api/league/add-player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ seasonId, playerId }),
          });
          
          const data = await response.json();
          
          if (data.alreadyExists === true) {
            try {
              await fetch("/api/competition/player-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ seasonId, userId: playerId }),
              });
              results.push({ playerId, success: true, alreadyExists: true });
            } catch {
              results.push({ playerId, success: true, alreadyExists: true });
            }
            continue;
          }
          
          if (response.ok) {
            results.push({ playerId, success: true });
            try {
              await fetch("/api/competition/player-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ seasonId, userId: playerId }),
              });
            } catch (err) {
              console.warn("Could not create competition entry:", err);
            }
          } else {
            results.push({ playerId, success: false, error: data.error });
          }
        } catch (error) {
          results.push({ playerId, success: false, error: String(error) });
        }
      }
      return results;
    },
    {
      successMessage: "Players processed successfully! ✅",
      invalidateKeys: [
        QUERY_KEYS.LEAGUE_ENTRIES,
        QUERY_KEYS.COMPETITION_ENTRIES,
        QUERY_KEYS.LEAGUE,
        QUERY_KEYS.COMPETITION,
      ],
      onSuccess: () => {
        setSelectedPlayers([]);
        refetchEntries();
      },
      onError: () => {
        setTimeout(() => refetchEntries(), 500);
      },
    }
  );

  // ✅ Mutation for removing a player
  const removePlayerMutation = useAppMutation(
    async ({ entryId }: { entryId: string }) => {
      const response = await fetch("/api/league/entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ entryId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove player");
      }
      return response.json();
    },
    {
      successMessage: "Player removed from season 🗑️",
      invalidateKeys: [
        QUERY_KEYS.LEAGUE_ENTRIES,
        QUERY_KEYS.COMPETITION_ENTRIES,
        QUERY_KEYS.LEAGUE,
        QUERY_KEYS.COMPETITION,
        QUERY_KEYS.DASHBOARD,
      ],
      onSuccess: () => {
        refetchEntries();
      },
    }
  );

  // Bulk add selected players
  const addSelectedPlayers = useCallback(async () => {
    if (!selectedSeason) {
      toast.error("Select a season first");
      return;
    }

    if (selectedPlayers.length === 0) {
      toast.error("Select at least one player");
      return;
    }

    setBulkAdding(true);
    await bulkAddPlayersMutation.mutateAsync({
      seasonId: selectedSeason,
      playerIds: selectedPlayers,
    });
    setBulkAdding(false);
  }, [selectedSeason, selectedPlayers, bulkAddPlayersMutation]);

  // Add ALL players
  const addAllPlayers = useCallback(async () => {
    if (!selectedSeason) {
      toast.error("Select a season first");
      return;
    }

    const availablePlayers = (players as Player[]).filter(
      (p) => p.role === "PLAYER" && !(entries as LeagueEntry[]).some((e) => e.playerId === p.id)
    );

    if (availablePlayers.length === 0) {
      toast.error("No new players to add");
      return;
    }

    if (!confirm(`Add all ${availablePlayers.length} players to this season?`)) {
      return;
    }

    setAddingAll(true);
    await bulkAddPlayersMutation.mutateAsync({
      seasonId: selectedSeason,
      playerIds: availablePlayers.map(p => p.id),
    });
    setAddingAll(false);
  }, [selectedSeason, players, entries, bulkAddPlayersMutation]);

  // Toggle player selection
  const togglePlayer = useCallback((playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }, []);

  // Select/Deselect all players
  const toggleAllPlayers = useCallback(() => {
    const availablePlayers = (players as Player[]).filter(
      (p) => p.role === "PLAYER" && !(entries as LeagueEntry[]).some((e) => e.playerId === p.id)
    );

    const allPlayerIds = availablePlayers.map((p) => p.id);

    if (selectedPlayers.length === allPlayerIds.length && allPlayerIds.length > 0) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(allPlayerIds);
    }
  }, [players, entries, selectedPlayers]);

  // Add single player
  const addPlayerToSeason = useCallback(async (playerId: string) => {
    if (!selectedSeason) {
      toast.error("Select a season first");
      return;
    }

    try {
      const response = await fetch("/api/league/add-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          seasonId: selectedSeason,
          playerId: playerId,
        }),
      });

      const data = await response.json();

      if (data.alreadyExists === true) {
        toast.success("Player already in season, syncing data...");
        
        try {
          await fetch("/api/competition/player-entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              seasonId: selectedSeason,
              userId: playerId,
            }),
          });
        } catch (err) {
          console.warn("Could not create competition entry:", err);
        }
        
        setSinglePlayerId("");
        refetchEntries();
        return;
      }

      if (response.ok) {
        toast.success("Player added to season!");
        await fetch("/api/competition/player-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seasonId: selectedSeason,
            userId: playerId,
          }),
        });
        setSinglePlayerId("");
        refetchEntries();
      } else {
        toast.error(data.error || "Failed to add player");
      }
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error("Failed to add player");
    }
  }, [selectedSeason, refetchEntries]);

  const removePlayerFromSeason = useCallback(async (entryId: string) => {
    if (!confirm("Are you sure you want to remove this player from the season? This will delete their stats.")) return;

    await removePlayerMutation.mutateAsync({ entryId });
  }, [removePlayerMutation]);

  const generateFixtures = useCallback(async () => {
    if (!selectedSeason) {
      toast.error("Select a season first");
      return;
    }

    if ((entries as LeagueEntry[]).length < 2) {
      toast.error("Need at least 2 players in the season to generate fixtures");
      return;
    }

    try {
      const response = await fetch("/api/fixtures/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ seasonId: selectedSeason }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Success! ${data.count} fixtures generated.`);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FIXTURES] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UPCOMING_FIXTURES] });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate fixtures");
      }
    } catch (error) {
      console.error("Error generating fixtures:", error);
      toast.error("Failed to generate fixtures");
    }
  }, [selectedSeason, entries, queryClient]);

  // Memoized computed values
  const availablePlayers = useMemo(() => 
    (players as Player[]).filter(
      (p) => p.role === "PLAYER" && !(entries as LeagueEntry[]).some((e) => e.playerId === p.id)
    ),
    [players, entries]
  );

  const filteredAvailablePlayers = useMemo(() => 
    availablePlayers.filter((p) =>
      playerLabel(p).toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(playerSearch.toLowerCase())
    ),
    [availablePlayers, playerSearch]
  );

  const sortedEntries = useMemo(
    () => [...(entries as LeagueEntry[])].sort((a, b) => b.points - a.points || b.wins - a.wins),
    [entries]
  );

  const selectedSeasonInfo = useMemo(() => 
    (seasons as Season[]).find((season) => season.id === selectedSeason),
    [seasons, selectedSeason]
  );

  const leader = useMemo(() => sortedEntries[0], [sortedEntries]);
  
  const totalPlayed = useMemo(() => 
    (entries as LeagueEntry[]).reduce((sum, entry) => sum + entry.played, 0),
    [entries]
  );

  const statCards = useMemo(() => [
    {
      label: "Season Players",
      value: (entries as LeagueEntry[]).length,
      hint: "Players in this season",
      icon: Users,
      accent: "text-indigo-400",
      ring: "border-indigo-500/20",
      glow: "from-indigo-500/20",
    },
    {
      label: "Matches Played",
      value: totalPlayed,
      hint: "Total recorded appearances",
      icon: Calendar,
      accent: "text-purple-400",
      ring: "border-purple-500/20",
      glow: "from-purple-500/20",
    },
    {
      label: "Points Leader",
      value: leader ? playerLabel(leader.player) : "—",
      hint: leader ? `${leader.points} points` : "No leader yet",
      icon: Crown,
      accent: "text-yellow-400",
      ring: "border-yellow-500/20",
      glow: "from-yellow-500/20",
    },
    {
      label: "Available Pool",
      value: availablePlayers.length,
      hint: "Players not in season",
      icon: UserPlus,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
  ], [entries, totalPlayed, leader, availablePlayers]);

  const handleSeasonChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSeason(e.target.value);
    setSelectedPlayers([]);
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    toast.loading("Refreshing data...");
    await Promise.all([
      refetchEntries(),
      queryClient.invalidateQueries({ queryKey: ['admin-seasons'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-players'] }),
    ]);
    toast.dismiss();
    toast.success("🔄 Data refreshed!");
  }, [refetchEntries, queryClient]);

  // Show loading while checking role
  if (status === "loading" || isLoading) {
    return (
      <>
        <DecorBackground />
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading league data...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your data</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
                <Trophy className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-white sm:text-2xl">
                  🏆 League Management
                </h1>
                <p className="mt-0.5 truncate text-xs text-gray-300 sm:text-sm">
                  Manage seasons, players, standings, and fixture generation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex w-fit items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                {selectedSeasonInfo?.name || "No season selected"}
              </span>
              <button
                onClick={handleRefresh}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-150 hover:border-white/30 hover:bg-white/[0.14] hover:text-white"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Season Selection */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Select Season</h2>
          </div>
          {(seasons as Season[]).length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-gray-900/40 py-8 text-center">
              <p className="text-gray-400">No seasons found.</p>
              <button
                onClick={() => router.push("/admin/seasons")}
                className="mt-3 inline-flex min-h-[44px] items-center justify-center text-indigo-400 transition-colors duration-150 hover:text-indigo-300"
              >
                Create a season first →
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={handleSeasonChange}
                className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-gray-900/50 p-3 pr-10 text-sm text-white transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:text-base"
              >
                {(seasons as Season[]).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-gray-500" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Add Player Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              Add Players to Season
            </h2>
            <span className="text-xs text-gray-500">
              {selectedPlayers.length} of {availablePlayers.length} selected
            </span>
          </div>

          <div className="space-y-4">
            {availablePlayers.length > 0 ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={toggleAllPlayers}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 text-sm font-medium text-indigo-300 transition-colors duration-150 hover:bg-indigo-500/20 sm:w-auto"
                  >
                    {selectedPlayers.length === availablePlayers.length ? "Deselect All" : "Select All"}
                  </button>
                  <div className="relative flex-1 sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search available players..."
                      className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/40 p-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAvailablePlayers.map((player) => (
                      <PlayerCheckbox
                        key={player.id}
                        player={player}
                        isSelected={selectedPlayers.includes(player.id)}
                        onToggle={togglePlayer}
                      />
                    ))}
                  </div>
                  {filteredAvailablePlayers.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-500">No available players match your search.</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={addSelectedPlayers}
                    disabled={bulkAdding || selectedPlayers.length === 0 || bulkAddPlayersMutation.isPending}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition-all duration-150 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 sm:px-6"
                  >
                    {bulkAdding || bulkAddPlayersMutation.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Selected ({selectedPlayers.length})
                      </>
                    )}
                  </button>

                  <button
                    onClick={addAllPlayers}
                    disabled={addingAll || availablePlayers.length === 0 || bulkAddPlayersMutation.isPending}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition-all duration-150 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 sm:px-6"
                  >
                    {addingAll || bulkAddPlayersMutation.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adding All...
                      </>
                    ) : (
                      <>
                        <Users2 size={18} />
                        Add All ({availablePlayers.length})
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-gray-900/40 py-6 text-center text-gray-400">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
                <p>All players are already in this season</p>
                <p className="mt-1 text-xs">Create more players from the Players page</p>
              </div>
            )}
          </div>

          {/* Quick Add - Single Player */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs text-gray-500">Or add a single player:</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={singlePlayerId}
                onChange={(e) => setSinglePlayerId(e.target.value)}
                className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-gray-900/50 p-3 text-sm text-white transition-colors duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">-- Select Player --</option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {playerLabel(p)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (singlePlayerId) addPlayerToSeason(singlePlayerId);
                }}
                disabled={!singlePlayerId || addPlayerMutation.isPending}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-700 disabled:opacity-50"
              >
                {addPlayerMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Current Participants */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Users className="h-5 w-5 text-blue-400" />
            Season Participants ({(entries as LeagueEntry[]).length})
          </h2>
          {(entries as LeagueEntry[]).length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No players added to this season yet</p>
              <p className="mt-1 text-sm">Use the form above to add players</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[600px] sm:min-w-[720px]">
                <thead className="bg-gray-900/60">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-900/95 px-2 py-2 text-left font-medium text-gray-400 backdrop-blur-xl sm:px-4 sm:py-3">#</th>
                    <th className="sticky left-8 z-10 bg-gray-900/95 px-2 py-2 text-left font-medium text-gray-400 backdrop-blur-xl sm:left-12 sm:px-4 sm:py-3">Player</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-400 sm:px-4 sm:py-3">P</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-400 sm:px-4 sm:py-3">W</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-400 sm:px-4 sm:py-3">D</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-400 sm:px-4 sm:py-3">L</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-400 sm:px-4 sm:py-3">Pts</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-400 sm:px-4 sm:py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedEntries.map((entry, index) => (
                    <LeagueTableRow key={entry.id} entry={entry} index={index} onRemove={removePlayerFromSeason} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generate Fixtures */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <ListChecks className="h-5 w-5 text-green-400" />
            Generate Fixtures
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            This will create home and away fixtures for all players in the season.
            {(entries as LeagueEntry[]).length < 2 && " Need at least 2 players to generate fixtures."}
          </p>
          <button
            onClick={generateFixtures}
            disabled={(entries as LeagueEntry[]).length < 2}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition-all duration-150 hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-base"
          >
            <Calendar size={18} />
            Generate Round-Robin Fixtures
          </button>
        </div>

        {/* Help Section */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-300 sm:text-base">
            <HelpCircle className="h-5 w-5" />
            How to manage your league:
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-xs text-gray-300 sm:text-sm">
            <li>Create a season first (if none exists)</li>
            <li>Add players to the season using the bulk selector above</li>
            <li>Once you have at least 2 players, click "Generate Fixtures"</li>
            <li>Players can submit results from their dashboard</li>
            <li>Approve results from the Results page</li>
            <li>Standings will update automatically</li>
          </ol>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-gray-900/30 p-3 text-xs text-gray-400 sm:items-center">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-blue-300" />
            <span>Points system shown above follows existing saved standings: P, W, D, L, and Pts.</span>
          </div>
        </div>
      </div>
    </>
  );
}