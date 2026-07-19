"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  User,
  Shield,
  Calendar,
  Trophy,
  Users,
  Award,
  Newspaper,
  LogOut,
  Menu,
  X,
  MessageCircle,
  TrendingUp,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { useSession } from "next-auth/react"

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "My Squads", href: "/dashboard/squads", icon: Shield },
  { name: "Fixtures", href: "/dashboard/fixtures", icon: Calendar },
  { name: "Standings", href: "/dashboard/standings", icon: Trophy },
  { name: "Statistics", href: "/dashboard/statistics", icon: TrendingUp },
  { name: "Awards", href: "/dashboard/awards", icon: Award },
  { name: "Community", href: "/dashboard/community", icon: MessageCircle },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 text-white shadow-lg lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 transform bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-800 text-white transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-white/10">
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Nexus Esports
              </h1>
              <p className="text-xs text-white/50 mt-0.5">Player Dashboard</p>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session?.user?.name?.charAt(0) || "P"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                <p className="text-xs text-white/50 truncate">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}

            {/* Admin Link - Only show if user is admin */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 rounded-xl px-4 py-3 text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200 mt-4 border-t border-white/10 pt-4"
              >
                <Shield size={20} />
                <span className="text-sm font-medium">Admin Panel</span>
              </Link>
            )}
          </nav>

          {/* Logout button */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}