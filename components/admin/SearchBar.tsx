"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Search, Command } from "lucide-react";
import SearchModal from "./SearchModal";

/* -------------------------------------------------------------------------- */
/*                           Performance Hooks                                */
/* -------------------------------------------------------------------------- */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*                           STATIC Search Bar                               */
/* -------------------------------------------------------------------------- */

export default function SearchBar() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ Command+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // ✅ On mobile, show a simplified search button
  if (isMobile) {
    return (
      <>
        <button
          onClick={handleOpen}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <SearchModal isOpen={isOpen} onClose={handleClose} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex min-h-[44px] items-center gap-3 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl border border-gray-600 hover:border-indigo-500/50 transition-colors duration-150 w-full md:w-72 lg:w-96 group"
      >
        <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-150" />
        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-150 flex-1 text-left">
          Search anything...
        </span>
        <kbd className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-500 font-mono">
          <Command className="h-3 w-3" />
          <span>K</span>
        </kbd>
      </button>

      <SearchModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}