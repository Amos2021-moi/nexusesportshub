"use client";

import {
  useState,
  useEffect,
  useCallback,
  type ComponentType,
  memo,
} from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Calendar,
  Users,
  Award,
  Shield,
  MessageCircle,
  Crown,
  Sparkles,
  ChevronRight,
  Star,
  Zap,
  TrendingUp,
  Mail,
  ArrowRight,
  CheckCircle,
  Activity,
  Clock,
  Globe,
  Menu,
  X,
  UserPlus,
  LogIn,
  Gamepad2,
  BarChart3,
  MapPin,
} from "lucide-react";
import {
  StatSkeleton,
  HeroSkeleton,
  FeatureSkeleton,
  StepSkeleton,
  TeamSkeleton,
  TestimonialSkeleton,
  PartnerSkeleton,
} from "@/components/ui/HomeSkeleton";

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

interface PlatformStats {
  totalPlayers: number;
  totalFixtures: number;
  totalTournaments: number;
  totalAwards: number;
  totalSeasons: number;
  totalNews: number;
  activePlayers?: number;
  completionRate?: number;
}

interface StatCard {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  suffix?: string;
}

interface Feature {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  accent: string;
}

interface Step {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
  initials: string;
  accent: string;
  location: string;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  accent: string;
  icon: ComponentType<{ className?: string }>;
}

interface Partner {
  name: string;
  icon: ComponentType<{ className?: string }>;
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
/*                              Utility (cn)                                   */
/* -------------------------------------------------------------------------- */

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*                          NewsBadge (fallback)                               */
/* -------------------------------------------------------------------------- */

const NewsBadge = memo(({ className }: { className?: string }) => {
  const isMobile = useIsMobile();
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pink-400 ring-1 ring-pink-500/30",
        className,
      )}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-pink-500 ${isMobile ? "" : "animate-pulse"}`} />
      New
    </span>
  );
});

NewsBadge.displayName = "NewsBadge";

/* -------------------------------------------------------------------------- */
/*                                Static data                                  */
/* -------------------------------------------------------------------------- */

const NAV_LINKS = [
  { label: "News", href: "/news", badge: true },
  { label: "Hall of Fame", href: "/hall-of-fame", badge: false },
  { label: "Tournaments", href: "/tournaments", badge: false },
  { label: "Rankings", href: "/rankings", badge: false },
] as const;

const FEATURES: Feature[] = [
  {
    title: "League System",
    description:
      "Compete in structured seasons with promotions, relegations and live league tables.",
    icon: Trophy,
    href: "/leagues",
    accent: "from-indigo-500 to-purple-500",
  },
  {
    title: "Tournaments",
    description:
      "Single & double elimination brackets with real-time progression and prizes.",
    icon: Crown,
    href: "/tournaments",
    accent: "from-yellow-500 to-amber-500",
  },
  {
    title: "Live Fixtures",
    description:
      "Follow scheduled matches, scores and results as they happen, minute by minute.",
    icon: Calendar,
    href: "/fixtures",
    accent: "from-pink-500 to-rose-500",
  },
  {
    title: "Community",
    description:
      "Connect with players, join discussions and build your eFootball network.",
    icon: MessageCircle,
    href: "/community",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    title: "Squads",
    description:
      "Create or join a squad, manage your roster and dominate team competitions.",
    icon: Users,
    href: "/squads",
    accent: "from-emerald-500 to-green-500",
  },
  {
    title: "Hall of Fame",
    description:
      "Immortalise legendary players and celebrate the greats of every season.",
    icon: Award,
    href: "/hall-of-fame",
    accent: "from-purple-500 to-fuchsia-500",
  },
  {
    title: "Player Profiles",
    description:
      "Showcase your stats, achievements, match history and rise through the ranks.",
    icon: Shield,
    href: "/players",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    title: "Statistics",
    description:
      "Deep analytics on form, win rates and performance trends across seasons.",
    icon: BarChart3,
    href: "/stats",
    accent: "from-orange-500 to-red-500",
  },
];

const STEPS: Step[] = [
  {
    title: "Create Account",
    description:
      "Sign up in seconds, set up your player profile and link your platform.",
    icon: UserPlus,
  },
  {
    title: "Join a League",
    description:
      "Pick a season, join a league or tournament and get matched with rivals.",
    icon: Gamepad2,
  },
  {
    title: "Play & Win",
    description:
      "Compete, climb the rankings, earn awards and make the Hall of Fame.",
    icon: Trophy,
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Kevin Odhiambo",
    role: "Division 1 Champion 2025",
    quote:
      "Nexus Esports has completely transformed competitive gaming in Kenya. The league structure is world-class and the community is incredible.",
    rating: 5,
    initials: "KO",
    accent: "from-indigo-500 to-purple-500",
    location: "Nairobi, Kenya",
  },
  {
    name: "Faith Wanjiru",
    role: "Squad Captain, Nairobi United",
    quote:
      "Managing my squad and tracking everyone's stats in one place changed how we compete. Absolutely love the platform and the vibrant community.",
    rating: 5,
    initials: "FW",
    accent: "from-pink-500 to-rose-500",
    location: "Nakuru, Kenya",
  },
  {
    name: "Michael Otieno",
    role: "Hall of Fame Inductee 2024",
    quote:
      "From my first match to being inducted into the Hall of Fame — the journey was seamless. The platform has given Kenyan gamers a proper stage.",
    rating: 5,
    initials: "MO",
    accent: "from-yellow-500 to-amber-500",
    location: "Kisumu, Kenya",
  },
  {
    name: "Grace Akinyi",
    role: "Tournament Winner x3",
    quote:
      "The tournament system is flawless. I've competed in over 20 tournaments and the experience keeps getting better. Proud to be part of this community.",
    rating: 5,
    initials: "GA",
    accent: "from-emerald-500 to-teal-500",
    location: "Mombasa, Kenya",
  },
  {
    name: "David Kiprop",
    role: "Season 5 MVP",
    quote:
      "Nexus Esports is the best thing that happened to eFootball in East Africa. The competitive scene is thriving and the rewards are amazing.",
    rating: 5,
    initials: "DK",
    accent: "from-orange-500 to-red-500",
    location: "Eldoret, Kenya",
  },
];

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Mark Amos",
    role: "Founder & CEO",
    initials: "MA",
    accent: "from-indigo-600 to-purple-600",
    icon: Crown,
  },
  {
    name: "Kevin Odhiambo",
    role: "Head of Operations",
    initials: "KO",
    accent: "from-emerald-500 to-teal-500",
    icon: Shield,
  },
  {
    name: "Faith Wanjiru",
    role: "Community Lead",
    initials: "FW",
    accent: "from-pink-500 to-rose-500",
    icon: MessageCircle,
  },
  {
    name: "Michael Otieno",
    role: "Technical Director",
    initials: "MO",
    accent: "from-cyan-500 to-blue-500",
    icon: Activity,
  },
];

const PARTNERS: Partner[] = [
  { name: "eFootball", icon: Gamepad2 },
  { name: "PlayStation", icon: Globe },
  { name: "Xbox", icon: Activity },
  { name: "Safaricom", icon: Zap },
];

const TRUST_INDICATORS = [
  { label: "Verified Matches", icon: CheckCircle },
  { label: "Admin Approved", icon: Shield },
  { label: "Live Updates", icon: Activity },
  { label: "Kenyan Built", icon: MapPin },
] as const;

/* -------------------------------------------------------------------------- */
/*                               Helpers                                       */
/* -------------------------------------------------------------------------- */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Background - NO ANIMATIONS               */
/* -------------------------------------------------------------------------- */

const GradientBackground = memo(() => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950/50 to-purple-950/30" />
        <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-600/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950/50 to-purple-950/30" />
      <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-[120px]" />
      <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-purple-600/25 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-600/15 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
});

GradientBackground.displayName = "GradientBackground";

/* -------------------------------------------------------------------------- */
/*                           STATIC Components                                */
/* -------------------------------------------------------------------------- */

// === STATIC Stat Card ===
const StatCard = memo(({ stat, loading }: { stat: StatCard; loading: boolean }) => {
  const Icon = stat.icon;
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/10";
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading) return;
    let raf = 0;
    const duration = 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * stat.value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stat.value, loading]);

  // Show skeleton when loading
  if (loading) {
    return <StatSkeleton />;
  }

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 p-4 text-center backdrop-blur-sm transition-all duration-150 ${hoverClass}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Icon className={cn("relative mx-auto h-5 w-5 sm:h-6 sm:w-6", stat.accent)} />
      <div className="relative mt-2 text-xl font-bold text-white sm:text-3xl">
        {formatNumber(display)}
      </div>
      <div className="relative mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
        {stat.label}
      </div>
      <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4" />
    </div>
  );
});

StatCard.displayName = "StatCard";

// === STATIC Feature Card ===
const FeatureCard = memo(({ feature }: { feature: Feature }) => {
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:-translate-y-1 hover:border-white/20 hover:bg-gray-800/60 hover:shadow-xl hover:shadow-indigo-500/5";

  return (
    <Link
      href={feature.href}
      className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-gray-800/40 p-5 backdrop-blur-sm transition-all duration-150 ${hoverClass}`}
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-150 group-hover:scale-110 group-hover:shadow-xl",
          feature.accent,
        )}
      >
        <feature.icon className="h-5 w-5 text-white" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-white">{feature.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-400">
        {feature.description}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-400 transition-all duration-150 group-hover:gap-2 group-hover:text-indigo-300">
        Learn more
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
});

FeatureCard.displayName = "FeatureCard";

// === STATIC Step Card ===
const StepCard = memo(({ step, index }: { step: Step; index: number }) => {
  const isMobile = useIsMobile();
  const Icon = step.icon;
  const hoverClass = isMobile ? "" : "hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5";

  return (
    <div className={`group relative rounded-2xl border border-white/10 bg-gray-800/40 p-6 text-center backdrop-blur-sm transition-all duration-150 ${hoverClass}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-900/40 transition-transform duration-150 group-hover:scale-110">
        {index + 1}
      </div>
      <Icon className="mx-auto mt-3 h-6 w-6 text-indigo-400" />
      <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-400">{step.description}</p>
      {index < STEPS.length - 1 && (
        <ChevronRight
          aria-hidden="true"
          className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/20 md:block"
        />
      )}
    </div>
  );
});

StepCard.displayName = "StepCard";

// === STATIC Testimonial Card ===
const TestimonialCard = memo(({ testimonial }: { testimonial: Testimonial }) => {
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5";

  return (
    <figure className={`flex h-full flex-col rounded-2xl border border-white/10 bg-gray-800/40 p-5 backdrop-blur-sm transition-all duration-150 ${hoverClass}`}>
      <div className="flex items-center gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < testimonial.rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600",
            )}
          />
        ))}
      </div>
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white",
            testimonial.accent,
          )}
          aria-hidden="true"
        >
          {testimonial.initials}
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">{testimonial.name}</span>
          <span className="block text-xs text-gray-400">{testimonial.role}</span>
          <span className="block text-[10px] text-gray-500">
            <MapPin className="inline h-3 w-3" /> {testimonial.location}
          </span>
        </span>
      </figcaption>
    </figure>
  );
});

TestimonialCard.displayName = "TestimonialCard";

// === STATIC Team Member Card ===
const TeamMemberCard = memo(({ member }: { member: TeamMember }) => {
  const Icon = member.icon;
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5";

  return (
    <div className={`group rounded-2xl border border-white/10 bg-gray-800/40 p-5 text-center backdrop-blur-sm transition-all duration-150 ${hoverClass}`}>
      <div
        className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold text-white shadow-lg transition-all duration-150 group-hover:scale-110 group-hover:shadow-xl",
          member.accent,
        )}
      >
        {member.initials}
      </div>
      <h3 className="mt-3 font-semibold text-white">{member.name}</h3>
      <p className="text-xs text-gray-400">{member.role}</p>
      <Icon className="mx-auto mt-2 h-4 w-4 text-indigo-400/50" />
    </div>
  );
});

TeamMemberCard.displayName = "TeamMemberCard";

// === STATIC Partner Logo ===
const PartnerLogo = memo(({ partner }: { partner: Partner }) => {
  const Icon = partner.icon;
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? "" : "hover:border-white/20 hover:bg-white/10 hover:text-white";

  return (
    <div className={`flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-gray-400 transition-all duration-150 ${hoverClass}`}>
      <Icon className="h-5 w-5" />
      <span className="text-sm font-semibold">{partner.name}</span>
    </div>
  );
});

PartnerLogo.displayName = "PartnerLogo";

// === STATIC Navbar ===
const Navbar = memo(()
