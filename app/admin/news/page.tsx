"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import toast from "react-hot-toast";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function DecorBackground() {
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
}

function isThisMonth(date: string) {
  const input = new Date(date);
  const now = new Date();
  return input.getFullYear() === now.getFullYear() && input.getMonth() === now.getMonth();
}

function authorName(item: NewsItem) {
  return item.author.profile?.username || item.author.name || item.author.email;
}

export default function AdminNewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  async function handleDelete(id: string) {
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
  }

  async function handleTogglePublish(id: string, currentStatus: boolean) {
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
  }

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

  const publishedCount = news.filter((n) => n.published).length;
  const draftCount = news.filter((n) => !n.published).length;
  const thisMonthCount = news.filter((n) => isThisMonth(n.createdAt)).length;

  if (status === "loading" || loading) {
    return (
      <>
        <DecorBackground />
        <div className="flex h-64 items-center justify-center">
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

  const statCards = [
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
  ];

  const filterButtons = [
    { value: "all" as const, label: "All", count: news.length, active: "bg-indigo-500/20 text-indigo-300" },
    { value: "published" as const, label: "Published", count: publishedCount, active: "bg-green-500/20 text-green-300" },
    { value: "draft" as const, label: "Drafts", count: draftCount, active: "bg-yellow-500/20 text-yellow-300" },
  ];

  return (
    <>
      <DecorBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5 sm:space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-pink-600/20 via-rose-600/20 to-purple-600/20 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 sm:h-12 sm:w-12">
                <Newspaper className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-white sm:text-2xl">📰 News Management</h1>
                <p className="mt-0.5 text-xs text-gray-300 sm:text-sm">Create and manage news articles</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <span className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-pink-400/30 bg-pink-500/10 px-3 py-2 text-xs font-semibold text-pink-300">
                <Sparkles className="h-3.5 w-3.5" />
                {news.length} articles
              </span>
              <Link
                href="/admin/news/create"
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-900/30 transition-all hover:from-pink-700 hover:to-rose-700"
              >
                <Plus size={18} />
                Create News
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`group relative min-h-[44px] overflow-hidden rounded-2xl border bg-gray-800/40 p-4 shadow-xl backdrop-blur-xl transition-colors hover:border-pink-500/40 ${stat.ring}`}
            >
              <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${stat.glow} to-transparent opacity-40 blur-2xl transition-opacity group-hover:opacity-70`} />
              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-400 sm:text-sm">{stat.label}</p>
                </div>
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${stat.accent}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="relative mt-2 truncate text-[11px] text-gray-500">{stat.hint}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-gray-800/40 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search news by title, content, or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 py-2 pl-10 pr-4 text-white placeholder-gray-500 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-gray-900/40 p-1 lg:flex">
              {filterButtons.map((button) => (
                <button
                  key={button.value}
                  onClick={() => setFilter(button.value)}
                  className={`flex min-h-[44px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
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
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-gray-900/50 text-gray-400 transition-all hover:bg-white/5 hover:text-white"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </motion.div>

        {/* News List */}
        {filteredNews.length === 0 ? (
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-gray-800/40 py-12 text-center shadow-2xl backdrop-blur-xl">
            <Newspaper className="mx-auto mb-4 h-16 w-16 text-gray-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No News Articles</h3>
            <p className="px-4 text-gray-400">{search ? "No articles match your search." : "Create your first news article."}</p>
            {!search && (
              <Link href="/admin/news/create" className="mt-4 inline-flex min-h-[44px] items-center text-pink-400 transition-all hover:text-pink-300">
                Create News →
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredNews.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-gray-800/40 shadow-xl backdrop-blur-xl transition-colors hover:border-pink-500/40"
              >
                {item.image ? (
                  <div className="relative h-36 overflow-hidden bg-gray-900 sm:h-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
                      onClick={() => handleTogglePublish(item.id, item.published)}
                      disabled={toggling === item.id}
                      className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all ${
                        item.published
                          ? "border border-yellow-500/30 bg-yellow-600/15 text-yellow-300 hover:bg-yellow-600/25"
                          : "border border-green-500/30 bg-green-600/15 text-green-300 hover:bg-green-600/25"
                      }`}
                      title={item.published ? "Unpublish" : "Publish"}
                    >
                      {toggling === item.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : item.published ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                      {item.published ? "Unpublish" : "Publish"}
                    </button>
                    <Link
                      href={`/admin/news/${item.id}/edit`}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/15 px-4 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-600/25"
                    >
                      <Edit size={16} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/15 px-4 text-sm font-semibold text-red-300 transition-all hover:bg-red-600/25 disabled:opacity-50"
                    >
                      {deleting === item.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}