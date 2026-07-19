"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  User,
  Shield,
  Calendar,
  Trophy,
  Users,
  Award,
  CheckCircle,
  Newspaper,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  TrendingUp,
  MessageCircle,
  Settings,
  FileText,
  Sparkles,
  Crown,
  Zap,
  Home,
  BarChart3,
  Bell,
  Search,
  CreditCard,
  Gift,
  Brain,
  Star,
  Flame,
} from "lucide-react";
import SearchBar from "@/components/admin/SearchBar";
import SmartNotificationBell from "@/components/ui/SmartNotificationBell";

const playerMenu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "Profile", href: "/dashboard/profile", icon: User, color: "text-blue-400", bg: "bg-blue-500/10" },
  { name: "My Squads", href: "/dashboard/squads", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "Players", href: "/players", icon: Users, color: "text-green-400", bg: "bg-green-500/10" },
  { name: "Fixtures", href: "/dashboard/fixtures", icon: Calendar, color: "text-green-400", bg: "bg-green-500/10" },
  { name: "Standings", href: "/dashboard/standings", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { name: "Prize Pool", href: "/dashboard/prize", icon: Gift, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { name: "Statistics", href: "/dashboard/statistics", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
  { name: "Awards", href: "/dashboard/awards", icon: Award, color: "text-orange-400", bg: "bg-orange-500/10" },
  { name: "Community", href: "/dashboard/community", icon: MessageCircle, color: "text-pink-400", bg: "bg-pink-500/10" },
  { name: "Tournaments", href: "/tournaments", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10" },
  { name: "Settings", href: "/dashboard/settings/account", icon: Settings, color: "text-gray-400", bg: "bg-gray-500/10" },
];

const adminMenu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "Competition", href: "/admin/competition", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { name: "Payment Analytics", href: "/admin/payments", icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "Players", href: "/players", icon: Users, color: "text-green-400", bg: "bg-green-500/10" },
  { name: "Seasons", href: "/admin/seasons", icon: Calendar, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { name: "League", href: "/admin/league", icon: Trophy, color: "text-green-400", bg: "bg-green-500/10" },
  { name: "Results", href: "/admin/results", icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-500/10" },
  { name: "Tournaments", href: "/admin/tournaments", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10" },
  { name: "News", href: "/admin/news", icon: Newspaper, color: "text-pink-400", bg: "bg-pink-500/10" },
  { name: "Awards", href: "/admin/awards", icon: Award, color: "text-orange-400", bg: "bg-orange-500/10" },
  { name: "Analytics", href: "/admin/analytics", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { name: "Audit Logs", href: "/admin/audit", icon: FileText, color: "text-red-400", bg: "bg-red-500/10" },
  { name: "Admin Management", href: "/admin/admins", icon: Shield, color: "text-slate-400", bg: "bg-slate-500/10" },
  { name: "Communication", href: "/admin/communication", icon: MessageCircle, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "Settings", href: "/admin/settings/league", icon: Settings, color: "text-gray-400", bg: "bg-gray-500/10" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [appearanceSettings, setAppearanceSettings] = useState({
    sidebarStyle: "default" as "default" | "compact" | "icon",
    compactMode: false,
  });

  useEffect(() => {
    setIsClient(true);

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    loadAppearanceSettings();
  }, []);

  const loadAppearanceSettings = () => {
    const savedAppearance = localStorage.getItem("appearance");
    if (savedAppearance) {
      try {
        const parsed = JSON.parse(savedAppearance);
        setAppearanceSettings({
          sidebarStyle: parsed.sidebarStyle || "default",
          compactMode: parsed.compactMode || false,
        });
        return;
      } catch (e) {}
    }

    fetch("/api/settings?category=appearance")
      .then((res) => res.json())
      .then((data) => {
        setAppearanceSettings({
          sidebarStyle: data.sidebarStyle || "default",
          compactMode: data.compactMode || false,
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!isClient || status === "loading") {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <Shield className="absolute inset-0 m-auto h-7 w-7 text-indigo-400" />
          </div>
          <p className="mt-2 font-medium text-gray-400">Loading...</p>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
            <Sparkles className="h-3 w-3 text-yellow-400" />
            <span>Preparing your dashboard</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user?.role || "PLAYER";
  const isAdmin = userRole === "ADMIN";
  const menuItems = isAdmin ? adminMenu : playerMenu;
  const dashboardName = isAdmin ? "Admin Panel" : "Player Dashboard";

  const isIconOnly = appearanceSettings.sidebarStyle === "icon";

  const getSidebarWidth = () => {
    switch (appearanceSettings.sidebarStyle) {
      case "icon":
        return "w-20";
      case "compact":
        return "w-56";
      default:
        return "w-80";
    }
  };

  const getMainMargin = () => {
    switch (appearanceSettings.sidebarStyle) {
      case "icon":
        return "lg:ml-20";
      case "compact":
        return "lg:ml-56";
      default:
        return "lg:ml-80";
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard" || href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div
      className={`min-h-screen min-h-[100dvh] ${
        appearanceSettings.compactMode ? "compact-mode" : ""
      }`}
      style={{
        position: "relative",
        zIndex: 0,
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* ✅ Premium Background - Elegant gradient with subtle orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/60" />
        
        {/* Premium glow orbs - very subtle */}
        <div className="absolute -top-1/2 -right-1/2 h-[800px] w-[800px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 h-[800px] w-[800px] rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/3 blur-3xl" />
        
        {/* Subtle grid pattern for texture */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen max-w-[85vw] ${getSidebarWidth()} transform flex-col border-r border-white/5 bg-gray-900/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out lg:max-w-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Decorative orb behind brand */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/10 blur-[80px]" />

        {/* Brand */}
        <div className="relative flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10" />
          <div className="relative flex h-24 items-center justify-center border-b border-white/5 px-4">
            <div className={`flex items-center gap-2.5 ${isIconOnly ? "flex-col" : ""}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Shield className="h-6 w-6 text-white" />
              </div>
              {!isIconOnly && (
                <div className="text-left">
                  <h1 className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-lg font-bold leading-tight text-transparent">
                    Nexus Esports
                  </h1>
                  <p className="text-[11px] font-medium tracking-wide text-indigo-300/70">
                    {dashboardName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* User card */}
          {!isIconOnly && (
            <div className="mx-4 mt-5 rounded-2xl border border-white/5 bg-white/5 p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg ring-2 ring-white/5">
                    <span className="text-xl font-bold text-white">
                      {session.user?.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-900 bg-green-500">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/80" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {session.user?.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white shadow-md ${
                    isAdmin
                      ? "bg-gradient-to-r from-red-500 to-pink-500"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500"
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {isAdmin ? "ADMIN" : "PLAYER"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className={`mt-6 ${isIconOnly ? "px-2.5" : "px-4"}`}>
            {!isIconOnly && (
              <p className="mb-3 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <span className="h-px w-4 bg-gray-700" />
                Main Menu
                <span className="h-px flex-1 bg-gray-700" />
              </p>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const active = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    title={isIconOnly ? item.name : undefined}
                    className={`group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      isIconOnly ? "justify-center" : "justify-between"
                    } ${
                      active
                        ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white shadow-sm"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500" />
                    )}
                    <div
                      className={`flex items-center ${
                        isIconOnly ? "space-x-0" : "space-x-3"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
                          active ? "ring-1 ring-white/5" : ""
                        } ${item.bg}`}
                      >
                        <item.icon size={16} className={item.color} />
                      </div>
                      {!isIconOnly && (
                        <span className="text-sm font-medium">{item.name}</span>
                      )}
                    </div>
                    {!isIconOnly && (
                      <ChevronRight
                        size={14}
                        className={`text-gray-500 transition-all ${
                          active
                            ? "translate-x-0 text-indigo-300 opacity-100"
                            : "opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="h-8" />
        </div>

        {/* Logout Button */}
<div className="flex-shrink-0 border-t border-white/5 bg-gray-900/95 p-4">
  <button
    onClick={() => {
      signOut({ callbackUrl: "/", redirect: true });
    }}
    className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-pink-500/10 px-4 py-3 text-gray-400 transition-all duration-300 hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-400 hover:shadow-lg hover:shadow-red-500/10 ${
      isIconOnly ? "flex justify-center px-2" : ""
    }`}
  >
    {/* Premium shimmer background */}
    <span className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-pink-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    
    {/* Border glow */}
    <span className="absolute inset-0 rounded-2xl border border-red-500/0 transition-colors duration-300 group-hover:border-red-500/20" />
    
    {/* Pulse ring on hover */}
    <span className="absolute inset-0 rounded-2xl bg-red-500/0 transition-all duration-500 group-hover:bg-red-500/5" />
    
    <span className="relative flex items-center justify-center gap-3">
      <span className="relative">
        <LogOut size={18} className="transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
        <span className="absolute inset-0 rounded-full bg-red-500/0 blur-xl transition-all duration-300 group-hover:bg-red-500/10" />
      </span>
      
      {!isIconOnly && (
        <>
          <span className="text-sm font-medium transition-all duration-300 group-hover:tracking-wide">
            Sign Out
          </span>
          <span className="absolute right-4 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
            →
          </span>
        </>
      )}
    </span>
  </button>
  
  {!isIconOnly && (
    <p className="mt-2 text-center text-[10px] text-gray-500/50">
      {session.user?.email || "Logged in"}
    </p>
  )}
</div>
      </aside>

      {/* Main */}
      <main className={`${getMainMargin()} min-h-screen min-h-[100dvh] relative z-0`}>
        {/* ✅ Fixed Header - No overlapping */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/20">
          <div className="flex h-16 items-center justify-between px-3 sm:px-6">
            {/* Left Section */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-indigo-500/10 lg:hidden"
              >
                {isSidebarOpen ? (
                  <X size={20} className="rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu size={20} className="transition-transform duration-300" />
                )}
              </button>

              <div className="hidden min-w-0 lg:block">
                <h2 className="truncate text-lg font-semibold text-white">
                  {dashboardName}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-gray-400">
                    Welcome back, {session.user?.name}
                  </p>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                </div>
              </div>
              <div className="min-w-0 lg:hidden">
                <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                  Nexus Hub
                </h2>
                <p className="truncate text-[10px] text-gray-400">
                  {isAdmin ? "Admin Panel" : "Player Dashboard"}
                </p>
              </div>
            </div>

            {/* ✅ Right Section - Fixed layout, no overlapping */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search Bar - Responsive */}
              <div className="hidden sm:block">
                <SearchBar />
              </div>

              {/* Mobile Search Icon */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white sm:hidden"
                aria-label="Search"
              >
                <Search size={16} />
              </button>

              {/* Action Icons - Fixed width, no overlap */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  {isDarkMode ? (
                    <Sun size={16} className="text-yellow-400" />
                  ) : (
                    <Moon size={16} className="text-indigo-300" />
                  )}
                </button>

                {/* Notification Bell */}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 transition-all hover:bg-white/10">
                  <SmartNotificationBell />
                </div>
              </div>

              {/* User Avatar - Desktop only */}
              <div className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <span className="text-xs font-bold text-white">
                  {session.user?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div
          className={
            appearanceSettings.compactMode ? "p-3" : "p-4 sm:p-5 lg:p-6"
          }
        >
          <div
            className={`mx-auto max-w-7xl ${
              appearanceSettings.compactMode ? "space-y-3" : "space-y-5 lg:space-y-6"
            }`}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}