"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Target,
  ArrowLeft,
  RefreshCw,
  Info,
  Sparkles,
  ChevronRight,
  BarChart3,
  Loader2,
  Shield,
  Zap,
  Flame,
  Gift,
  Wallet,
  Coins,
} from "lucide-react";
import PrizeDisplay from "@/components/competition/PrizeDisplay";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

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
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-yellow-500/20 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
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
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                               */
/* -------------------------------------------------------------------------- */

// === STATIC Info Card ===
const InfoCard = memo(({ icon: Icon, title, items, iconColor }: {
  icon: any;
  title: string;
  items: string[];
  iconColor: string;
}) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors duration-150 hover:border-indigo-500/30">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
    <ul className="space-y-2 text-sm text-gray-400">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-green-400">✓</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
));

InfoCard.displayName = "InfoCard";

// === STATIC Quick Link ===
const QuickLink = memo(({ icon: Icon, title, subtitle, href, color }: {
  icon: any;
  title: string;
  subtitle: string;
  href: string;
  color: string;
}) => {
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:bg-white/10 group-hover:scale-110";

  return (
    <Link
      href={href}
      className={`bg-white/5 rounded-xl p-3 border border-white/10 transition-colors duration-150 text-center ${isMobile ? "" : "hover:bg-white/10"}`}
    >
      <Icon className={`h-5 w-5 ${color} mx-auto mb-1 transition-transform duration-150 ${hoverClass}`} />
      <p className="text-xs font-medium text-white">{title}</p>
      <p className="text-[10px] text-gray-500">{subtitle}</p>
    </Link>
  );
});

QuickLink.displayName = "QuickLink";

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function PrizePage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [seasonName, setSeasonName] = useState("");

  const fetchSeasonInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to fetch season");
      const data = await res.json();
      const activeSeason = data.find((s: any) => s.isActive);
      if (activeSeason) {
        setSeasonName(activeSeason.name);
      }
    } catch (error) {
      console.error("Error fetching season:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonInfo();
  }, [fetchSeasonInfo]);

  const infoItems = [
    "Every player contributes to the prize pool",
    "Top 3 players win cash prizes",
    "Top scorer wins a bonus prize",
    "Higher rank = bigger reward",
  ];

  const tipItems = [
    "Win more matches to climb the rankings",
    "Score goals to win the top scorer bonus",
    "Stay consistent with your performance",
    "Focus on both winning and scoring",
  ];

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex items-center justify-center h-64 px-4">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
              <Trophy className="absolute inset-0 m-auto h-6 w-6 text-yellow-400" />
            </div>
            <p className="mt-2 font-medium text-gray-400">Loading prize pool...</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Calculating rewards</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header - NO animations */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
              <Trophy className="h-7 w-7 text-yellow-400" />
              🏆 Prize Pool
            </h1>
            <p className="text-gray-400 text-sm">
              {seasonName || "Current Season"} • See what you're playing for
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-700/50 px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-gray-600/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Info Banner - NO animations */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 flex items-start gap-3 backdrop-blur-xl">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-400 font-medium">How Prize Pool Works</p>
            <p className="text-xs text-gray-400">
              The prize pool is calculated from entry fees paid by all registered players.
              The higher you finish, the bigger your reward!
            </p>
          </div>
        </div>

        {/* Prize Display - NO animations */}
        <PrizeDisplay compact={false} showDetails={true} />

        {/* Additional Info - NO animations */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            icon={BarChart3}
            title="Why This Matters"
            items={infoItems}
            iconColor="text-indigo-400"
          />
          <InfoCard
            icon={Sparkles}
            title="Tips to Win"
            items={tipItems}
            iconColor="text-yellow-400"
          />
        </div>

        {/* Quick Links - NO animations */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <QuickLink
            icon={TrendingUp}
            title="View Standings"
            subtitle="See your current rank"
            href="/dashboard/standings"
            color="text-blue-400"
          />
          <QuickLink
            icon={Trophy}
            title="My Fixtures"
            subtitle="Upcoming matches"
            href="/dashboard/fixtures"
            color="text-yellow-400"
          />
          <QuickLink
            icon={BarChart3}
            title="Statistics"
            subtitle="Your performance"
            href="/dashboard/statistics"
            color="text-green-400"
          />
        </div>
      </div>
    </>
  );
}