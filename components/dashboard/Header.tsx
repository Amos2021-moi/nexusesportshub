"use client"

import { useSession } from "next-auth/react"
import { Bell, User, Shield } from "lucide-react"
import { useState } from "react"

export default function Header() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <header className="fixed right-0 top-0 z-30 h-16 bg-white/80 backdrop-blur-md shadow-lg lg:left-64">
      <div className="flex h-full items-center justify-end px-6">
        {/* Role Badge */}
        {isAdmin && (
          <div className="mr-4 flex items-center space-x-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 shadow-md">
            <Shield size={14} className="text-white" />
            <span className="text-xs font-bold text-white">ADMIN</span>
          </div>
        )}
        
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>

        {/* User Menu */}
        <div className="relative ml-4">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <User size={16} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {session?.user?.name || session?.user?.email?.split('@')[0]}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5">
              <div className="border-b px-4 py-2">
                <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => setShowUserMenu(false)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}