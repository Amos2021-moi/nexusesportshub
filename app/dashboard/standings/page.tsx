"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import LeagueTable from "@/components/league/LeagueTable";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  TrendingUp,
  Archive,
  EyeOff,
  DollarSign,
  Crown,
  Medal,
  Target,
  Star,
  ChevronDown,
  Sparkles,
  Zap,
  Shield,
  Users,
  Award,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { SkeletonLeagueTable, Skeleton } from "@/components/ui/Skeleton";
import PrizeDisplay from "@/components/competition/PrizeDisplay";

interface Season {
  id: string;
  name: string;
  isActive: boolean;
  status: string;
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
      <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
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
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Season Selector ===
const SeasonSelector = memo(({
  seasons,
  selectedSeason,
  onSeasonChange,
  activeSeason,
}: {
  seasons: Season[];
  selectedSeason: string;
  onSeasonChange: (id: string) => void;
  activeSeason?: Season;
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
        <Calendar className="h-4 w-4" />
        Season:
      </label>
      <div className="relative flex-1 min-w-[140px] sm:flex-none">
        <select
          value={selectedSeason}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="min-h-[44px] w-full appearance-none rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2 pr-10 text-sm text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name} {season.isActive && "⭐ (Active)"}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </div>

      {activeSeason?.isActive && (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold text-yellow-300 ring-1 ring-yellow-500/30">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          Active
        </span>
      )}

      <div className="flex-1 hidden sm:block" />
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <TrendingUp className="h-4 w-4" />
        <span>Last updated: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
});

SeasonSelector.displayName = "SeasonSelector";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function StandingsPage() {
  const isMobile = useIsMobile();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState<{ showStats: boolean }>({
    showStats: true,
  });
  const [showPrize, setShowPrize] = useState(false);

  const fetchSeasons = useCallback(async () => {
    try {
      const response = await fetch("/api/seasons");
      const data = await response.json();
      const seasonsArray = Array.isArray(data) ? data : [];
      setSeasons(seasonsArray);
      const activeSeason = seasonsArray.find((s: Season) => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason.id);
      } else if (seasonsArray.length > 0) {
        setSelectedSeason(seasonsArray[0].id);
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrivacySettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?category=privacy");
      if (res.ok) {
        const data = await res.json();
        setPrivacySettings({
          showStats: data.showStats !== undefined ? data.showStats : true,
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    }
  }, []);

  const checkPrizeEligibility = useCallback(async () => {
    try {
      const res = await fetch("/api/competition/player-entry");
      if (res.ok) {
        const data = await res.json();
        setShowPrize(data.paymentRequired && data.hasPaid && data.hasEntry);
      }
    } catch (error) {
      console.error("Error checking prize eligibility:", error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSeasons(), fetchPrivacySettings(), checkPrizeEligibility()]);
  }, [fetchSeasons, fetchPrivacySettings, checkPrizeEligibility]);

  const activeSeasonObj = useMemo(
    () => seasons.find((s) => s.id === selectedSeason),
    [seasons, selectedSeason]
  );

  const handleSeasonChange = useCallback((id: string) => {
    setSelectedSeason(id);
    checkPrizeEligibility();
  }, [checkPrizeEligibility]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="space-y-5 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
          <div className="flex items-start gap-3">
            <Skeleton variant="avatar" className="h-12 w-12" />
            <div>
              <Skeleton variant="text" className="w-48 h-8" />
              <Skeleton variant="text" className="w-64 h-4 mt-1" />
            </div>
          </div>
          <SkeletonLeagueTable />
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-5 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header - NO animations */}
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/30">
            <Trophy className="h-6 w-6 text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">🏆 League Standings</h1>
            <p className="text-gray-400 mt-1">Premier League style rankings</p>
          </div>
        </div>

        {/* Privacy Warning - NO animations */}
        {!privacySettings.showStats && (
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <EyeOff className="mt-0.5 h-5 w-5 text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-400">Your Stats are Hidden</h3>
                <p className="text-sm text-gray-300">
                  Your player statistics are currently private. You can change this
                  in your
                  <a
                    href="/dashboard/settings/privacy"
                    className="ml-1 text-indigo-400 transition-colors duration-150 hover:underline"
                  >
                    Privacy Settings
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Season Selector - NO animations */}
        {seasons.length > 0 && (
          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSeasonChange={handleSeasonChange}
            activeSeason={activeSeasonObj}
          />
        )}

        {/* League Table - NO animations */}
        <div>
          {selectedSeason ? (
            privacySettings.showStats ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <LeagueTable seasonId={selectedSeason} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/40 ring-1 ring-white/10">
                  <EyeOff className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">Stats are Private</h3>
                <p className="mx-auto max-w-md text-gray-400">
                  Your player statistics are currently hidden. You can change this
                  in your privacy settings.
                </p>
                <Link
                  href="/dashboard/settings/privacy"
                  className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-indigo-400 transition-colors duration-150 hover:text-indigo-300"
                >
                  Go to Privacy Settings <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400 backdrop-blur-xl">
              No seasons available.
            </div>
          )}
        </div>

        {/* Prize Display - NO animations */}
        {showPrize && (
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">🏆 Prize Pool</h3>
            </div>
            <PrizeDisplay compact={true} />
          </div>
        )}

        {/* Prize Breakdown - NO animations */}
        {showPrize && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Prize Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2 text-center">
                <Crown className="mx-auto mb-1 h-4 w-4 text-yellow-400" />
                <p className="text-xs text-gray-400">Champion</p>
                <p className="text-sm font-bold text-yellow-400">50%</p>
              </div>
              <div className="rounded-xl border border-gray-500/20 bg-gray-500/10 p-2 text-center">
                <Medal className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-400">Runner Up</p>
                <p className="text-sm font-bold text-gray-300">25%</p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-center">
                <Target className="mx-auto mb-1 h-4 w-4 text-blue-400" />
                <p className="text-xs text-gray-400">Top Scorer</p>
                <p className="text-sm font-bold text-blue-400">10%</p>
              </div>
              <div className="rounded-xl border border-gray-600 bg-gray-700/30 p-2 text-center">
                <DollarSign className="mx-auto mb-1 h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-400">Reserve</p>
                <p className="text-sm font-bold text-gray-400">15%</p>
              </div>
            </div>
            <Link
              href="/dashboard/prize"
              className="mt-3 block text-center text-xs text-indigo-400 transition-colors duration-150 hover:text-indigo-300"
            >
              View Full Prize Details →
            </Link>
          </div>
        )}

        {/* Season Archive Link - NO animations */}
        {selectedSeason && (
          <div className="flex justify-end">
            <Link
              href={`/seasons/${selectedSeason}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-indigo-400 backdrop-blur-xl transition-colors duration-150 hover:bg-white/10 hover:text-indigo-300"
            >
              <Archive size={16} />
              View Season Archive →
            </Link>
          </div>
        )}

        {/* Rules Card - NO animations */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/20 p-2">
              <Trophy className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-400">League Rules</h3>
              <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-gray-300 sm:grid-cols-2">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                  Win = <span className="font-bold text-green-400">3 points</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                  Draw = <span className="font-bold text-yellow-400">1 point</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                  Loss = <span className="font-bold text-red-400">0 points</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />
                  Ranking: Points → Goal Difference → Goals Scored
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}