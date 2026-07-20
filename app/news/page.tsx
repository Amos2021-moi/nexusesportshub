// app/news/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  User,
  ArrowRight,
  Newspaper,
  Tag,
  Clock,
  Eye,
  Sparkles,
  TrendingUp,
  Filter,
  RefreshCw,
  Share2,
  Bookmark,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string | null;
  publishedAt: string;
  author: {
    name: string;
    profile?: { username?: string };
  };
}

/* -------------------------------------------------------------------------- */
/*                            Animation Variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.96,
    transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] as const },
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getInitials(name: string): string {
  if (!name) return "NE";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function estimateReadTime(content: string): number {
  if (!content) return 2;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function detectCategory(content: string): string {
  if (!content) return "General";
  const lower = content.toLowerCase();
  if (lower.includes("tournament") || lower.includes("championship") || lower.includes("bracket")) {
    return "Tournaments";
  }
  if (lower.includes("match") || lower.includes("score") || lower.includes("victory") || lower.includes("draw")) {
    return "Match Reports";
  }
  if (lower.includes("update") || lower.includes("season") || lower.includes("announcement")) {
    return "Announcements";
  }
  return "Community";
}

/* -------------------------------------------------------------------------- */
/*                           Memoized Components                              */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gray-950">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/80" />
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[130px]"
    />
    <motion.div
      animate={{ scale: [1.15, 1, 1.15], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 18, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[130px]"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
      transition={{ duration: 20, repeat: Infinity, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="absolute bottom-10 left-1/4 h-[450px] w-[450px] rounded-full bg-pink-600/10 blur-[130px]"
    />
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

interface ArticleCardProps {
  item: NewsItem;
}

const ArticleCard = memo(({ item }: ArticleCardProps) => {
  const authorName = item.author?.profile?.username || item.author?.name || "Nexus Editorial";
  const readTime = estimateReadTime(item.content);
  const categoryBadge = detectCategory(item.content);

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="h-full will-change-transform"
    >
      <Link
        href={`/news/${item.id}`}
        className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-500/40 hover:bg-white/[0.09] hover:shadow-[0_12px_40px_0_rgba(79,70,229,0.2)]"
      >
        {/* Subtle Top Accent Reflection */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Article Media Container */}
        <div>
          {item.image ? (
            <div className="relative h-52 w-full overflow-hidden sm:h-56">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
              
              {/* Floating Category Pill */}
              <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300 backdrop-blur-md shadow-sm">
                <Tag className="h-3 w-3 text-indigo-400" />
                {categoryBadge}
              </div>

              {/* Read Time Pill */}
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-gray-300 backdrop-blur-md">
                <Clock className="h-3 w-3 text-gray-400" />
                {readTime} min read
              </div>
            </div>
          ) : (
            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-gray-900 sm:h-48">
              <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] opacity-20 [background-size:16px_16px]" />
              <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300 backdrop-blur-md">
                <Tag className="h-3 w-3 text-indigo-400" />
                {categoryBadge}
              </div>
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-gray-300 backdrop-blur-md">
                <Clock className="h-3 w-3 text-gray-400" />
                {readTime} min read
              </div>
              <Newspaper className="h-14 w-14 text-indigo-400/30 transition-transform duration-500 group-hover:scale-110 group-hover:text-indigo-400/50" />
            </div>
          )}

          {/* Article Content */}
          <div className="p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 text-gray-300 ring-1 ring-white/10">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                {new Date(item.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5 text-gray-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[9px] font-bold text-white">
                  {getInitials(authorName)}
                </div>
                {authorName}
              </span>
            </div>

            <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-indigo-300 sm:text-2xl">
              {item.title}
            </h2>

            <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-gray-300">
              {item.content}
            </p>
          </div>
        </div>

        {/* Article Card Footer Action */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-5 py-3.5 sm:px-6">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 transition-colors group-hover:text-indigo-300">
            Read Full Dispatch
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          <span className="rounded-full bg-white/[0.04] p-1.5 text-gray-400 transition-colors group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
});

ArticleCard.displayName = "ArticleCard";

/* -------------------------------------------------------------------------- */
/*                              Main Page Component                           */
/* -------------------------------------------------------------------------- */

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const categories = useMemo(
    () => ["all", "Announcements", "Match Reports", "Tournaments", "Community"],
    []
  );

  const filteredNews = useMemo(() => {
    if (selectedCategory === "all") return news;
    return news.filter((item) =>
      item.content?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      item.title?.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [news, selectedCategory]);

  // Loading Skeleton View
  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-10">
            {/* Header Skeleton */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-8 w-44 animate-pulse rounded-full bg-white/[0.08]" />
              <div className="h-12 w-80 sm:w-[450px] animate-pulse rounded-2xl bg-white/[0.08]" />
              <div className="h-5 w-64 sm:w-[500px] animate-pulse rounded-lg bg-white/[0.05]" />
            </div>

            {/* Category Pills Skeleton */}
            <div className="flex flex-wrap justify-center gap-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-28 animate-pulse rounded-full bg-white/[0.06]" />
              ))}
            </div>

            {/* Grid Skeletons */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex h-[420px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl"
                >
                  <div className="h-48 w-full animate-pulse rounded-xl bg-white/[0.08]" />
                  <div className="space-y-3 pt-4">
                    <div className="flex gap-2">
                      <div className="h-5 w-24 animate-pulse rounded bg-white/[0.08]" />
                      <div className="h-5 w-28 animate-pulse rounded bg-white/[0.06]" />
                    </div>
                    <div className="h-6 w-3/4 animate-pulse rounded bg-white/[0.1]" />
                    <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-white/[0.06]" />
                  </div>
                  <div className="h-10 w-full animate-pulse rounded-xl bg-white/[0.05]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecorBackground />
      <div className="min-h-screen py-10 px-3 sm:py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* ===================================================================== */}
          {/* 1. Header Section                                                     */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10 text-center sm:mb-14"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-bold tracking-wide text-indigo-300 shadow-sm backdrop-blur-md mb-4 sm:mb-5">
              <Newspaper className="h-4 w-4 text-indigo-400" />
              <span>Nexus Esports News Center</span>
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Latest News &amp; League Updates
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-gray-300 sm:mt-4 sm:text-base">
              Stay up to date with official season announcements, tactical match reports, tournament brackets, and spotlight stories from our vibrant competitive community.
            </p>
          </motion.div>

          {/* ===================================================================== */}
          {/* 2. Category Filter Bar (Touch-Friendly min 44px targets)              */}
          {/* ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="mb-10 flex flex-wrap items-center justify-center gap-2 sm:mb-12 sm:gap-3"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group relative flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold tracking-wide transition-all duration-300 ${
                    isSelected
                      ? "border border-indigo-400/50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(79,70,229,0.35)] scale-105"
                      : "border border-white/[0.08] bg-white/[0.04] text-gray-300 backdrop-blur-md hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Filter className={`h-3.5 w-3.5 transition-transform duration-300 ${isSelected ? "text-white" : "text-gray-400 group-hover:text-indigo-400"}`} />
                  <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  {isSelected && (
                    <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black text-white">
                      {filteredNews.length}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* ===================================================================== */}
          {/* 3. News Grid / Empty State                                            */}
          {/* ===================================================================== */}
          {filteredNews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-10 text-center shadow-xl backdrop-blur-xl sm:p-14"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-indigo-400/60 shadow-inner sm:h-20 sm:w-20">
                <Newspaper className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-white sm:text-2xl">
                No Articles Found
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                We couldn&apos;t find any publications matching &ldquo;<span className="font-semibold text-white">{selectedCategory}</span>&rdquo;. Check back soon or select another filter.
              </p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-purple-500"
              >
                Reset Filter
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              layout
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 sm:gap-8 items-stretch"
            >
              <AnimatePresence mode="popLayout">
                {filteredNews.map((item) => (
                  <ArticleCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* 4. Footer Stats & Meta Bar                                            */}
          {/* ===================================================================== */}
          <div className="mt-14 sm:mt-18 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-6 backdrop-blur-xl sm:px-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left text-sm font-medium text-gray-400">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span>
                  Showing <strong className="text-white">{filteredNews.length}</strong> of <strong className="text-white">{news.length}</strong> total articles published
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  Last updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}