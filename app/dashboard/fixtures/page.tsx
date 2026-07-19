"use client";

import { useEffect, useState, useCallback } from "react";
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
  Shield,
  Mail,
  Star,
} from "lucide-react";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import EvidenceViewer from "@/components/ui/EvidenceViewer";
import TrustBadge from "@/components/ui/TrustBadge";
import toast from "react-hot-toast";
import { Skeleton, SkeletonMatchCard } from "@/components/ui/Skeleton";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// Time Suggestion Modal Component
function TimeSuggestionModal({
  fixture,
  onClose,
}: {
  fixture: Fixture;
  onClose: () => void;
}) {
  const [proposedTime, setProposedTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
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
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 [color-scheme:dark]"
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
              className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-2.5 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSuggest}
              disabled={loading}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-green-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send size={16} />
                  Send via WhatsApp
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "SCHEDULED":
      return { text: "Upcoming", color: "text-blue-400", bg: "bg-blue-500/10", icon: Calendar };
    case "LOCKED":
      return { text: "Locked", color: "text-orange-400", bg: "bg-orange-500/10", icon: Lock };
    case "PENDING":
      return { text: "Pending Approval", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock };
    case "COMPLETED":
      return { text: "Completed", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle };
    default:
      return { text: status || "Unknown", color: "text-gray-400", bg: "bg-gray-500/10", icon: AlertCircle };
  }
}

function isActionableFixture(status: string): boolean {
  return status === "SCHEDULED" || status === "LOCKED";
}

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

// ✅ Fetch prediction for a match
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

export default function FixturesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showTimeModal, setShowTimeModal] = useState<string | null>(null);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [predictionLoading, setPredictionLoading] = useState<Record<string, boolean>>({});
  const [paymentInfo, setPaymentInfo] = useState<{
    paymentRequired: boolean;
    hasPaid: boolean;
    entryFee: number;
    seasonName: string;
  } | null>(null);

  // ✅ Use React Query for fixtures
  const { 
    data: fixturesData, 
    isLoading, 
    refetch: refetchFixtures 
  } = useQuery({
    queryKey: ['fixtures'],
    queryFn: async () => {
      const response = await fetch("/api/fixtures", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch fixtures");
      return response.json();
    },
    staleTime: 0, // ✅ Always fresh
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // ✅ Auto-refresh every 30 seconds
  });

  // ✅ Extract fixtures and payment info from response
  const fixtures = fixturesData?.fixtures || (Array.isArray(fixturesData) ? fixturesData : []);
  const paymentInfoData = fixturesData?.paymentRequired !== undefined ? fixturesData : null;

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

  // ✅ Fetch predictions for each fixture
  useEffect(() => {
    if (fixtures.length === 0) return;

    const fetchAllPredictions = async () => {
      const predictionsMap: Record<string, Prediction> = {};
      
      for (const fixture of fixtures) {
        const isActionable = isActionableFixture(fixture.status);
        if (!isActionable) continue;

        setPredictionLoading((prev) => ({ ...prev, [fixture.id]: true }));
        const prediction = await fetchPrediction(fixture.id);
        if (prediction) {
          predictionsMap[fixture.id] = prediction;
        }
        setPredictionLoading((prev) => ({ ...prev, [fixture.id]: false }));
      }

      setPredictions(predictionsMap);
    };

    fetchAllPredictions();
  }, [fixtures]);

  // ✅ Download calendar
  async function downloadCalendar(fixtureId: string) {
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
  }

  // ✅ Get opponent
  const getOpponent = (fixture: Fixture) => {
    const isHome = fixture.homePlayer?.name === session?.user?.name;
    const opponent = isHome ? fixture.awayPlayer : fixture.homePlayer;
    const opponentName = opponent?.profile?.username || opponent?.name || "Opponent";
    const opponentWhatsApp = opponent?.profile?.whatsappNumber || null;
    const opponentWhatsAppVisible = opponent?.profile?.whatsappVisible || false;
    return { opponentName, opponentWhatsApp, opponentWhatsAppVisible, isHome };
  };

  // ✅ Get winner
  const getWinner = (fixture: Fixture) => {
    if (!fixture.homeScore || !fixture.awayScore) return null;
    if (fixture.homeScore > fixture.awayScore)
      return fixture.homePlayer?.profile?.username || fixture.homePlayer?.name;
    if (fixture.awayScore > fixture.homeScore)
      return fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name;
    return "Draw";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
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
    );
  }

  // Payment required state
  if (paymentInfo?.paymentRequired && !paymentInfo?.hasPaid) {
    return (
      <div className="space-y-6">
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
            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white transition hover:from-indigo-500 hover:to-purple-500"
          >
            Go to Dashboard to Pay
          </Link>
        </div>
      </div>
    );
  }

  const seasonStatus = fixtures[0]?.season?.status || "UNKNOWN";
  const seasonDisplay = getSeasonDisplayStatus(seasonStatus);

  if (!seasonDisplay.showFixtures) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">My Fixtures</h1>
          <p className="text-gray-400 mt-1">Your upcoming matches</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700/40 ring-1 ring-white/10">
            <seasonDisplay.icon size={32} className="text-gray-400" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">No Fixtures Available</h2>
          <p className="text-gray-400">{seasonDisplay.message}</p>
          {seasonStatus === "REGISTRATION" && (
            <p className="mt-2 text-sm text-gray-500">Check back after the admin generates fixtures.</p>
          )}
        </div>
      </div>
    );
  }

  const myFixtures = fixtures.filter(
    (f: Fixture) =>
      f.homePlayer?.name === session?.user?.name ||
      f.awayPlayer?.name === session?.user?.name,
  );

  if (myFixtures.length === 0) {
    return (
      <div className="space-y-6">
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
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">My Fixtures</h1>
          <p className="text-gray-400 mt-1">Your upcoming and past matches</p>
        </motion.div>

        {/* Season Banner */}
        <motion.div
          variants={itemVariants}
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
        </motion.div>

        <motion.div variants={containerVariants} className="grid gap-4">
          {myFixtures.map((fixture: Fixture) => {
            const homeName =
              fixture.homePlayer?.profile?.username ||
              fixture.homePlayer?.name ||
              "Home";
            const awayName =
              fixture.awayPlayer?.profile?.username ||
              fixture.awayPlayer?.name ||
              "Away";
            const hasResult = fixture.homeScore !== null;
            const isPending = fixture.status === "PENDING";
            const isCompleted = fixture.status === "COMPLETED";
            const isActionable = isActionableFixture(fixture.status);
            const statusBadge = getStatusBadge(fixture.status);
            const StatusIcon = statusBadge.icon;
            const { opponentName, opponentWhatsApp, opponentWhatsAppVisible } =
              getOpponent(fixture);
            const winner = getWinner(fixture);
            const youAreHome = fixture.homePlayer?.name === session?.user?.name;
            const youAreAway = fixture.awayPlayer?.name === session?.user?.name;
            const prediction = predictions[fixture.id];

            return (
              <motion.div
                key={fixture.id}
                variants={itemVariants}
                className="rounded-2xl border border-white/10 bg-gray-800/40 p-6 backdrop-blur-xl transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                {/* Status Badge */}
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${statusBadge.bg}`}
                  >
                    <StatusIcon size={14} className={statusBadge.color} />
                    <span className={`text-xs font-medium ${statusBadge.color}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                        src={
                          fixture.homePlayer.profile.profilePicture ||
                          "/default-avatar.png"
                        }
                        alt={homeName}
                        width={64}
                        height={64}
                        className="mx-auto mb-2 h-16 w-16 rounded-full border-2 border-indigo-500 object-cover"
                        loading="lazy"
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
                        src={
                          fixture.awayPlayer.profile.profilePicture ||
                          "/default-avatar.png"
                        }
                        alt={awayName}
                        width={64}
                        height={64}
                        className="mx-auto mb-2 h-16 w-16 rounded-full border-2 border-purple-500 object-cover"
                        loading="lazy"
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
                    {predictionLoading[fixture.id] ? (
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
                          <span className="text-xs font-medium text-gray-400">
                            AI Prediction
                          </span>
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
                    {seasonDisplay.canWhatsApp &&
                      opponentWhatsAppVisible &&
                      opponentWhatsApp && (
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
                        onClick={() => setShowTimeModal(fixture.id)}
                        className="mb-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500"
                      >
                        <CalendarIcon size={16} />
                        Suggest Match Time
                      </button>
                    )}

                    {seasonDisplay.canSubmit && (
                      <Link
                        href={`/dashboard/results/submit/${fixture.id}`}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-center text-sm text-white shadow-lg transition hover:from-green-500 hover:to-emerald-500"
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
                      onClick={() => downloadCalendar(fixture.id)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/20 px-4 py-1.5 text-sm text-blue-400 transition hover:bg-blue-500/30"
                    >
                      <Download size={14} />
                      <FileText size={14} />
                      Add to Calendar (.ics)
                    </button>
                  </div>
                )}

                {calendarSyncEnabled && isActionable && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">
                      📅 Calendar sync enabled
                    </span>
                  </div>
                )}

                {/* Match Center Link */}
                {!isActionable && (
                  <div className="mt-3 border-t border-white/10 pt-3 text-center">
                    <Link
                      href={`/matches/${fixture.id}`}
                      className="inline-flex items-center gap-1 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      View Match Center <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Time Suggestion Modal */}
        <AnimatePresence>
          {showTimeModal && (
            <TimeSuggestionModal
              fixture={myFixtures.find((f: Fixture) => f.id === showTimeModal)!}
              onClose={() => setShowTimeModal(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}