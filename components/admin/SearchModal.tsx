"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Search, X, Loader2, User, Trophy, Calendar, Users, 
  DollarSign, Shield, Newspaper, Award, Medal, Crown,
  ArrowRight, Clock, CheckCircle, AlertCircle, FileText
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

interface SearchResult {
  type: "season" | "tournament" | "player" | "fixture" | "result" | "payment" | "squad" | "news" | "award" | "hallOfFame"
  id: string
  title: string
  subtitle: string
  status?: string
  date?: string
  url: string
  matchScore: number
  metadata: Record<string, any>
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  time: number
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [searchTime, setSearchTime] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // ✅ Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // ✅ Handle search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setTotal(0)
      return
    }

    setIsTyping(true)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ Escape closes modal
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
      // ✅ Command+K or Ctrl+K opens modal (handled by parent)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  async function performSearch(searchQuery: string) {
    if (searchQuery.length < 2) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      if (!res.ok) throw new Error("Search failed")
      const data: SearchResponse = await res.json()
      setResults(data.results)
      setTotal(data.total)
      setSearchTime(data.time)
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Failed to search")
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "season": return <Calendar className="h-4 w-4 text-blue-400" />
      case "tournament": return <Trophy className="h-4 w-4 text-yellow-400" />
      case "player": return <User className="h-4 w-4 text-green-400" />
      case "fixture": return <Calendar className="h-4 w-4 text-purple-400" />
      case "result": return <CheckCircle className="h-4 w-4 text-green-400" />
      case "payment": return <DollarSign className="h-4 w-4 text-yellow-400" />
      case "squad": return <Shield className="h-4 w-4 text-indigo-400" />
      case "news": return <Newspaper className="h-4 w-4 text-pink-400" />
      case "award": return <Award className="h-4 w-4 text-orange-400" />
      case "hallOfFame": return <Crown className="h-4 w-4 text-yellow-400" />
      default: return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    const statusMap: Record<string, { color: string; label: string }> = {
      "SCHEDULED": { color: "bg-blue-500/20 text-blue-400", label: "Scheduled" },
      "PENDING": { color: "bg-yellow-500/20 text-yellow-400", label: "Pending" },
      "COMPLETED": { color: "bg-green-500/20 text-green-400", label: "Completed" },
      "ACTIVE": { color: "bg-green-500/20 text-green-400", label: "Active" },
      "PAID": { color: "bg-green-500/20 text-green-400", label: "Paid" },
      "UNPAID": { color: "bg-red-500/20 text-red-400", label: "Unpaid" },
      "Verified": { color: "bg-green-500/20 text-green-400", label: "Verified" },
      "Unverified": { color: "bg-yellow-500/20 text-yellow-400", label: "Unverified" },
      "Approved": { color: "bg-green-500/20 text-green-400", label: "Approved" },
      "Published": { color: "bg-green-500/20 text-green-400", label: "Published" },
      "Draft": { color: "bg-yellow-500/20 text-yellow-400", label: "Draft" },
    }
    const match = statusMap[status]
    if (!match) return null
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${match.color}`}>
        {match.label}
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      season: "Season",
      tournament: "Tournament",
      player: "Player",
      fixture: "Fixture",
      result: "Result",
      payment: "Payment",
      squad: "Squad",
      news: "News",
      award: "Award",
      hallOfFame: "Hall of Fame",
    }
    return labels[type] || type
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-auto max-w-3xl mt-16 sm:mt-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-700 px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anything... (ID, name, receipt, etc.)"
              className="flex-1 ml-3 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
              autoComplete="off"
            />
            {query.length > 0 && (
              <button
                onClick={() => setQuery("")}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <span className="ml-2 text-xs text-gray-500">⌘K</span>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                <span className="ml-3 text-gray-400">Searching...</span>
              </div>
            ) : query.length < 2 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Search for any ID, name, or keyword</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try: SEASON-001, Amos, FIX-789, or a receipt number
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">⌘K to search</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">ESC to close</span>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No results found for "{query}"</p>
                <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                  <span>{total} result{total !== 1 ? 's' : ''} found</span>
                  <span>{searchTime}ms</span>
                </div>

                <div className="space-y-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Link
                        href={`/admin/entity/${result.id}`}
                        onClick={onClose}
                        className="block p-3 rounded-xl hover:bg-gray-700/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white truncate">
                                {result.title}
                              </span>
                              {getStatusBadge(result.status)}
                              <span className="text-[10px] text-gray-500 ml-auto">
                                {getTypeLabel(result.type)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-gray-500">
                                ID: {result.id}
                              </span>
                              {result.date && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-[10px] text-gray-500">
                                    {result.date}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {total > 20 && (
                  <div className="text-center mt-3">
                    <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                      View all {total} results →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500">
            <span>Search across 10+ entity types</span>
            <div className="flex items-center gap-3">
              <span>↑↓ navigate</span>
              <span>Enter to select</span>
              <span>ESC to close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}