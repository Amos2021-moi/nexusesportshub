"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Star, Crown, Medal, Calendar, User, Shield, Award, Sparkles, Filter } from "lucide-react"
import Image from "next/image"
interface HallEntry {
  id: string
  category: string
  reason: string
  imageUrl: string | null
  inductedAt: string
  player: {
    name: string
    profile: { username: string; profilePicture: string }
  }
  season: {
    name: string
  }
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Champion": <Crown className="h-8 w-8 text-yellow-500" />,
  "Legend": <Star className="h-8 w-8 text-purple-500" />,
  "Golden Boot": <Trophy className="h-8 w-8 text-orange-500" />,
  "Golden Glove": <Shield className="h-8 w-8 text-blue-500" />,
  "MVP": <Medal className="h-8 w-8 text-indigo-500" />,
  "Player of the Season": <Award className="h-8 w-8 text-amber-500" />,
}

const categoryColors: Record<string, string> = {
  "Champion": "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  "Legend": "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "Golden Boot": "from-orange-500/20 to-red-500/20 border-orange-500/30",
  "Golden Glove": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "MVP": "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
  "Player of the Season": "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
}

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEntries()
  }, [])

  async function fetchEntries() {
    const res = await fetch("/api/hall-of-fame")
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const categories = ["all", ...new Set(entries.map(e => e.category))]

  const filteredEntries = entries.filter(entry => {
    const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory
    const matchesSearch = entry.player.profile?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.player.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading Hall of Fame...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-yellow-400 font-medium">Hall of Fame</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">🏆 Hall of Fame</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Celebrating the legends, champions, and record holders of Nexus Esports League
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{entries.length}</p>
            <p className="text-xs text-gray-400">Total Inductees</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <Star className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{categories.length - 1}</p>
            <p className="text-xs text-gray-400">Categories</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{new Set(entries.map(e => e.season.name)).size}</p>
            <p className="text-xs text-gray-400">Seasons</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
            <User className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{new Set(entries.map(e => e.player.profile?.username || e.player.name)).size}</p>
            <p className="text-xs text-gray-400">Legends</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Entries Grid */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Hall of Fame Entries Found</h3>
            <p className="text-gray-400">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => {
              const Icon = categoryIcons[entry.category] || <Award className="h-8 w-8 text-gray-400" />
              const playerName = entry.player.profile?.username || entry.player.name
              const profilePic = entry.player.profile?.profilePicture
              const colorClass = categoryColors[entry.category] || "from-gray-500/20 to-gray-600/20 border-gray-500/30"

              return (
                <div 
                  key={entry.id} 
                  className={`group bg-gradient-to-br ${colorClass} rounded-2xl border p-6 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {profilePic ? (
                        <Image
                          src={profilePic || "/default-avatar.png"}
                          alt={playerName}
                          width={96}
                          height={96}
                          className="w-24 h-24 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white/20 group-hover:border-yellow-500/50 transition-all">
                          {playerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
                          {playerName}
                        </h3>
                        <p className="text-xs text-gray-400">{entry.season.name}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {Icon}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-3">
                    <span className="text-xs font-medium text-gray-300">{entry.category}</span>
                  </div>

                  {/* Reason */}
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    "{entry.reason}"
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Inducted: {new Date(entry.inductedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 text-yellow-500/70">
                      <Sparkles size={12} />
                      Legend
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap justify-between items-center text-sm text-gray-500">
          <span>{filteredEntries.length} legends displayed</span>
          <span>🏆 Nexus Esports League Hall of Fame</span>
        </div>
      </div>
    </div>
  )
}