"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageCircle,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  User,
  Tag,
  Shield,
  Trophy,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Ban,
  Check,
  X,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/Skeleton";

// ============================================================================
// Types
// ============================================================================

interface Post {
  id: string;
  content: string;
  image: string | null;
  type: string;
  status: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile: { username: string } | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

// ============================================================================
// Post Type Config
// ============================================================================

const postTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  GENERAL: { label: "General", icon: MessageCircle, color: "text-blue-400" },
  SQUAD_SHARE: { label: "Squad Share", icon: Shield, color: "text-purple-400" },
  ACHIEVEMENT: { label: "Achievement", icon: Trophy, color: "text-yellow-400" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  APPROVED: { label: "Approved", color: "text-green-400", bg: "bg-green-500/15" },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/15" },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(name: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

// ============================================================================
// Stat Card
// ============================================================================

const StatCard = memo(({ label, value, color, icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-indigo-500/30"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </motion.div>
));

StatCard.displayName = "StatCard";

// ============================================================================
// Post Card
// ============================================================================

const PostCard = memo(
  ({ post, onApprove, onReject, processing, onDelete }: any) => {
    const isMobile = useIsMobile();
    const isPending = post.status === "PENDING";
    const typeCfg = postTypeConfig[post.type] || postTypeConfig.GENERAL;
    const TypeIcon = typeCfg.icon;
    const statusCfg = statusConfig[post.status] || statusConfig.PENDING;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-2xl border ${
          isPending ? "border-yellow-500/30" : "border-white/10"
        } bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-xl transition hover:border-indigo-500/40`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white ring-1 ring-white/10">
                {getInitials(post.user?.profile?.username || post.user?.name || "U")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">
                  {post.user?.profile?.username || post.user?.name || "Unknown"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-gray-500">{relativeTime(post.createdAt)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <TypeIcon className="h-3 w-3" />
                    {typeCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{post.content}</p>

            {post.image && (
              <div className="mt-2 overflow-hidden rounded-lg">
                <img
                  src={post.image}
                  alt="Post"
                  className="max-h-64 w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}

            {/* Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>❤️ {post._count?.likes || 0} likes</span>
              <span>💬 {post._count?.comments || 0} comments</span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {post.user?.email || "No email"}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {isPending ? (
              <>
                <button
                  onClick={() => onApprove(post.id)}
                  disabled={processing === post.id}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {processing === post.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => onReject(post.id)}
                  disabled={processing === post.id}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-600/25 disabled:opacity-50"
                >
                  {processing === post.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </button>
              </>
            ) : (
              <button
                onClick={() => onDelete(post.id)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

PostCard.displayName = "PostCard";

// ============================================================================
// Main Component
// ============================================================================

export default function AdminCommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not admin
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

  // ✅ Fetch posts with React Query
  const {
    data: responseData = { posts: [], pagination: {} },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-community-posts", filter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (searchTerm) params.append("search", searchTerm);
      const res = await fetch(`/api/admin/community/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      return {
        posts: data.posts || data || [],
        pagination: data.pagination || { total: 0, page: 1, limit: 20, pages: 0 },
      };
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    enabled: !!session && session.user?.role === "ADMIN",
  });

  const posts: Post[] = responseData.posts || [];
  const totalPosts = posts.length;

  // ============================================================================
  // Actions
  // ============================================================================

  const handleApprove = useCallback(
    async (postId: string) => {
      setProcessing(postId);
      try {
        const res = await fetch("/api/admin/community/posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, action: "approve" }),
        });
        if (res.ok) {
          toast.success("✅ Post approved!");
          await refetch();
          await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
          await queryClient.refetchQueries({ queryKey: ["community-posts"] });
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to approve");
        }
      } catch {
        toast.error("Failed to approve");
      } finally {
        setProcessing(null);
      }
    },
    [refetch, queryClient]
  );

  const handleReject = useCallback(
    async (postId: string) => {
      setProcessing(postId);
      try {
        const res = await fetch("/api/admin/community/posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, action: "reject" }),
        });
        if (res.ok) {
          toast.success("❌ Post rejected");
          await refetch();
          await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
          await queryClient.refetchQueries({ queryKey: ["community-posts"] });
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to reject");
        }
      } catch {
        toast.error("Failed to reject");
      } finally {
        setProcessing(null);
      }
    },
    [refetch, queryClient]
  );

  const handleDelete = useCallback(
    async (postId: string) => {
      if (!confirm("Delete this post permanently?")) return;
      try {
        const res = await fetch(`/api/admin/community/posts?id=${postId}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("🗑️ Post deleted");
          await refetch();
          await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        } else {
          toast.error("Failed to delete");
        }
      } catch {
        toast.error("Failed to delete");
      }
    },
    [refetch, queryClient]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    setRefreshing(false);
    toast.success("🔄 Refreshed!");
  }, [refetch, queryClient]);

  // ============================================================================
  // Stats
  // ============================================================================

  const pendingCount = useMemo(() => posts.filter((p) => p.status === "PENDING").length, [posts]);
  const approvedCount = useMemo(() => posts.filter((p) => p.status === "APPROVED").length, [posts]);
  const rejectedCount = useMemo(() => posts.filter((p) => p.status === "REJECTED").length, [posts]);

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-400" />
          <p className="mt-3 text-gray-400">Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-3 pb-20 sm:px-4 lg:px-6">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/50" />

      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">📋 Community Moderation</h1>
            <p className="text-sm text-gray-400">Review and manage community posts</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-gray-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.14] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Pending"
            value={pendingCount}
            color="text-yellow-400"
            icon={Clock}
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            color="text-green-400"
            icon={CheckCircle}
          />
          <StatCard
            label="Rejected"
            value={rejectedCount}
            color="text-red-400"
            icon={XCircle}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === f
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "border border-white/10 bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === filter && ` (${totalPosts})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-gray-900/50 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 sm:w-64"
            />
          </div>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
            <MessageCircle className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-4 text-xl font-semibold text-white">No Posts Found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {filter === "pending"
                ? "All posts have been reviewed! 🎉"
                : searchTerm
                ? "No posts match your search"
                : "No posts available"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  processing={processing}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Auto-Refresh Indicator */}
        <div className="text-center text-[10px] text-gray-500">
          🔄 Auto-refreshes every 5 seconds • {totalPosts} posts total
        </div>
      </div>
    </div>
  );
}