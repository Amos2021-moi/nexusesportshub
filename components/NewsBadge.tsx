"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Bell, BellDot, BellRing, Sparkles, Zap, Newspaper } from "lucide-react";
import Link from "next/link";

interface NewsBadgeProps {
  showLabel?: boolean;
  className?: string;
}

const badgeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 15,
      duration: 0.3
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function NewsBadge({ showLabel = false, className = "" }: NewsBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNewNews, setHasNewNews] = useState(false);

  useEffect(() => {
    fetchNewsCount();
    // Check for new news every 30 seconds
    const interval = setInterval(fetchNewsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNewsCount() {
    try {
      const res = await fetch("/api/news?count=true");
      const data = await res.json();
      const newCount = data.count || 0;
      
      // Check if there's new news (count increased)
      if (count > 0 && newCount > count) {
        setHasNewNews(true);
        // Reset highlight after 5 seconds
        setTimeout(() => setHasNewNews(false), 5000);
      }
      
      setCount(newCount);
    } catch (error) {
      console.error("Error fetching news count:", error);
    } finally {
      setLoading(false);
    }
  }

  const getBellIcon = () => {
    if (count > 0) {
      return hasNewNews ? BellRing : BellDot;
    }
    return Bell;
  };

  const BellIcon = getBellIcon();

  return (
    <motion.div
      className={`relative inline-flex items-center gap-2 ${className}`}
      initial="hidden"
      animate="visible"
      variants={badgeVariants}
    >
      <div className="relative">
        {/* Bell Icon with glow */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/5">
          {hasNewNews && (
            <motion.div
              variants={pulseVariants}
              animate="pulse"
              className="absolute inset-0 rounded-xl bg-yellow-400/10"
            />
          )}
          <BellIcon
            className={`h-5 w-5 transition-colors ${
              count > 0
                ? hasNewNews
                  ? "text-yellow-400"
                  : "text-indigo-400"
                : "text-gray-400"
            }`}
          />
        </div>

        {/* Badge Counter */}
        <AnimatePresence>
          {!loading && count > 0 && (
            <motion.span
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`absolute -right-0.5 -top-0.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-lg ${
                hasNewNews
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/30"
                  : "bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/30"
              }`}
            >
              {count > 99 ? "99+" : count}
            </motion.span>
          )}
        </AnimatePresence>

        {/* New indicator pulse dot */}
        {hasNewNews && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-yellow-400"
          >
            <motion.span
              animate={{ scale: [1, 1.5, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full bg-yellow-400/50"
            />
          </motion.span>
        )}
      </div>

      {/* Label (optional) */}
      {showLabel && (
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-white">News</p>
          {count > 0 && (
            <p className="text-xs text-gray-400">
              {count} {count === 1 ? "update" : "updates"}
            </p>
          )}
        </div>
      )}

      {/* Quick news preview (if count > 0) */}
      {count > 0 && (
        <Link
          href="/news"
          className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-400 transition-all hover:bg-white/10 hover:text-white lg:flex"
        >
          <Sparkles className="h-3 w-3 text-yellow-400" />
          <span>New</span>
        </Link>
      )}
    </motion.div>
  );
}