"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, User, ArrowRight, Newspaper, Tag, Clock, Eye } from "lucide-react"

interface NewsItem {
  id: string
  title: string
  content: string
  image: string | null
  publishedAt: string
  author: {
    name: string
    profile: { username: string }
  }
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    fetchNews()
  }, [])

  async function fetchNews() {
    const res = await fetch("/api/news")
    const data = await res.json()
    setNews(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const categories = ["all", "Announcements", "Match Reports", "Tournaments", "Community"]

  const filteredNews = selectedCategory === "all" 
    ? news 
    : news.filter(item => item.content?.toLowerCase().includes(selectedCategory.toLowerCase()))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading news...</p>
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
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
            <Newspaper className="h-5 w-5 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-medium">News Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Latest News & Updates</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Stay up to date with the latest announcements, match reports, and community stories
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700">
            <Newspaper className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No News Yet</h3>
            <p className="text-gray-400">Check back later for updates and announcements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <div className="group bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-indigo-500/50 transition-all h-full hover:shadow-lg hover:shadow-indigo-500/10">
                  {item.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(item.publishedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {item.author.profile?.username || item.author.name}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                      {item.content}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-400">
                      Read More
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap justify-between items-center text-sm text-gray-500">
          <span>{news.length} articles published</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}