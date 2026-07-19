"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homePlayerId: string | null;
  awayPlayerId: string | null;
  status: string;
  homePlayer: {
    name: string;
    profile: { username: string; profilePicture: string };
  } | null;
  awayPlayer: {
    name: string;
    profile: { username: string; profilePicture: string };
  } | null;
  tournament: { id: string; name: string; type: string };
  scheduledDate: string;
}

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function SubmitTournamentResultPage() {
  const { matchId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string>("");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function fetchMatch() {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/matches/${matchId}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("🔍 Match Data:", data);

      setMatch(data);
      setMatchStatus(data.status);

      // ✅ If match is already pending or completed, redirect
      if (data.status === "PENDING" || data.status === "COMPLETED") {
        toast.error("This match already has a result submitted");
        setRedirecting(true);
        setTimeout(() => {
          router.push(`/tournaments/${data.tournamentId}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      toast.error("Failed to load match data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!homeScore || !awayScore) {
      toast.error("Please enter both scores");
      return;
    }
    if (!evidence) {
      toast.error("Please upload evidence screenshot");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("homeScore", homeScore);
    formData.append("awayScore", awayScore);
    formData.append("evidence", evidence);

    try {
      const res = await fetch(`/api/tournaments/matches/${matchId}/submit`, {
        method: "POST",
        body: formData,
      });

      // ✅ Check if response has content before parsing JSON
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON:", text);
        data = { error: "Server returned invalid response" };
      }

      if (res.ok) {
        toast.success("Result submitted successfully!");
        router.push(`/tournaments/${match?.tournament.id}`);
      } else {
        toast.error((data as any).error || "Failed to submit");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setEvidence(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // ✅ If redirecting, show a message
  if (redirecting) {
    return (
      <div className="relative flex h-64 items-center justify-center">
        <DecorBackground />
        <div className="text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 animate-pulse text-yellow-400" />
          <p className="font-medium text-white">Result already submitted...</p>
          <p className="mt-1 text-sm text-gray-400">Redirecting to tournament</p>
        </div>
      </div>
    );
  }

  // ✅ If match is already pending or completed
  if (matchStatus === "PENDING") {
    return (
      <div className="relative min-h-screen">
        <DecorBackground />
        <div className="mx-auto max-w-2xl p-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-yellow-500/30 bg-gray-800/40 p-8 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/15 ring-1 ring-yellow-500/30">
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Result Already Submitted
            </h2>
            <p className="mb-4 text-gray-400">
              This match already has a result waiting for admin approval.
            </p>
            <Link
              href={`/tournaments/${match?.tournament.id || ""}`}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50"
            >
              Back to Tournament
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (matchStatus === "COMPLETED") {
    return (
      <div className="relative min-h-screen">
        <DecorBackground />
        <div className="mx-auto max-w-2xl p-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-green-500/30 bg-gray-800/40 p-8 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15 ring-1 ring-green-500/30">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">
              Match Completed
            </h2>
            <p className="mb-4 text-gray-400">
              This match has already been completed and approved.
            </p>
            <Link
              href={`/tournaments/${match?.tournament.id || ""}`}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50"
            >
              Back to Tournament
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative flex h-64 items-center justify-center">
        <DecorBackground />
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-12 w-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
          </div>
          <div className="text-gray-400">Loading match...</div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="relative min-h-screen">
        <DecorBackground />
        <div className="py-8 text-center text-gray-400">Match not found</div>
      </div>
    );
  }

  const homeName =
    match.homePlayer?.profile?.username || match.homePlayer?.name || "Home";
  const awayName =
    match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Away";

  return (
    <div className="relative min-h-screen py-6">
      <DecorBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-2xl space-y-6 p-6"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants}>
          <Link
            href={`/tournaments/${match.tournament.id}`}
            className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Tournament
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-amber-500/30">
              <Trophy className="h-5 w-5 text-white" />
            </span>
            <h1 className="text-2xl font-bold text-white">
              Submit Tournament Result
            </h1>
          </div>
          <p className="mb-6 text-sm text-gray-400">
            {match.tournament.name} • Round {match.round} • Match{" "}
            {match.matchNumber}
          </p>

          {/* Match Info */}
          <div className="flex items-center justify-center gap-6 py-6">
            <div className="text-center">
              {match.homePlayer?.profile?.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.homePlayer.profile.profilePicture}
                  alt={homeName}
                  className="mx-auto h-16 w-16 rounded-full border-2 border-indigo-500 object-cover"
                />
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-2xl font-bold text-white ring-2 ring-white/10">
                  {homeName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="mt-2 font-medium text-white">{homeName}</p>
              <span className="mt-1 inline-block rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300 ring-1 ring-indigo-500/30">
                Home
              </span>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  min="0"
                  className="w-20 rounded-xl border border-white/10 bg-gray-900/60 p-3 text-center text-3xl text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <span className="text-xl text-gray-500">vs</span>
                <input
                  type="number"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  min="0"
                  className="w-20 rounded-xl border border-white/10 bg-gray-900/60 p-3 text-center text-3xl text-white transition focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-gray-600">
                Final Score
              </p>
            </div>

            <div className="text-center">
              {match.awayPlayer?.profile?.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={match.awayPlayer.profile.profilePicture}
                  alt={awayName}
                  className="mx-auto h-16 w-16 rounded-full border-2 border-purple-500 object-cover"
                />
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-2xl font-bold text-white ring-2 ring-white/10">
                  {awayName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="mt-2 font-medium text-white">{awayName}</p>
              <span className="mt-1 inline-block rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300 ring-1 ring-purple-500/30">
                Away
              </span>
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Evidence Screenshot <span className="text-red-400">*</span>
            </label>
            <div className="cursor-pointer rounded-xl border-2 border-dashed border-white/15 bg-gray-900/30 p-4 text-center transition-colors hover:border-indigo-500/60">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="evidence-upload"
              />
              <label
                htmlFor="evidence-upload"
                className="block cursor-pointer"
              >
                {preview ? (
                  <div className="relative inline-block">
                    <Image
                      src={preview}
                      alt="Preview"
                      width={400}
                      height={200}
                      className="max-h-48 rounded-lg ring-1 ring-white/10"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEvidence(null);
                        setPreview(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 shadow-lg transition hover:bg-red-600"
                    >
                      <XCircle size={16} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                      <Camera className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-gray-400">Click to upload screenshot</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Helper note */}
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
            <p className="text-xs text-gray-400">
              Submit a clear in-game screenshot showing the final score. Results
              are reviewed and approved by an admin before they go live.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/50 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Submit Result
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* Decorative animated gradient background with blur orbs + grid overlay */
function DecorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-[120px]" />
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
}
