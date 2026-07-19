"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Bell,
  Shield,
  Palette,
  Trophy,
  Settings as SettingsIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { name: "Account", href: "/dashboard/settings/account", icon: User },
  { name: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
  { name: "Privacy", href: "/dashboard/settings/privacy", icon: Shield },
  { name: "Appearance", href: "/dashboard/settings/appearance", icon: Palette },
  { name: "Competition", href: "/dashboard/settings/competition", icon: Trophy },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const activeTab = tabs.find((tab) => pathname === tab.href);

  return (
    <div className="relative">
      {/* Decorative background (shared across the whole settings cluster) */}
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

      <div className="mx-auto max-w-5xl space-y-5 px-4 pt-5 sm:space-y-6 sm:pt-8">
        {/* Breadcrumb + Header */}
        <div>
          <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-gray-400">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 rounded-lg px-1.5 py-1 transition-colors hover:text-white"
            >
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-300">Settings</span>
            {activeTab && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-white">
                  {activeTab.name}
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12">
              <SettingsIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white sm:text-3xl">
                Settings
              </h1>
              <p className="mt-1 truncate text-sm text-gray-400 sm:text-base">
                Manage your account, preferences, and privacy
              </p>
            </div>
          </div>
        </div>

        {/* Tabs — glass nav with sliding active indicator */}
        <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`relative flex min-h-[44px] flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors sm:flex-1 lg:flex-none ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="settings-active-tab"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 ring-1 ring-indigo-500/40"
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? "text-indigo-300" : ""
                      }`}
                    />
                    {tab.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
}
