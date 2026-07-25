"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Send,
  Image as ImageIcon,
  X,
  Trophy,
  Shield,
  Calendar,
  Trash2,
  Edit2,
  Flag,
  Users,
  Sparkles,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Smile,
  Camera,
  AtSign,
  Hash,
  Pin,
  Bookmark,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { SkeletonCommunityPost, Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// Types
// ============================================================================

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    profile: { username: string } | null;
  };
}

interface Post {
  id: string;
  content: string;
  image: string | null;
  type: string;
  status: string;
  likes: number;
  createdAt: string;
  userId: string;
  user: {
    name: string;
    profile: { username: string } | null;
  };
  comments: Comment[];
  _count: { comments: number };
}

// ============================================================================
// Post Type Config
// ============================================================================

const postTypeConfig: Record<
  string,
  { label: string; badge: string; icon: any; color: string }
> = {
  GENERAL: {
    label: "General",
    badge: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
  },
  SQUAD_SHARE: {
    label: "Squad Share",
    badge: "bg-purple-500/20 text-purple-300 ring-purple-500/30",
    icon: Shield,
    color: "from-purple-500 to-pink-500",
  },
  ACHIEVEMENT: {
    label: "Achievement",
    badge: "bg-yellow-500/20 text-yellow-300 ring-yellow-500/30",
    icon: Trophy,
    color: "from-yellow-500 to-orange-500",
  },
};

const filterTabs = [
  { key: "ALL", label: "All Feed", icon: Sparkles },
  { key: "GENERAL", label: "General", icon: MessageCircle },
  { key: "SQUAD_SHARE", label: "Squad Shares", icon: Shield },
  { key: "ACHIEVEMENT", label: "Achievements", icon: Trophy },
];

// ============================================================================
// Helper Functions
// ============================================================================

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

function getInitials(name: string): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
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
// Static Components
// ============================================================================

const DecorBackground = memo(() => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950/50" />
    );
  }
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950/50">
      <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[130px]" />
      <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[130px]" />
      <div className="absolute bottom-10 left-1/4 h-[450px] w-[450px] rounded-full bg-pink-600/10 blur-[130px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
});

DecorBackground.displayName = "DecorBackground";

// ============================================================================
// Comment Item
// ============================================================================

const CommentItem = memo(({ comment }: { comment: Comment }) => {
  const username = comment.user?.profile?.username || comment.user?.name || "Player";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2.5"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-xs font-bold text-white ring-1 ring-white/10">
        {getInitials(username)}
      </div>
      <div className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/5">
        <p className="text-sm">
          <span className="font-semibold text-white">{username}</span>
          <span className="ml-2 text-gray-300">{comment.content}</span>
        </p>
        <p className="mt-1 text-[10px] text-gray-500">{relativeTime(comment.createdAt)}</p>
      </div>
    </motion.div>
  );
});

CommentItem.displayName = "CommentItem";

// ============================================================================
// Post Card Component
// ============================================================================

const PostCard = memo(
  ({
    post,
    isLiked,
    isOwnPost,
    onLike,
    onComment,
    onDelete,
    onEdit,
    onReport,
    session,
    commenting,
    commentText,
    setCommenting,
    setCommentText,
    editing,
    editContent,
    setEditing,
    setEditContent,
    onSaveEdit,
    onCancelEdit,
  }: any) => {
    const username = post.user?.profile?.username || post.user?.name || "Player";
    const typeCfg = postTypeConfig[post.type] || postTypeConfig.GENERAL;
    const TypeIcon = typeCfg.icon;
    const isMobile = useIsMobile();
    const isPending = post.status === "PENDING";

    if (post.status !== "APPROVED" && !isOwnPost) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_8px_32px_0_rgba(79,70,229,0.15)]"
      >
        {/* Post Header */}
        <div className="border-b border-white/5 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white ring-2 ring-white/10">
                {getInitials(username)}
              </div>
              <div>
                <p className="font-semibold text-white">{username}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs text-gray-500">{relativeTime(post.createdAt)}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${typeCfg.badge}`}
                  >
                    <TypeIcon className="h-3 w-3" />
                    {typeCfg.label}
                  </span>
                  {isPending && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-300 ring-1 ring-yellow-500/30">
                      <Clock className="h-3 w-3" />
                      Pending Approval
                    </span>
                  )}
                  {post.status === "APPROVED" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-300 ring-1 ring-green-500/30">
                      <CheckCircle className="h-3 w-3" />
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isOwnPost && (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(post.id);
                    setEditContent(post.content);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            {!isOwnPost && (
              <button
                onClick={() => onReport(post.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-yellow-500/10 hover:text-yellow-400"
              >
                <Flag className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="p-4">
          {editing === post.id ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveEdit(post.id)}
                  className="min-h-[40px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 text-sm font-medium text-white transition hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="min-h-[40px] rounded-xl border border-white/10 bg-gray-700/40 px-4 text-sm text-white transition hover:bg-gray-600/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                {post.content}
              </p>
              {post.image && (
                <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-white/10">
                  <Image
                    src={post.image}
                    alt="Post"
                    width={600}
                    height={400}
                    className="max-h-96 w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex flex-wrap items-center gap-4 border-t border-white/5 px-4 py-2.5">
          <button
            onClick={() => onLike(post.id)}
            className={`flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm transition-colors ${
              isLiked ? "text-rose-500" : "text-gray-400 hover:text-rose-500"
            }`}
          >
            <Heart className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
            <span className="font-medium">{post.likes}</span>
          </button>
          <button
            onClick={() => setCommenting(commenting === post.id ? null : post.id)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm text-gray-400 transition-colors hover:text-indigo-400"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{post._count?.comments || 0}</span>
          </button>
          <button className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm text-gray-400 transition-colors hover:text-indigo-400">
            <Bookmark className="h-5 w-5" />
          </button>
          <button className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm text-gray-400 transition-colors hover:text-indigo-400">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Comments Section */}
        {commenting === post.id && (
          <div className="border-t border-white/5 bg-gray-900/40 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-gray-900/60 px-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                onClick={() => onComment(post.id)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition hover:shadow-lg hover:shadow-indigo-500/30"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {post.comments && post.comments.length > 0 && (
          <div className="space-y-3 border-t border-white/5 bg-gray-900/20 p-4">
            {post.comments.slice(0, 3).map((comment: Comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            {post._count?.comments > 3 && (
              <button className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300">
                View all {post._count.comments} comments →
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

PostCard.displayName = "PostCard";

// ============================================================================
// Loading Skeleton
// ============================================================================

const LoadingSkeleton = memo(() => (
  <div className="max-w-3xl mx-auto space-y-5 px-3">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" className="h-8 w-48" />
      <Skeleton variant="text" className="h-8 w-24" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-white/5" />
      ))}
    </div>
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <Skeleton variant="text" className="h-20 w-full" />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="text" className="h-8 w-16" />
      </div>
    </div>
    {[1, 2].map((i) => (
      <SkeletonCommunityPost key={i} />
    ))}
  </div>
));

LoadingSkeleton.displayName = "LoadingSkeleton";

// ============================================================================
// Stats Chips
// ============================================================================

const StatChip = memo(
  ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-colors hover:border-indigo-500/30">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-[11px] text-gray-400">{label}</p>
      </div>
    </div>
  )
);

StatChip.displayName = "StatChip";

// ============================================================================
// Main Component
// ============================================================================

export default function CommunityPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // State
  const [newPost, setNewPost] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostType, setNewPostType] = useState("GENERAL");
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // ✅ React Query - Fetch Posts with Auto-Refresh
  const {
    data: responseData = { posts: [], pagination: {} },
    isLoading,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const res = await fetch("/api/community/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      let allPosts: Post[] = [];
      if (Array.isArray(data)) allPosts = data;
      else if (data.posts && Array.isArray(data.posts)) allPosts = data.posts;
      return {
        posts: allPosts.filter((p: Post) => p.status === "APPROVED"),
        pagination: data.pagination || { total: allPosts.length, page: 1, limit: 20, pages: 1 },
      };
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const posts: Post[] = responseData.posts || [];

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchPosts();
    setRefreshing(false);
    toast.success("🔄 Feed refreshed!");
  }, [refetchPosts]);

  const handleCreatePost = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPost.trim()) {
        toast.error("Please enter some content");
        return;
      }
      setPosting(true);
      try {
        const res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPost,
            image: newPostImage,
            type: newPostType,
          }),
        });
        if (res.ok) {
          toast.success("Post submitted for approval!");
          setNewPost("");
          setNewPostImage(null);
          setNewPostType("GENERAL");
          await refetchPosts();
        } else {
          const error = await res.json();
          toast.error(error.error || "Failed to post");
        }
      } catch {
        toast.error("Failed to post");
      }
      setPosting(false);
    },
    [newPost, newPostImage, newPostType, refetchPosts]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      try {
        const res = await fetch("/api/community/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        if (res.ok) {
          const data = await res.json();
          setLikedPosts((prev) => {
            const next = new Set(prev);
            if (data.liked) next.add(postId);
            else next.delete(postId);
            return next;
          });
          await refetchPosts();
        }
      } catch {
        console.error("Error liking post");
      }
    },
    [refetchPosts]
  );

  const handleComment = useCallback(
    async (postId: string) => {
      if (!commentText.trim()) {
        toast.error("Please enter a comment");
        return;
      }
      try {
        const res = await fetch("/api/community/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, content: commentText }),
        });
        if (res.ok) {
          toast.success("Comment added!");
          setCommentText("");
          setCommenting(null);
          await refetchPosts();
        } else {
          toast.error("Failed to add comment");
        }
      } catch {
        toast.error("Failed to add comment");
      }
    },
    [commentText, refetchPosts]
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      if (!confirm("Delete this post?")) return;
      try {
        const res = await fetch(`/api/community/posts?id=${postId}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Post deleted");
          await refetchPosts();
        } else {
          toast.error("Failed to delete");
        }
      } catch {
        toast.error("Failed to delete");
      }
    },
    [refetchPosts]
  );

  const handleEditPost = useCallback(
    async (postId: string) => {
      if (!editContent.trim()) {
        toast.error("Please enter content");
        return;
      }
      try {
        const res = await fetch(`/api/community/posts/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent }),
        });
        if (res.ok) {
          toast.success("Post updated!");
          setEditingPost(null);
          setEditContent("");
          await refetchPosts();
        } else {
          toast.error("Failed to update");
        }
      } catch {
        toast.error("Failed to update");
      }
    },
    [editContent, refetchPosts]
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be < 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setNewPostImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReport = (postId: string) => {
    toast.success("Post reported. We'll review it shortly.");
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    if (filterType === "ALL") return posts;
    return posts.filter((p: Post) => p.type === filterType);
  }, [posts, filterType]);

  const totalPosts = Array.isArray(posts) ? posts.length : 0;
  const totalComments = useMemo(() => {
    if (!Array.isArray(posts)) return 0;
    return posts.reduce((acc, p) => acc + (p._count?.comments || 0), 0);
  }, [posts]);
  const myPosts = useMemo(() => {
    if (!Array.isArray(posts)) return 0;
    return posts.filter((p) => p.userId === session?.user?.id).length;
  }, [posts, session]);

  // ============================================================================
  // Visibility Refetch
  // ============================================================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refetchPosts();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetchPosts]);

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="relative min-h-screen px-3 pb-20 sm:px-4 lg:px-6">
      <DecorBackground />

      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">💬 Community</h1>
              <p className="text-sm text-gray-400">Connect, share, and celebrate</p>
            </div>
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
          <StatChip icon={Sparkles} label="Posts" value={totalPosts} accent="text-indigo-400" />
          <StatChip icon={MessageCircle} label="Comments" value={totalComments} accent="text-purple-400" />
          <StatChip icon={Users} label="Your Posts" value={myPosts} accent="text-pink-400" />
        </div>

        {/* Create Post */}
        {session && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div className="flex gap-3">
                <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white sm:flex">
                  {getInitials(session.user?.name || "You")}
                </div>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something with the community..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-sm text-white placeholder-gray-500 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {newPostImage && (
                <div className="relative inline-block">
                  <img
                    src={newPostImage}
                    alt="Preview"
                    className="h-28 w-auto rounded-xl ring-1 ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPostImage(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-3 text-gray-400 transition hover:text-white">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <select
                  value={newPostType}
                  onChange={(e) => setNewPostType(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-gray-900/60 px-3 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="GENERAL">General</option>
                  <option value="SQUAD_SHARE">Squad Share</option>
                  <option value="ACHIEVEMENT">Achievement</option>
                </select>

                <span className="text-xs text-gray-500">{newPost.length}/1000</span>

                <button
                  type="submit"
                  disabled={posting || !newPost.trim()}
                  className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50 disabled:opacity-50"
                >
                  {posting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-yellow-400/70">
                📝 Posts require admin approval before appearing publicly
              </p>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filterType === tab.key
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "border border-white/10 bg-white/5 text-gray-400 backdrop-blur-xl hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center backdrop-blur-xl">
            <MessageCircle className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-4 text-xl font-semibold text-white">No Posts Yet</h3>
            <p className="mt-1 text-sm text-gray-400">
              {session ? "Be the first to share!" : "Sign in to join the conversation"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filteredPosts.map((post: Post) => {
                const isLiked = likedPosts.has(post.id);
                const isOwnPost = post.userId === session?.user?.id;

                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    isLiked={isLiked}
                    isOwnPost={isOwnPost}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDeletePost}
                    onEdit={() => {
                      setEditingPost(post.id);
                      setEditContent(post.content);
                    }}
                    onReport={handleReport}
                    onSaveEdit={handleEditPost}
                    onCancelEdit={handleCancelEdit}
                    session={session}
                    commenting={commenting}
                    commentText={commentText}
                    setCommenting={setCommenting}
                    setCommentText={setCommentText}
                    editing={editingPost}
                    editContent={editContent}
                    setEditing={setEditingPost}
                    setEditContent={setEditContent}
                  />
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Auto-Refresh Indicator */}
        <div className="text-center text-[10px] text-gray-500">
          🔄 Auto-refreshes every 10 seconds • Posts require admin approval
        </div>
      </div>
    </div>
  );
}