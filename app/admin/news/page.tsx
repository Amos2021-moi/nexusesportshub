"use client";

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Filter,
  PenLine,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// === Mobile Detection Hook ===
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

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    email: string;
    profile: { username: string } | null;
  };
}

/* -------------------------------------------------------------------------- */
/*                            Helper Functions                                */
/* -------------------------------------------------------------------------- */

function isThisMonth(date: string) {
  const input = new Date(date);
  const now = new Date();
  return input.getFullYear() === now.getFullYear() && input.getMonth() === now.getMonth();
}

function authorName(item: NewsItem) {
  return item.author.profile?.username || item.author.name || item.author.email;
}

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

// === STATIC Stat Card - NO animations ===
const StatCard = memo(({ stat }: { stat: any }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`group relative min-h-[44px] overflow-hidden rounded-2xl border bg-gray-800/40 p-3 shadow-xl backdrop-blur-xl transition-colors duration-150 hover:border-pink-500/40 sm:p-4 ${stat.ring}`}>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-70`} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xl font-bold sm:text-2xl ${stat.accent}`}>{stat.value}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
        </div>
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 sm:h-10 sm:w-10 ${stat.accent}`}>
          <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p className="relative mt-2 truncate text-[10px] text-gray-500 sm:text-[11px]">{stat.hint}</p>
    </div>
  );
});

StatCard.displayName = "StatCard";

// === STATIC News Card - NO animations ===
const NewsCard = memo(({ 
  item, 
  onTogglePublish, 
  onDelete, 
  toggling, 
  deleting 
}: {
  item: NewsItem;
  onTogglePublish: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  toggling: string | null;
  deleting: string | null;
}) => {
  const isMobile = useIsMobile();
  
  const handleToggle = useCallback(() => {
    onTogglePublish(item.id, item.published);
  }, [onTogglePublish, item.id, item.published]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [onDelete, item.id]);

  // NO hover effects on mobile
  const hoverClass = isMobile ? "" : "hover:border-pink-500/40";
  const imageScaleClass = isMobile ? "" : "group-hover:scale-105";

  return (
    <div className={`group overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-xl backdrop-blur-xl transition-colors duration-150 ${hoverClass}`}>
      {item.image ? (
        <div className="relative h-36 overflow-hidden bg-gray-900 sm:h-44">
          <img 
            src={item.image} 
            alt={item.title} 
            className={`h-full w-full object-cover transition-transform duration-300 ${imageScaleClass}`}
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-gradient-to-br from-pink-500/10 to-purple-500/10 sm:h-32">
          <ImageIcon className="h-9 w-9 text-gray-600" />
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {item.published ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-300">
              <CheckCircle size={12} />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-500/15 px-2.5 py-1 text-xs font-medium text-yellow-300">
              <Clock size={12} />
              Draft
            </span>
          )}
          {item.image && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-gray-900/40 px-2.5 py-1 text-xs text-gray-400">
              <ImageIcon size={12} />
              Image
            </span>
          )}
        </div>

        <h2 className="line-clamp-2 text-lg font-semibold text-white">{item.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm text-gray-400">{item.content}</p>

        <div className="mt-4 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
          <span className="flex min-w-0 items-center gap-1.5 rounded-xl bg-gray-900/40 px-3 py-2">
            <User size={12} className="flex-shrink-0" />
            <span className="truncate">{authorName(item)}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5 rounded-xl bg-gray-900/40 px-3 py-2">
            <Calendar size={12} className="flex-shrink-0" />
            <span className="truncate">{new Date(item.createdAt).toLocaleDateString()}</span>
          </span>
          {item.publishedAt && (
            <span className="flex min-w-0 items-center gap-1.5 rounded-xl bg-gray-900/40 px-3 py-2 sm:col-span-2">
              <CheckCircle size={12} className="flex-shrink-0 text-green-400" />
              <span className="truncate">Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={handleToggle}
            disabled={toggling === item.id}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors duration-150 ${
              item.published
                ? "border border-yellow-500/30 bg-yellow-600/15 text-yellow-300 hover:bg-yellow-600/25"
                : "border border-green-500/30 bg-green-600/15 text-green-300 hover:bg-green-600/25"
            } disabled:opacity-50`}
            title={item.published ? "Unpublish" : "Publish"}
          >
            {toggling === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : item.published ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
            {item.published ? "Unpublish" : "Publish"}
          </button>
          <Link
            href={`/admin/news/${item.id}/edit`}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/15 px-4 text-sm font-semibold text-blue-300 transition-colors duration-150 hover:bg-blue-600/25"
          >
            <Edit size={16} />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting === item.id}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-semibold text-red-300 transition-colors duration-150 hover:bg-red-600/25 disabled:opacity-50"
          >
            {deleting === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

NewsCard.displayName = "NewsCard";

/* -------------------------------------------------------------------------- */
/*                            STATIC Background - NO ANIMATIONS              */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  
  // On mobile - return minimal background, NO animations
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950" />
    );
  }

  // Desktop - static background with NO animations
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-pink-600/20 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-rose-500/15 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]" />
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
});

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function AdminNewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

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

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchNews();
    }
  }, [session]);

  async function fetchNews() {
    try {
      const res = await fetch("/api/admin/news");
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this news article?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("News article deleted");
        fetchNews();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }, []);

  const handleTogglePublish = useCallback(async (id: string, currentStatus: boolean) => {
    setToggling(id);
    try {
      const newsItem = news.find((n) => n.id === id);
      if (!newsItem) return;

      const res = await fetch("/api/admin/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: newsItem.title,
          content: newsItem.content,
          image: newsItem.image,
          published: !currentStatus,
        }),
      });

      if (res.ok) {
        toast.success(!currentStatus ? "News published!" : "News unpublished");
        fetchNews();
      } else {
        toast.error("Failed to update publish status");
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update");
    } finally {
      setToggling(null);
    }
  }, [news]);

  // === Memoized filtered data ===
  const filteredNews = useMemo(
    () =>
      news.filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.content.toLowerCase().includes(search.toLowerCase()) ||
          authorName(item).toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "published" && item.published) ||
          (filter === "draft" && !item.published);
        return matchesSearch && matchesFilter;
      }),
    [filter, news, search]
  );

  const publishedCount = useMemo(() => news.filter((n) => n.published).length, [news]);
  const draftCount = useMemo(() => news.filter((n) => !n.published).length, [news]);
  const thisMonthCount = useMemo(() => news.filter((n) => isThisMonth(n.createdAt)).length, [news]);

  const statCards = useMemo(() => [
    {
      label: "Total Articles",
      value: news.length,
      hint: "All news articles",
      icon: Newspaper,
      accent: "text-pink-400",
      ring: "border-pink-500/20",
      glow: "from-pink-500/20",
    },
    {
      label: "Published",
      value: publishedCount,
      hint: "Currently published",
      icon: CheckCircle,
      accent: "text-green-400",
      ring: "border-green-500/20",
      glow: "from-green-500/20",
    },
    {
      label: "Drafts",
      value: draftCount,
      hint: "Draft articles",
      icon: PenLine,
      accent: "text-yellow-400",
      ring: "border-yellow-500/20",
      glow: "from-yellow-500/20",
    },
    {
      label: "This Month",
      value: thisMonthCount,
      hint: "Created this month",
      icon: Calendar,
      accent: "text-purple-400",
      ring: "border-purple-500/20",
      glow: "from-purple-500/20",
    },
  ], [news.length, publishedCount, draftCount, thisMonthCount]);

  const filterButtons = useMemo(() => [
    { value: "all" as const, label: "All", count: news.length, active: "bg-indigo-500/20 text-indigo-300" },
    { value: "published" as const, label: "Published", count: publishedCount, active: "bg-green-500/20 text-green-300" },
    { value: "draft" as const, label: "Drafts", count: draftCount, active: "bg-yellow-500/20 text-yellow-300" },
  ], [news.length, publishedCount, draftCount]);

  // === Callbacks ===
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleFilterChange = useCallback((value: "all" | "published" | "draft") => {
    setFilter(value);
  }, []);

  // === Loading State ===
  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-[3px] border-pink-500 border-t-transparent" />
            <p className="text-gray-400">Loading news...</p>
          </div>
        </div>
      </>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  // === RENDER - NO animations on mobile ===
  return (
    <>
      <DecorBackground />
      <div className="space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4 lg:px-6">
        {/* Header - NO animations */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-pink-600/20 via-rose-600/20 to-purple-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 sm:h-12 sm:w-12">
                <Newspaper className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-white sm:text-2xl">📰 News Management</h1>
                <p className="mt-0.5 truncate text-xs text-gray-300 sm:text-sm">Create and manage news articles</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <span className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-pink-400/30 bg-pink-500/10 px-3 py-2 text-xs font-semibold text-pink-300">
                <Sparkles className="h-3.5 w-3.5" />
                {news.length} articles
              </span>
              <Link
                href="/admin/news/create"
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-900/30 transition-all duration-150 hover:from-pink-700 hover:to-rose-700"
              >
                <Plus size={18} />
                Create News
              </Link>
            </div>
          </div>
        </div>

        {/* Stats - NO animations */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Filters - NO animations */}
        <div className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search news by title, content, or author..."
                value={search}
                onChange={handleSearchChange}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-colors duration-150 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-gray-900/40 p-1 lg:flex">
              {filterButtons.map((button) => (
                <button
                  key={button.value}
                  onClick={() => handleFilterChange(button.value)}
                  className={`flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors duration-150 sm:px-4 sm:text-sm ${
                    filter === button.value ? button.active : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Filter size={13} className="hidden sm:block" />
                  {button.label} <span>({button.count})</span>
                </button>
              ))}
            </div>
            <button
              onClick={fetchNews}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 text-gray-400 transition-colors duration-150 hover:bg-white/5 hover:text-white"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* News List - NO animations */}
        {filteredNews.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-gray-800/40 py-12 text-center shadow-2xl backdrop-blur-xl">
            <Newspaper className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No News Articles</h3>
            <p className="px-4 text-sm text-gray-400 sm:text-base">
              {search ? "No articles match your search." : "Create your first news article."}
            </p>
            {!search && (
              <Link 
                href="/admin/news/create" 
                className="mt-4 inline-flex min-h-[44px] items-center text-pink-400 transition-colors duration-150 hover:text-pink-300"
              >
                Create News →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredNews.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onTogglePublish={handleTogglePublish}
                onDelete={handleDelete}
                toggling={toggling}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}