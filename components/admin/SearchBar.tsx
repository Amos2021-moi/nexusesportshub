"use client"

import { useState, useEffect } from "react"
import { Search, Command } from "lucide-react"
import SearchModal from "./SearchModal"

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)

  // ✅ Keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ Command+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl border border-gray-600 hover:border-indigo-500/50 transition-all w-full md:w-72 lg:w-96 group"
      >
        <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors flex-1 text-left">
          Search anything...
        </span>
        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-500 font-mono">
          <Command className="h-3 w-3" />
          <span>K</span>
        </kbd>
      </button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}