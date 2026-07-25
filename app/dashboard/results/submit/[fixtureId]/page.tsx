"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Camera,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  Trophy,
  Sparkles,
  ChevronRight,
  Zap,
  Medal,
  Crown,
  Users,
  Calendar,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";

interface Fixture {
  id: string;
  homePlayer: {
    id: string;
    name: string;
    email: string;
    profile: { username: string; profilePicture: string } | null;
  };
  awayPlayer: {
    id: string;
    name: string;
    email: string;
    profile: { username: string; profilePicture: string } | null;
  };
  scheduledDate: string;
  status: string;
  submittedBy: string | null;
  submittedAt: string | null;
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

function DecorBackground() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/90" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/90" />
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function SubmitResultPage() {
  const { fixtureId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (fixtureId) {
      fetchFixture();
    }
  }, [fixtureId]);

  async function fetchFixture() {
    try {
      setLoading(true);
      const res = await fetch(`/api/fixtures/${fixtureId}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setFixture(data);

      if (data.status === "PENDING" && data.submittedBy) {
        const submittedBy =
          data.homePlayer?.id === data.submittedBy
            ? data.homePlayer?.name
            : data.awayPlayer?.id === data.submittedBy
              ? data.awayPlayer?.name
              : "Someone";
        setLockedBy(submittedBy || "Someone");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load fixture");
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
      toast.error("Evidence screenshot is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("homeScore", homeScore);
    formData.append("awayScore", awayScore);
    if (evidence) formData.append("evidence", evidence);

    try {
      const res = await fetch(`/api/results/submit/${fixtureId}`, {
        method: "POST",
        body: formData,
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("❌ API returned non-JSON:", text);
        data = { error: "Server error. Please try again." };
      }

      if (res.ok) {
        toast.success("🎯 Result submitted! Waiting for admin approval.");
        router.push("/dashboard/fixtures");
      } else {
        const errorMsg = (data as any).error || "Failed to submit result";
        toast.error(errorMsg);
        setError(errorMsg);

        if ((data as any).locked && (data as any).submittedBy) {
          setLockedBy((data as any).submittedBy);
        }

        await fetchFixture();
      }
    } catch (err) {
      console.error("❌ Submit error:", err);
      toast.error("Network error. Please try again.");
      setError("Network error. Please check your connection and try again.");
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

  function removeImage() {
    setEvidence(null);
    setPreview(null);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
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
  };

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading fixture...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Preparing match details</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error && !fixture) {
    return (
      <>
        <DecorBackground />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
          <div className="rounded-full bg-red-500/10 p-4 ring-1 ring-red-500/30">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400 text-center max-w-md">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
            <button
              onClick={fetchFixture}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!fixture) {
    return (
      <>
        <DecorBackground />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
          <div className="rounded-full bg-gray-500/10 p-4 ring-1 ring-gray-500/30">
            <Trophy className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Fixture Not Found</h2>
          <p className="text-gray-400 text-center max-w-md">
            The fixture you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/dashboard/fixtures")}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
          >
            View All Fixtures
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </>
    );
  }

  const homeName =
    fixture.homePlayer?.profile?.username ||
    fixture.homePlayer?.name ||
    "Home Player";

  const awayName =
    fixture.awayPlayer?.profile?.username ||
    fixture.awayPlayer?.name ||
    "Away Player";

  const isPartOfFixture =
    fixture.homePlayer?.id === session?.user?.id ||
    fixture.awayPlayer?.id === session?.user?.id;

  if (!isPartOfFixture) {
    return (
      <>
        <DecorBackground />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/fixtures"
              className="inline-flex items-center gap-2 text-gray-400 transition-colors duration-150 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Fixtures
            </Link>
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-rose-500/5 p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 ring-1 ring-red-500/30">
              <Shield className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Permission Denied</h2>
            <p className="mt-2 text-gray-400">
              You are not part of this fixture.
            </p>
            <button
              onClick={() => router.push("/dashboard/fixtures")}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              Back to Fixtures
            </button>
          </div>
        </div>
      </>
    );
  }

  if (fixture.status === "PENDING") {
    return (
      <>
        <DecorBackground />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/fixtures"
              className="inline-flex items-center gap-2 text-gray-400 transition-colors duration-150 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Fixtures
            </Link>
          </div>

          <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 ring-1 ring-yellow-500/30">
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Result Already Submitted</h2>
            <p className="mt-2 text-gray-400">
              This fixture already has a result waiting for admin approval.
            </p>
            {lockedBy && (
              <p className="mt-2 text-sm text-gray-500">
                Submitted by: <span className="font-medium text-white">{lockedBy}</span>
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Please wait for the admin to approve the result.
            </p>
            <button
              onClick={() => router.push("/dashboard/fixtures")}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              Back to Fixtures
            </button>
          </div>
        </div>
      </>
    );
  }

  if (fixture.status === "COMPLETED") {
    return (
      <>
        <DecorBackground />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/fixtures"
              className="inline-flex items-center gap-2 text-gray-400 transition-colors duration-150 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Fixtures
            </Link>
          </div>

          <div className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-8 text-center backdrop-blur-xl shadow-2xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 ring-1 ring-green-500/30">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Match Completed</h2>
            <p className="mt-2 text-gray-400">
              This fixture has already been completed and approved.
            </p>
            <button
              onClick={() => router.push("/dashboard/fixtures")}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition-colors duration-150 hover:from-indigo-500 hover:to-purple-500"
            >
              Back to Fixtures
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        {/* Header - NO animations */}
        <div className="mb-6">
          <Link
            href="/dashboard/fixtures"
            className="inline-flex items-center gap-2 text-gray-400 transition-colors duration-150 hover:text-white"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Fixtures</span>
          </Link>
        </div>

        {/* Main Card - NO animations */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Glow Effect */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative">
            {/* Title */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Submit Match Result</h1>
                <p className="text-sm text-gray-400">Report the final score and upload evidence</p>
              </div>
            </div>

            {/* Match Info - NO animations */}
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
              {/* Players */}
              <div className="flex items-center justify-between gap-4">
                {/* Home Player */}
                <div className="flex-1 text-center">
                  <div className="relative mx-auto mb-3 h-20 w-20">
                    {fixture.homePlayer?.profile?.profilePicture ? (
                      <Image
                        src={fixture.homePlayer.profile.profilePicture || "/default-avatar.png"}
                        alt={homeName}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full border-2 border-indigo-500 object-cover shadow-lg shadow-indigo-500/20"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                        {homeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 right-0 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                      Home
                    </div>
                  </div>
                  <p className="font-semibold text-white">{homeName}</p>
                </div>

                {/* VS Badge */}
                <div className="flex-shrink-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-2 ring-white/10">
                    <span className="text-sm font-black tracking-wider text-white/80">VS</span>
                  </div>
                </div>

                {/* Away Player */}
                <div className="flex-1 text-center">
                  <div className="relative mx-auto mb-3 h-20 w-20">
                    {fixture.awayPlayer?.profile?.profilePicture ? (
                      <Image
                        src={fixture.awayPlayer.profile.profilePicture || "/default-avatar.png"}
                        alt={awayName}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full border-2 border-purple-500 object-cover shadow-lg shadow-purple-500/20"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
                        {awayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 right-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-300 ring-1 ring-purple-500/30">
                      Away
                    </div>
                  </div>
                  <p className="font-semibold text-white">{awayName}</p>
                </div>
              </div>

              {/* Match Date */}
              <div className="mt-6 border-t border-white/10 pt-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm text-gray-400 ring-1 ring-white/10">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  {new Date(fixture.scheduledDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    <span className="text-indigo-400">{homeName}</span> Score
                  </label>
                  <input
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    required
                    min="0"
                    className="min-h-[56px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 text-center text-3xl font-bold text-white transition-colors duration-150 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    <span className="text-purple-400">{awayName}</span> Score
                  </label>
                  <input
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    required
                    min="0"
                    className="min-h-[56px] w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 text-center text-3xl font-bold text-white transition-colors duration-150 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Evidence Screenshot <span className="text-red-400">*</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${
                    isDragging
                      ? "border-indigo-500/60 bg-indigo-500/10"
                      : preview
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-white/10 bg-white/5 hover:border-indigo-500/40"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="evidence-upload"
                    required
                  />
                  <label htmlFor="evidence-upload" className="block cursor-pointer p-8 text-center">
                    {preview ? (
                      <div className="relative">
                        <Image
                          src={preview}
                          alt="Preview"
                          width={400}
                          height={200}
                          className="mx-auto max-h-64 rounded-xl object-contain"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 shadow-lg transition-colors duration-150 hover:bg-red-600"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                        <p className="mt-3 text-sm text-green-400">✓ Evidence uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30">
                          <Upload className="h-8 w-8 text-indigo-400" />
                        </div>
                        <p className="text-gray-400">Click to upload or drag & drop</p>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Info Message - NO animations */}
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-400">Evidence Required</p>
                    <p className="mt-1 text-sm text-gray-400">
                      A screenshot of the match result is required for admin approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                    <div>
                      <p className="font-medium text-red-400">Error</p>
                      <p className="mt-1 text-sm text-gray-400">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button - NO animations */}
              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-900/40 transition-all duration-150 hover:shadow-xl hover:shadow-indigo-900/60 disabled:opacity-60"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Submit Result
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}