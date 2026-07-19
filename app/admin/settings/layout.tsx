"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Trophy,
  Server,
  Shield,
  Bell,
  ChevronRight,
  Home,
  HardDrive,
} from "lucide-react";

const tabs = [
  { name: "League", href: "/admin/settings/league", icon: Trophy },
  { name: "System", href: "/admin/settings/system", icon: Server },
  { name: "Moderation", href: "/admin/settings/moderation", icon: Shield },
  { name: "Notifications", href: "/admin/settings/notifications", icon: Bell },
  // ✅ Backup tab
  { name: "Backup", href: "/admin/settings/backup", icon: HardDrive },
];

function DecorBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-[120px]" />
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

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-500/30 border-t-indigo-500" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <DecorBackground />
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <Link
                href="/admin"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10 hover:text-white"
              >
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Admin Settings</span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 sm:h-10 sm:w-10">
                <Settings className="h-5 w-5 text-white" />
              </span>
              Admin Settings
            </h1>
            <p className="mt-1 text-xs text-gray-300 sm:text-sm">
              Control platform behavior and league rules
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-gray-800/40 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sm:px-4 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/30"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}
