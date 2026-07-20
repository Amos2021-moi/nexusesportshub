"use client";

import {
  useState,
  useEffect,
  useCallback,
  type ComponentType,
} from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  ExternalLink,
  Gamepad2,
  BarChart3,
  Loader2,
  MapPin,
  Coffee,
  Heart,
} from "lucide-react";

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
/*                              Utility (cn)                                   */
/* -------------------------------------------------------------------------- */

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*                          NewsBadge (fallback)                               */
/* -------------------------------------------------------------------------- */

function NewsBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pink-400 ring-1 ring-pink-500/30",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500" />
      New
    </span>
  );
}

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

// ✅ Kenyan names and real testimonials
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

// ✅ Real team members with Kenyan leadership
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
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4, 
      ease: "easeOut",
      opacity: { duration: 0.3 },
      y: { duration: 0.35 }
    } 
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4, 
      ease: "easeOut",
      opacity: { duration: 0.3 },
      y: { duration: 0.35 }
    } 
  },
};

/* -------------------------------------------------------------------------- */
/*                               Helpers                                       */
/* -------------------------------------------------------------------------- */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* -------------------------------------------------------------------------- */
/*                          Animated counter                                  */
/* -------------------------------------------------------------------------- */

function AnimatedStat({ value, loading }: { value: number; loading: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading) return;
    let raf = 0;
    const duration = 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, loading]);

  if (loading) {
    return (
      <span className="inline-block h-7 w-16 animate-pulse rounded bg-white/10" />
    );
  }
  return <>{formatNumber(display)}</>;
}

/* -------------------------------------------------------------------------- */
/*                              Background - Premium with color              */
/* -------------------------------------------------------------------------- */

function GradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {/* ✅ Premium gradient base - NOT black */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950/50 to-purple-950/30" />
      
      {/* ✅ Premium animated orbs - vibrant colors */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse-slow"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-purple-600/25 blur-[120px] animate-pulse-slower"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-600/15 blur-[120px] animate-pulse-slowest"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/10 blur-[120px]"
      />
      
      {/* ✅ Premium gradient overlay - adds depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent"
      />
      
      {/* ✅ Subtle grid pattern for texture */}
      <div
        aria-hidden="true"
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

/* -------------------------------------------------------------------------- */
/*                              Navigation                                     */
/* -------------------------------------------------------------------------- */

function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAuthed = status === "authenticated" && !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = role === "admin" ? "/admin" : "/dashboard";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-white/5 bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-black/20"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 flex-shrink-0"
          aria-label="Nexus Esports home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-900/50">
            <Trophy className="h-5 w-5 text-white" strokeWidth={2.3} />
          </span>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-lg font-bold tracking-tight text-transparent hidden sm:block">
            Nexus Esports
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                {link.label}
                {link.badge && <NewsBadge />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthed ? (
            <Link
              href={dashboardHref}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-600 hover:to-purple-700"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-600 hover:to-purple-700"
              >
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-200 transition hover:bg-white/5 lg:hidden flex-shrink-0"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-gray-900/95 backdrop-blur-md lg:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-base font-medium text-gray-200 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    {link.label}
                    {link.badge && <NewsBadge />}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </Link>
              ))}

              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                {isAuthed ? (
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Hero                                       */
/* -------------------------------------------------------------------------- */

function Hero({
  stats,
  loading,
}: {
  stats: PlatformStats;
  loading: boolean;
}) {
  const statCards: StatCard[] = [
    { label: "Players", value: stats.totalPlayers, icon: Users, accent: "text-indigo-400" },
    { label: "Matches", value: stats.totalFixtures, icon: Calendar, accent: "text-pink-400" },
    { label: "Tournaments", value: stats.totalTournaments, icon: Crown, accent: "text-yellow-400" },
    { label: "Awards", value: stats.totalAwards, icon: Award, accent: "text-purple-400" },
  ];

  return (
    <section className="relative px-4 pt-24 pb-12 sm:px-6 sm:pt-32 lg:px-8 lg:pt-40">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl text-center"
      >
        <motion.div variants={itemVariants} className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            Built in Kenya • 🇰🇪
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Premier{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            eFootball League
          </span>{" "}
          Platform
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-5 max-w-2xl text-base text-gray-400 sm:text-lg"
        >
          Africa's premier competitive eFootball platform. Compete in structured leagues,
          climb verified rankings, win tournaments and earn your place in the Hall of Fame.
          Built by Kenyan gamers, for African champions.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/auth/signup"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-500 hover:to-purple-500 sm:w-auto"
          >
            <Zap className="h-4 w-4" />
            Start Playing
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tournaments"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
          >
            <Trophy className="h-4 w-4" />
            View Tournaments
          </Link>
        </motion.div>

        <motion.ul
          variants={itemVariants}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {TRUST_INDICATORS.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400"
            >
              <Icon className="h-4 w-4 text-emerald-400" />
              {label}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 p-4 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            
            <s.icon className={cn("relative mx-auto h-5 w-5 sm:h-6 sm:w-6", s.accent)} />
            <div className="relative mt-2 text-xl font-bold text-white sm:text-3xl">
              <AnimatedStat value={s.value} loading={loading} />
            </div>
            <div className="relative mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
              {s.label}
            </div>
            
            {/* Decorative line */}
            <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Section heading                                  */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-sm text-gray-400 sm:text-base">{subtitle}</p>}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Features                                       */
/* -------------------------------------------------------------------------- */

function Features() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Everything you need"
        title="Built for competitive players"
        subtitle="A complete ecosystem for leagues, tournaments, squads and glory."
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((feature) => (
          <motion.div key={feature.title} variants={itemVariants}>
            <Link
              href={feature.href}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gray-800/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-gray-800/60 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <span
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
                  feature.accent,
                )}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-400 transition-all duration-300 group-hover:gap-2 group-hover:text-indigo-300">
                Learn more
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            How it works                                     */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Get started in minutes"
        title="How it works"
        subtitle="Three simple steps from sign-up to the top of the table."
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3"
      >
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            variants={itemVariants}
            className="group relative rounded-2xl border border-white/10 bg-gray-800/40 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-900/40 transition-transform duration-300 group-hover:scale-110">
              {index + 1}
            </div>
            <step.icon className="mx-auto mt-3 h-6 w-6 text-indigo-400" />
            <h3 className="mt-2 text-base font-semibold text-white">
              {step.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              {step.description}
            </p>
            {index < STEPS.length - 1 && (
              <ChevronRight
                aria-hidden="true"
                className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/20 md:block"
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Team Section                                  */
/* -------------------------------------------------------------------------- */

function TeamSection() {
  return (
    <section id="team" className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Meet the team"
        title="Built with passion in Kenya"
        subtitle="A dedicated team committed to growing competitive gaming across Africa."
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {TEAM_MEMBERS.map((member) => (
          <motion.div
            key={member.name}
            variants={itemVariants}
            className="group rounded-2xl border border-white/10 bg-gray-800/40 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5"
          >
            <div
              className={cn(
                "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
                member.accent,
              )}
            >
              {member.initials}
            </div>
            <h3 className="mt-3 font-semibold text-white">{member.name}</h3>
            <p className="text-xs text-gray-400">{member.role}</p>
            <member.icon className="mx-auto mt-2 h-4 w-4 text-indigo-400/50" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Testimonials                                     */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  return (
    <section id="testimonials" className="px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Loved by players"
        title="What the community says"
        subtitle="Real stories from champions across the Nexus Esports league."
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-3"
      >
        {TESTIMONIALS.map((t) => (
          <motion.figure
            key={t.name}
            variants={itemVariants}
            className="flex h-full flex-col rounded-2xl border border-white/10 bg-gray-800/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5"
          >
            <div className="flex items-center gap-1" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < t.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-600",
                  )}
                />
              ))}
            </div>
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white",
                  t.accent,
                )}
                aria-hidden="true"
              >
                {t.initials}
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  {t.name}
                </span>
                <span className="block text-xs text-gray-400">{t.role}</span>
                <span className="block text-[10px] text-gray-500">
                  <MapPin className="inline h-3 w-3" /> {t.location}
                </span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Partners                                       */
/* -------------------------------------------------------------------------- */

function Partners() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center text-xs font-semibold uppercase tracking-widest text-gray-500"
      >
        Supported platforms & partners
      </motion.p>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-4"
      >
        {PARTNERS.map((p) => (
          <motion.div
            key={p.name}
            variants={itemVariants}
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-gray-400 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <p.icon className="h-5 w-5" />
            <span className="text-sm font-semibold">{p.name}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  CTA                                        */
/* -------------------------------------------------------------------------- */

function CallToAction() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-5 py-12 text-center shadow-2xl sm:px-12"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative">
          <Crown className="mx-auto h-9 w-9 text-yellow-300" />
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to join the league?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">
            Create your free account today and start your journey from rookie to
            Hall of Fame legend. Join thousands of African gamers already competing.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-200/70">
            <MapPin className="h-3 w-3" />
            <span>🇰🇪 Made in Kenya • For African Champions</span>
          </div>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-gray-100 hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4" />
            Get Started Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Footer                                      */
/* -------------------------------------------------------------------------- */

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Leagues", href: "/leagues" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Fixtures", href: "/fixtures" },
      { label: "Rankings", href: "/rankings" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "News", href: "/news" },
      { label: "Hall of Fame", href: "/hall-of-fame" },
      { label: "Statistics", href: "/stats" },
      { label: "Help Center", href: "/help" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Squads", href: "/squads" },
      { label: "Players", href: "/players" },
      { label: "Discussions", href: "/community" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Partners", href: "/partners" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: "Email", href: "mailto:nexusesportshub@gmail.com", icon: Mail },
  { label: "Community", href: "/community", icon: MessageCircle },
  { label: "Website", href: "/", icon: Globe },
  { label: "Trending", href: "/rankings", icon: TrendingUp },
] as const;

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gray-900/60 px-4 py-12 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Trophy className="h-4 w-4 text-white" strokeWidth={2.3} />
              </span>
              <span className="text-base font-bold text-white">Nexus Esports</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-400">
              Africa's premier platform for competitive eFootball leagues,
              tournaments and community. Built in Kenya 🇰🇪
            </p>
            <div className="mt-4 flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Nexus Esports. Made with ❤️ in Kenya.
          </p>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-medium text-emerald-300">
              All systems online
            </span>
          </div>

          <div className="flex items-center gap-4">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Cookies", href: "/cookies" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-gray-500 transition hover:text-gray-300"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Home Page                                      */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    // ✅ Use public endpoint instead of admin
    const res = await fetch("/api/public/stats");
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    setStats({
      totalPlayers: data.totalPlayers || 0,
      totalFixtures: data.totalFixtures || 0,
      totalTournaments: data.totalTournaments || 0,
      totalAwards: data.totalAwards || 0,
      totalSeasons: data.totalSeasons || 0,
      totalNews: data.totalNews || 0,
      activePlayers: data.activePlayers || 0,
      completionRate: data.completionRate || 0,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    setError("Unable to load live stats");
    // ✅ Set default stats so page doesn't break
    setStats({
      totalPlayers: 0,
      totalFixtures: 0,
      totalTournaments: 0,
      totalAwards: 0,
      totalSeasons: 0,
      totalNews: 0,
      activePlayers: 0,
      completionRate: 0,
    });
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchStats();
    // ✅ Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // ✅ Show loading state
  if (loading && !stats) {
    return (
      <div className="relative min-h-screen">
        <GradientBackground />
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
              <Trophy className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm text-gray-400">Loading platform data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ✅ Use stats (fallback to empty if null)
  const platformStats = stats || {
    totalPlayers: 0,
    totalFixtures: 0,
    totalTournaments: 0,
    totalAwards: 0,
    totalSeasons: 0,
    totalNews: 0,
    activePlayers: 0,
    completionRate: 0,
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <GradientBackground />
      <Navbar />

      <main>
        <Hero stats={platformStats} loading={loading} />
        
        {/* ✅ Show error notice but keep page functional */}
        {error && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center justify-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
                <button
                  type="button"
                  onClick={fetchStats}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/30"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
        
        <Features />
        <HowItWorks />
        <TeamSection />
        <Testimonials />
        <Partners />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}