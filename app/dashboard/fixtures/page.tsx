"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calendar,
  CheckCircle,
  Clock,
  Trophy,
  AlertCircle,
  Lock,
  Eye,
  MessageCircle,
  Send,
  Calendar as CalendarIcon,
  ArrowRight,
  Download,
  FileText,
  X,
  Zap,
  Sparkles,
  User,
  Phone,
  RefreshCw,
  Shield,
  Mail,
  Star,
  Loader2,
} from "lucide-react";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import EvidenceViewer from "@/components/ui/EvidenceViewer";
import TrustBadge from "@/components/ui/TrustBadge";
import toast from "react-hot-toast";
import { Skeleton, SkeletonMatchCard } from "@/components/ui/Skeleton";
import Image from "next/image";
import MatchPredictionCard from "@/components/predictions/MatchPredictionCard";
import PredictionBadge from "@/components/predictions/PredictionBadge";
import { invalidateQueries } from "@/lib/react-query";

interface Fixture {
  id: string;
  status: string;
  homePlayer: {
    name: string;
    email: string;
    profile: {
      username: string;
      profilePicture: string;
      whatsappNumber: string;
      whatsappVisible: boolean;
    } | null;
  };
  awayPlayer: {
    name: string;
    email: string;
    profile: {
      username: string;
      profilePicture: string;
      whatsappNumber: string;
      whatsappVisible: boolean;
    } | null;
  };
  homeScore: number | null;
  awayScore: number | null;
  scheduledDate: string;
  result: { approved: boolean; evidenceImage: string } | null;
  season: {
    id: string;
    name: string;
    status: string;
    endDate: string;
  } | null;
}

interface Prediction {
  matchId: string;
  homePlayer: {
    id: string;
    name: string;
    elo: number;
    form: ("W" | "D" | "L")[];
    winRate: number;
  };
  awayPlayer: {
    id: string;
    name: string;
    elo: number;
    form: ("W" | "D" | "L")[];
    winRate: number;
  };
  predictedWinner: {
    id: string;
    name: string;
  };
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
  confidenceColor: "green" | "yellow" | "red";
  factors: {
    eloAdvantage: string;
    formAdvantage: string;
    h2hAdvantage: string;
    homeAdvantage: string;
  };
  keyInsights: string[];
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
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Status Badge ===
const StatusBadge = memo(({ status }: { status: string }) => {
  switch (status) {
    case "SCHEDULED":
      return (
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-blue-500/10">
          <Calendar size={14} className="text-blue-400" />
          <span className="text-xs font-medium text-blue-400">Upcoming</span>
        </div>
      );
    case "LOCKED":
      return (
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-orange-500/10">
          <Lock size={14} className="text-orange-400" />
          <span className="text-xs font-medium text-orange-400">Locked</span>
        </div>
      );
    case "PENDING":
      return (
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-yellow-500/10">
          <Clock size={14} className="text-yellow-400" />
          <span className="text-xs font-medium text-yellow-400">Pending Approval</span>
        </div>
      );
    case "COMPLETED":
      return (
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-green-500/10">
          <CheckCircle size={14} className="text-green-400" />
          <span className="text-xs font-medium text-green-400">Completed</span>
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-gray-500/10">
          <AlertCircle size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Unknown</span>
        </div>
      );
  }
});

StatusBadge.displayName = "StatusBadge";

// === STATIC Time Suggestion Modal ===
const TimeSuggestionModal = memo(({
  fixture,
  onClose,
}: {
  fixture: Fixture;
  onClose: () => void;
}) => {
  const [proposedTime, setProposedTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuggest = useCallback(async () => {
    if (!proposedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/fixtures/${fixture.id}/suggest-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposedTime, message }),
    });

    if (res.ok) {
      const { whatsappUrl } = await res.json();
      window.open(whatsappUrl, "_blank");
      onClose();
      toast.success("Opening WhatsApp with your suggestion...");
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to suggest time");
    }
    setLoading(false);
  }, [proposedTime, message, fixture.id, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-800/90 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <CalendarIcon className="h-4 w-4 text-white" />
            </span>
            Suggest Match Time
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a personal message..."
              className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white placeholder-gray-500 transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSuggest}
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-2 text-sm font-semibold text-white shadow-lg transition-colors duration-150 hover:from-green-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send via WhatsApp
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

TimeSuggestionModal.displayName = "TimeSuggestionModal";

// === STATIC Fixture Card ===
const FixtureCard = memo(({ 
  fixture, 
  session, 
  onSuggestTime, 
  calendarSyncEnabled,
  prediction,
  predictionLoading,
  onDownloadCalendar,
}: any) => {
  const isMobile = useIsMobile();
  const homeName = fixture.homePlayer?.profile?.username || fixture.homePlayer?.name || "Home";
  const awayName = fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name || "Away";
  const hasResult = fixture.homeScore !== null;
  const isPending = fixture.status === "PENDING";
  const isCompleted = fixture.status === "COMPLETED";
  const isActionable = fixture.status === "SCHEDULED" || fixture.status === "LOCKED";
  const seasonStatus = fixture.season?.status || "UNKNOWN";
  const seasonDisplay = getSeasonDisplayStatus(seasonStatus);
  
  const opponent = fixture.homePlayer?.name === session?.user?.name 
    ? fixture.awayPlayer 
    : fixture.homePlayer;
  const opponentName = opponent?.profile?.username || opponent?.name || "Opponent";
  const opponentWhatsApp = opponent?.profile?.whatsappNumber || null;
  const opponentWhatsAppVisible = opponent?.profile?.whatsappVisible || false;
  const youAreHome = fixture.homePlayer?.name === session?.user?.name;
  const youAreAway = fixture.awayPlayer?.name === session?.user?.name;

  const getWinner = () => {
    if (!fixture.homeScore || !fixture.awayScore) return null;
    if (fixture.homeScore > fixture.awayScore)
      return fixture.homePlayer?.profile?.username || fixture.homePlayer?.name;
    if (fixture.awayScore > fixture.homeScore)
      return fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name;
    return "Draw";
  };
  const winner = getWinner();

  const hoverClass = isMobile ? "" : "hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10";

  return (
    <div className={`rounded-2xl border border-white/10 bg-gray-800/40 p-4 backdrop-blur-xl transition-all duration-150 ${hoverClass} sm:p-6`}>
      {/* Status Badge */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={fixture.status} />
        <div className="flex flex-wrap items-center gap-2">
          {isCompleted && winner && winner !== "Draw" && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Trophy size={12} />
              Winner: {winner}
            </div>
          )}
          {isCompleted && winner === "Draw" && (
            <div className="text-xs text-yellow-400">Match Drawn</div>
          )}
          {fixture.result?.approved && (
            <TrustBadge type="admin-approved" />
          )}
        </div>
      </div>

      {/* Match Teams */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex-1 text-center">
          {fixture.homePlayer?.profile?.profilePicture ? (
            <Image
              src={fixture.homePlayer.profile.profilePicture || "/default-avatar.png"}
              alt={homeName}
              width={64}
              height={64}
              className="mx-auto mb-2 h-16 w-16 rounded-full border-2 border-indigo-500 object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white">
              {homeName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="font-semibold text-white">{homeName}</p>
          {youAreHome && (
            <span className="mt-1 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
              You
            </span>
          )}
        </div>

        <div className="px-4">
          {hasResult ? (
            <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 px-4 py-2 text-2xl font-bold text-white">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gray-900/50 text-sm font-bold text-gray-400">
              VS
            </span>
          )}
        </div>

        <div className="flex-1 text-center">
          {fixture.awayPlayer?.profile?.profilePicture ? (
            <Image
              src={fixture.awayPlayer.profile.profilePicture || "/default-avatar.png"}
              alt={awayName}
              width={64}
              height={64}
              className="mx-auto mb-2 h-16 w-16 rounded-full border-2 border-purple-500 object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xl font-bold text-white">
              {awayName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="font-semibold text-white">{awayName}</p>
          {youAreAway && (
            <span className="mt-1 inline-block rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 ring-1 ring-purple-500/30">
              You
            </span>
          )}
        </div>
      </div>

      {/* Match Prediction */}
      {isActionable && !hasResult && (
        <div className="mt-4">
          {predictionLoading ? (
            <div className="animate-pulse rounded-xl bg-gray-700/30 p-4">
              <div className="h-4 w-32 rounded bg-gray-600/50" />
              <div className="mt-2 h-2 w-full rounded bg-gray-600/50" />
              <div className="mt-2 flex justify-between">
                <div className="h-3 w-16 rounded bg-gray-600/50" />
                <div className="h-3 w-16 rounded bg-gray-600/50" />
              </div>
            </div>
          ) : prediction ? (
            <div className="rounded-xl border border-white/5 bg-gray-900/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-medium text-gray-400">AI Prediction</span>
                <PredictionBadge
                  winner={prediction.predictedWinner.name}
                  confidence={prediction.confidence}
                  confidenceLabel={prediction.confidenceLabel}
                  compact={true}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>🏠 {prediction.homeWinProbability}%</span>
                <span>🤝 {prediction.drawProbability}%</span>
                <span>✈️ {prediction.awayWinProbability}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                <div className="flex h-full">
                  <div
                    className="h-full rounded-l-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${prediction.homeWinProbability}%` }}
                  />
                  <div
                    className="h-full bg-yellow-500/50"
                    style={{ width: `${prediction.drawProbability}%` }}
                  />
                  <div
                    className="h-full rounded-r-full bg-gradient-to-r from-pink-500 to-rose-500"
                    style={{ width: `${prediction.awayWinProbability}%` }}
                  />
                </div>
              </div>
              {prediction.keyInsights && prediction.keyInsights.length > 0 && (
                <div className="mt-2 text-[10px] text-gray-500">
                  💡 {prediction.keyInsights[0]}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-gray-900/30 p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Zap className="h-4 w-4 text-gray-600" />
                <span>Prediction unavailable</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-600">
                Need more match data for accurate predictions
              </p>
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-400">
        <CalendarIcon size={14} className="text-gray-500" />
        {new Date(fixture.scheduledDate).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      {/* Evidence Viewer */}
      {isPending && fixture.result?.evidenceImage && (
        <div className="mt-3 text-center">
          <EvidenceViewer evidenceImage={fixture.result.evidenceImage} />
        </div>
      )}

      {/* Locked Indicator */}
      {isPending && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-yellow-500">
            <Clock size={14} />
            <span>Pending admin approval</span>
          </div>
        </div>
      )}

      {/* Completed Indicator */}
      {isCompleted && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-green-500">
            <CheckCircle size={14} />
            <span>Match completed - result finalized</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isActionable && !hasResult && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {seasonDisplay.canWhatsApp && opponentWhatsAppVisible && opponentWhatsApp && (
            <div className="mb-3">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-3 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-green-400">
                  <MessageCircle size={14} />
                  <span>Contact Opponent via WhatsApp</span>
                </div>
                <WhatsAppButton
                  opponentWhatsApp={opponentWhatsApp}
                  opponentWhatsAppVisible={opponentWhatsAppVisible}
                  opponentName={opponentName}
                  fixtureId={fixture.id}
                  seasonName={fixture.season?.name}
                  deadline={fixture.season?.endDate}
                  homePlayer={homeName}
                  awayPlayer={awayName}
                />
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Shield size={10} className="text-green-500" />
                  <span>End-to-end encrypted</span>
                  <span className="mx-1">•</span>
                  <span>Quick coordination</span>
                </div>
              </div>
            </div>
          )}

          {seasonDisplay.canSuggestTime && (
            <button
              onClick={() => onSuggestTime(fixture.id)}
              className="mb-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white shadow-lg transition-colors duration-150 hover:from-blue-500 hover:to-indigo-500"
            >
              <CalendarIcon size={16} />
              Suggest Match Time
            </button>
          )}

          {seasonDisplay.canSubmit && (
            <Link
              href={`/dashboard/results/submit/${fixture.id}`}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-center text-sm text-white shadow-lg transition-colors duration-150 hover:from-green-500 hover:to-emerald-500"
            >
              <CheckCircle size={16} />
              Submit Result
            </Link>
          )}
        </div>
      )}

      {/* Calendar Sync */}
      {isActionable && calendarSyncEnabled && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => onDownloadCalendar(fixture.id)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/20 px-4 py-1.5 text-sm text-blue-400 transition-colors duration-150 hover:bg-blue-500/30"
          >
            <Download size={14} />
            <FileText size={14} />
            Add to Calendar (.ics)
          </button>
        </div>
      )}

      {calendarSyncEnabled && isActionable && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-500">📅 Calendar sync enabled</span>
        </div>
      )}

      {/* Match Center Link */}
      {!isActionable && (
        <div className="mt-3 border-t border-white/10 pt-3 text-center">
          <Link
            href={`/matches/${fixture.id}`}
            className="inline-flex items-center gap-1 text-sm text-indigo-400 transition-colors duration-150 hover:text-indigo-300"
          >
            View Match Center <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
});

FixtureCard.displayName = "FixtureCard";

/* -------------------------------------------------------------------------- */
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

function getSeasonDisplayStatus(status: string) {
  switch (status) {
    case "PRESEASON":
      return {
        showFixtures: false,
        canSubmit: false,
        canWhatsApp: false,
        canSuggestTime: false,
        message: "Season hasn't started yet. Fixtures will be available soon.",
        icon: Calendar,
      };
    case "REGISTRATION":
      return {
        showFixtures: false,
        canSubmit: false,
        canWhatsApp: false,
        canSuggestTime: false,
        message: "Registration is open. Fixtures will be generated after registration closes.",
        icon: Calendar,
      };
    case "FIXTURE_LOCK":
      return {
        showFixtures: true,
        canSubmit: false,
        canWhatsApp: true,
        canSuggestTime: true,
        message: "Fixtures are locked. You can view your matches and contact opponents.",
        icon: Lock,
      };
    case "LIVE":
      return {
        showFixtures: true,
        canSubmit: true,
        canWhatsApp: true,
        canSuggestTime: true,
        message: "Season is LIVE! Submit your match results.",
        icon: Trophy,
      };
    case "ENDED":
      return {
        showFixtures: true,
        canSubmit: false,
        canWhatsApp: false,
        canSuggestTime: false,
        message: "Season has ended. View your match history.",
        icon: Eye,
      };
    case "ARCHIVED":
      return {
        showFixtures: true,
        canSubmit: false,
        canWhatsApp: false,
        canSuggestTime: false,
        message: "Season is archived. Read-only mode.",
        icon: Eye,
      };
    default:
      return {
        showFixtures: false,
        canSubmit: false,
        canWhatsApp: false,
        canSuggestTime: false,
        message: "Season status unknown",
        icon: AlertCircle,
      };
  }
}

function isActionableFixture(status: string): boolean {
  return status === "SCHEDULED" || status === "LOCKED";
}

// ✅ Use React Query for predictions instead of useEffect
async function fetchPrediction(matchId: string): Promise<Prediction | null> {
  try {
    const res = await fetch(`/api/predictions/${matchId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.prediction || null;
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function FixturesPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [showTimeModal, setShowTimeModal] = useState<string | null>(null);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    paymentRequired: boolean;
    hasPaid: boolean;
    entryFee: number;
    seasonName: string;
  } | null>(null);

  // ✅ OPTIMIZED: Use React Query for fixtures with auto-refresh
  const { 
    data: fixturesData, 
    isLoading, 
    refetch: refetchFixtures 
  } = useQuery({
    queryKey: ['fixtures', session?.user?.id],
    queryFn: async () => {
      const response = await fetch("/api/fixtures", { 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch fixtures");
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    enabled: !!session,
  });

  // ✅ Also fetch season status separately for real-time updates
  const { data: seasonData, refetch: refetchSeason } = useQuery({
    queryKey: ['active-season-status'],
    queryFn: async () => {
      const response = await fetch("/api/seasons/active", { 
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) throw new Error("Failed to fetch season status");
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
    enabled: !!session,
  });

  // ✅ Use React Query for predictions - fetches for each actionable fixture
  const actionableFixtures = fixturesData?.fixtures?.filter((f: Fixture) => isActionableFixture(f.status)) || [];
  
  // ✅ Fetch predictions using React Query
  const predictionsQuery = useQuery({
    queryKey: ['predictions', actionableFixtures.map((f: Fixture) => f.id).join(',')],
    queryFn: async () => {
      const predictionsMap: Record<string, Prediction> = {};
      await Promise.all(
        actionableFixtures.map(async (fixture: Fixture) => {
          const prediction = await fetchPrediction(fixture.id);
          if (prediction) {
            predictionsMap[fixture.id] = prediction;
          }
        })
      );
      return predictionsMap;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
    enabled: actionableFixtures.length > 0 && !!session,
  });

  const predictions = predictionsQuery.data || {};
  const predictionLoading = predictionsQuery.isLoading;

  // ✅ Extract fixtures and payment info
  const fixtures = fixturesData?.fixtures || (Array.isArray(fixturesData) ? fixturesData : []);
  const paymentInfoData = fixturesData?.paymentRequired !== undefined ? fixturesData : null;
  
  // ✅ Use season data from API or from fixtures
  const activeSeasonStatus = seasonData?.status || fixtures[0]?.season?.status || "UNKNOWN";

  // ✅ Set payment info
  useEffect(() => {
    if (paymentInfoData?.paymentRequired !== undefined) {
      setPaymentInfo({
        paymentRequired: paymentInfoData.paymentRequired,
        hasPaid: paymentInfoData.hasPaid,
        entryFee: paymentInfoData.entryFee || 0,
        seasonName: paymentInfoData.seasonName || "Season",
      });
    }
  }, [paymentInfoData]);

  // ✅ Fetch calendar sync preference
  useEffect(() => {
    async function fetchCalendarSyncPreference() {
      try {
        const res = await fetch("/api/settings?category=competition&key=fixtureCalendarSync");
        if (res.ok) {
          const data = await res.json();
          setCalendarSyncEnabled(data.fixtureCalendarSync || false);
        }
      } catch (error) {
        console.error("Error fetching calendar sync preference:", error);
      }
    }
    fetchCalendarSyncPreference();
  }, []);

  // ✅ Download calendar
  const downloadCalendar = useCallback(async (fixtureId: string) => {
    try {
      toast.loading("Generating calendar file...");
      const res = await fetch(`/api/fixtures/${fixtureId}/calendar`);
      const data = await res.json();
      toast.dismiss();

      if (data.ics) {
        const blob = new Blob([data.ics], { type: "text/calendar" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `match-${fixtureId}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Calendar file downloaded! Add it to your calendar app.");
      } else {
        toast.error("Failed to generate calendar file");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error downloading calendar:", error);
      toast.error("Failed to download calendar");
    }
  }, []);

  // ✅ Manual refresh
  const handleRefresh = useCallback(async () => {
    toast.loading("Refreshing fixtures...");
    await Promise.all([
      refetchFixtures(),
      refetchSeason(),
      predictionsQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ['fixtures'] }),
      queryClient.invalidateQueries({ queryKey: ['active-season-status'] }),
      queryClient.invalidateQueries({ queryKey: ['predictions'] }),
    ]);
    toast.dismiss();
    toast.success("🔄 Fixtures refreshed!");
  }, [refetchFixtures, refetchSeason, predictionsQuery, queryClient]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <DecorBackground />
        <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
          <div>
            <Skeleton variant="text" className="w-48 h-8" />
            <Skeleton variant="text" className="w-64 h-4 mt-1" />
          </div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonMatchCard key={i} />
            ))}
          </div>
        </div>
      </>
    );
  }

  // Payment required state
  if (paymentInfo?.paymentRequired && !paymentInfo?.hasPaid) {
    return (
      <>
        <DecorBackground />
        <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">My Fixtures</h1>
            <p className="text-gray-400 mt-1">Your upcoming matches</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/40 ring-1 ring-white/10">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">🔒 Payment Required</h2>
            <p className="text-gray-400">You need to pay the entry fee to view your fixtures.</p>
            <p className="mt-1 text-sm text-gray-500">Entry Fee: KES {paymentInfo.entryFee}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              Go to Dashboard to Pay
            </Link>
          </div>
        </div>
      </>
    );
  }

  const seasonStatus = activeSeasonStatus || fixtures[0]?.season?.status || "UNKNOWN";
  const seasonDisplay = getSeasonDisplayStatus(seasonStatus);

  if (!seasonDisplay.showFixtures) {
    return (
      <>
        <DecorBackground />
        <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">My Fixtures</h1>
            <p className="text-gray-400 mt-1">Your upcoming matches</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/40 ring-1 ring-white/10">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">No Fixtures Available</h2>
            <p className="text-gray-400">{seasonDisplay.message}</p>
            {seasonStatus === "REGISTRATION" && (
              <p className="mt-2 text-sm text-gray-500">Check back after the admin generates fixtures.</p>
            )}
          </div>
        </div>
      </>
    );
  }

  const myFixtures = fixtures.filter(
    (f: Fixture) =>
      f.homePlayer?.name === session?.user?.name ||
      f.awayPlayer?.name === session?.user?.name,
  );

  if (myFixtures.length === 0) {
    return (
      <>
        <DecorBackground />
        <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">My Fixtures</h1>
            <p className="text-gray-400 mt-1">Your upcoming matches</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/40 ring-1 ring-white/10">
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">No Fixtures Yet</h2>
            <p className="text-gray-400">Fixtures will appear here once the admin generates them.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-6 px-3 pb-20 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">My Fixtures</h1>
          <p className="text-gray-400 mt-1">Your upcoming and past matches</p>
        </div>

        {/* Season Banner - Updates in real-time */}
        <div
          className={`rounded-2xl border p-4 backdrop-blur-xl ${
            seasonStatus === "LIVE"
              ? "border-green-500/30 bg-green-500/15"
              : seasonStatus === "FIXTURE_LOCK"
                ? "border-blue-500/30 bg-blue-500/15"
                : "border-white/10 bg-gray-800/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                seasonStatus === "LIVE"
                  ? "bg-green-500/20"
                  : seasonStatus === "FIXTURE_LOCK"
                    ? "bg-blue-500/20"
                    : "bg-gray-700/40"
              }`}
            >
              {seasonStatus === "LIVE" && <Trophy size={20} className="text-green-400" />}
              {seasonStatus === "FIXTURE_LOCK" && <Lock size={20} className="text-blue-400" />}
              {seasonStatus !== "LIVE" && seasonStatus !== "FIXTURE_LOCK" && (
                <Calendar size={20} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">Season Status: {seasonStatus}</p>
              <p
                className={`text-sm ${
                  seasonStatus === "LIVE"
                    ? "text-green-400"
                    : seasonStatus === "FIXTURE_LOCK"
                      ? "text-blue-400"
                      : "text-gray-400"
                }`}
              >
                {seasonDisplay.message}
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Indicator with auto-refresh status */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              Auto-refreshes every 5s
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <RefreshCw size={12} />
            Refresh now
          </button>
        </div>

        {/* Fixtures List */}
        <div className="grid gap-4">
          {myFixtures.map((fixture: Fixture) => {
            const prediction = predictions[fixture.id];
            const isLoadingPrediction = predictionLoading;

            return (
              <FixtureCard
                key={fixture.id}
                fixture={fixture}
                session={session}
                onSuggestTime={setShowTimeModal}
                calendarSyncEnabled={calendarSyncEnabled}
                prediction={prediction}
                predictionLoading={isLoadingPrediction}
                onDownloadCalendar={downloadCalendar}
              />
            );
          })}
        </div>

        {/* Time Suggestion Modal */}
        {showTimeModal && (
          <TimeSuggestionModal
            fixture={myFixtures.find((f: Fixture) => f.id === showTimeModal)!}
            onClose={() => setShowTimeModal(null)}
          />
        )}
      </div>
    </>
  );
}