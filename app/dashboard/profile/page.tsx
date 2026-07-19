"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, useCallback,memo } from "react";
import {
  Camera,
  Edit2,
  Mail,
  Trophy,
  Award,
  Shield,
  TrendingUp,
  Target,
  Activity,
  Phone,
  Star,
  Gamepad2,
  Crown,
  User as UserIcon,
  Sparkles,
  Zap,
  Medal,
  CheckCircle,
  BarChart3,
  Calendar,
  Users,
  Flame,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import TrustBadge from "@/components/ui/TrustBadge";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProfileData {
  username: string;
  class: string;
  bio: string;
  favoriteClub: string;
  preferredFormation: string;
  preferredPlaystyle: string;
  profilePicture: string;
  bannerImage: string;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalPoints: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  matchesPlayed: number;
  winRate: number;
  whatsappNumber: string;
  whatsappVisible: boolean;
  verifiedBadge: boolean;
  trustScore: number;
  isVerified: boolean;
  name: string;
  email: string;
}

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatCard = memo(({ stat }: { stat: any }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="will-change-transform"
    >
      <div className={`rounded-2xl border border-white/10 ${stat.bg} p-4 text-center backdrop-blur-xl`}>
        <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900/40 ring-1 ${stat.ring}`}>
          <Icon className={`h-5 w-5 ${stat.tint}`} />
        </div>
        <p className={`text-2xl font-bold ${stat.tint}`}>{stat.value}</p>
        <p className="mt-1 text-xs text-gray-400">{stat.label}</p>
      </div>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

const DetailStat = memo(({ stat }: { stat: any }) => (
  <motion.div
    variants={itemVariants}
    className={`rounded-xl border ${stat.border} ${stat.bg} p-3 text-center backdrop-blur-sm`}
  >
    <p className="text-xs text-gray-500">{stat.label}</p>
    <p className={`text-lg font-bold ${stat.tint}`}>{stat.value}</p>
  </motion.div>
));

DetailStat.displayName = "DetailStat";

const DetailChip = memo(({ chip }: { chip: any }) => {
  const Icon = chip.icon;
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition hover:border-white/20"
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${chip.accent}`} />
        <p className="text-xs text-gray-500">{chip.label}</p>
      </div>
      <p className={`mt-1 text-sm font-semibold ${chip.accent}`}>{chip.value}</p>
    </motion.div>
  );
});

DetailChip.displayName = "DetailChip";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trustScore, setTrustScore] = useState<number>(0);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      const matchesPlayed =
        (data.totalWins || 0) +
        (data.totalDraws || 0) +
        (data.totalLosses || 0);
      const winRate =
        matchesPlayed > 0
          ? Math.round(((data.totalWins || 0) / matchesPlayed) * 100)
          : 0;
      const goalDifference = (data.goalsFor || 0) - (data.goalsAgainst || 0);

      setProfile({
        ...data,
        matchesPlayed,
        winRate,
        goalDifference,
        trustScore: data.trustScore || 0,
        isVerified: data.isVerified || false,
        verifiedBadge: data.verifiedBadge || false,
      });

      if (session?.user?.id) {
        const trustRes = await fetch(
          `/api/admin/trust-score?userId=${session.user.id}`,
        );
        if (trustRes.ok) {
          const trustData = await trustRes.json();
          setTrustScore(trustData.trustScore || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const displayTrustScore = profile?.trustScore || trustScore || 0;
  const isVerified = profile?.isVerified || profile?.verifiedBadge || false;

  const trustColor =
    displayTrustScore >= 80
      ? "text-emerald-400"
      : displayTrustScore >= 50
        ? "text-yellow-400"
        : "text-white";

  const trustGradient =
    displayTrustScore >= 80
      ? "from-emerald-500 to-green-500"
      : displayTrustScore >= 50
        ? "from-yellow-500 to-amber-500"
        : "from-indigo-500 to-purple-500";

  const primaryStats = useMemo(() => [
    {
      label: "Matches",
      value: profile?.matchesPlayed || 0,
      icon: Activity,
      tint: "text-blue-400",
      ring: "ring-blue-500/30",
      bg: "bg-blue-500/10",
    },
    {
      label: "Wins",
      value: profile?.totalWins || 0,
      icon: Trophy,
      tint: "text-green-400",
      ring: "ring-green-500/30",
      bg: "bg-green-500/10",
    },
    {
      label: "Win Rate",
      value: `${profile?.winRate || 0}%`,
      icon: Target,
      tint: "text-yellow-400",
      ring: "ring-yellow-500/30",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Points",
      value: profile?.totalPoints || 0,
      icon: Award,
      tint: "text-purple-400",
      ring: "ring-purple-500/30",
      bg: "bg-purple-500/10",
    },
  ], [profile]);

  const detailStats = useMemo(() => [
    { label: "Wins", value: profile?.totalWins || 0, tint: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Draws", value: profile?.totalDraws || 0, tint: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Losses", value: profile?.totalLosses || 0, tint: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    { label: "Goals For", value: profile?.goalsFor || 0, tint: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Goals Against", value: profile?.goalsAgainst || 0, tint: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  ], [profile]);

  const detailChips = useMemo(() => [
    { label: "Class", value: profile?.class || "Not set", icon: Shield, accent: "text-indigo-400" },
    { label: "Favorite Club", value: profile?.favoriteClub || "Not set", icon: Crown, accent: "text-yellow-400" },
    { label: "Formation", value: profile?.preferredFormation || "Not set", icon: Gamepad2, accent: "text-pink-400" },
    { label: "Playstyle", value: profile?.preferredPlaystyle || "Not set", icon: Activity, accent: "text-cyan-400" },
    { label: "Total Points", value: profile?.totalPoints || 0, icon: Award, accent: "text-purple-400" },
  ], [profile]);

  const goalDiff = profile?.goalDifference || 0;

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <UserIcon className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading profile...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Fetching your stats</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Banner Section */}
        <motion.div
          variants={itemVariants}
          className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 sm:h-56"
        >
          {profile?.bannerImage && (
            <Image
              src={profile.bannerImage || "/default-banner.jpg"}
              alt="Banner"
              width={1200}
              height={300}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/10 to-transparent" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <Link
            href="/dashboard/profile/edit"
            aria-label="Change banner image"
            className="absolute bottom-4 right-4 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <Camera size={20} />
          </Link>
        </motion.div>

        {/* Profile Picture */}
        <motion.div
          variants={itemVariants}
          className="relative mx-6 -mt-16 flex items-end justify-between"
        >
          <div className="group relative">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-900 bg-gray-700 shadow-xl shadow-black/40">
              {profile?.profilePicture ? (
                <Image
                  src={profile.profilePicture || "/default-avatar.png"}
                  alt={profile.username || "Profile"}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-3xl font-bold text-white">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={22} className="text-white" />
            </div>
            <Link
              href="/dashboard/profile/edit"
              aria-label="Change profile picture"
              className="absolute bottom-0 right-0 inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 text-white shadow-lg transition hover:from-indigo-500 hover:to-purple-500"
            >
              <Camera size={14} />
            </Link>
          </div>
        </motion.div>

        {/* Profile Info */}
        <div className="mt-6 px-6">
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {profile?.username}
                </h1>
                {isVerified && <TrustBadge type="verified" />}
                {displayTrustScore >= 80 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 ring-1 ring-emerald-500/30">
                    <Star size={12} />
                    <span>High Trust</span>
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Mail size={14} className="text-gray-500" />
                <p className="text-sm text-gray-400">{profile?.email || session?.user?.email}</p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" />
                <p className="text-sm text-gray-400">
                  Trust Score: <span className={`font-semibold ${trustColor}`}>{displayTrustScore}/100</span>
                </p>
              </div>
              {profile?.whatsappNumber && profile?.whatsappVisible && (
                <div className="mt-1 flex items-center gap-2">
                  <Phone size={14} className="text-green-500" />
                  <p className="text-sm text-gray-400">WhatsApp available for match coordination</p>
                </div>
              )}
            </div>
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-purple-500"
            >
              <Edit2 size={16} />
              Edit Profile
            </Link>
          </motion.div>

          {/* Trust Score Progress Bar */}
          <motion.div variants={itemVariants} className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(displayTrustScore, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full bg-gradient-to-r ${trustGradient}`}
              />
            </div>
          </motion.div>

          {/* Bio */}
          {profile?.bio && (
            <motion.div
              variants={itemVariants}
              className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            >
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <UserIcon size={13} />
                About
              </div>
              <p className="text-gray-300">{profile.bio}</p>
            </motion.div>
          )}

          {/* Player Details */}
          <motion.div variants={containerVariants} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {detailChips.map((chip) => (
              <DetailChip key={chip.label} chip={chip} />
            ))}
          </motion.div>

          {/* Statistics Section */}
          <div className="mt-8">
            <motion.h2
              variants={itemVariants}
              className="mb-4 flex items-center gap-2 text-xl font-bold text-white"
            >
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              Player Statistics
            </motion.h2>

            {/* Primary Stats */}
            <motion.div variants={containerVariants} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {primaryStats.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))}
            </motion.div>

            {/* Detailed Stats */}
            <motion.div variants={containerVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {detailStats.map((stat) => (
                <DetailStat key={stat.label} stat={stat} />
              ))}
              <motion.div
                variants={itemVariants}
                className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-center backdrop-blur-sm"
              >
                <p className="text-xs text-gray-500">Goal Diff</p>
                <p className={`text-lg font-bold ${goalDiff >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {goalDiff >= 0 ? `+${goalDiff}` : goalDiff}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}