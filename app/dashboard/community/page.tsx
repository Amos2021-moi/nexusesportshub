"use client";

import EmptyState from "@/components/ui/EmptyState";
import Image from "next/image";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
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
  Pin,
  Filter,
  EyeOff,
  Sparkles,
  Users,
  MessageSquare,
  Loader2,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { SkeletonCommunityPost, Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface Post {
  id: string;
  content: string;
  image: string | null;
  type: string;
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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    profile: { username: string } | null;
  };
}

/* -------------------------------------------------------------------------- */
/*                            Animation variants                              */
/* -------------------------------------------------------------------------- */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/* -------------------------------------------------------------------------- */
/*                          Post type presentation                            */
/* -------------------------------------------------------------------------- */

const postTypeConfig: Record<
  string,
  { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }
> = {
  GENERAL: {
    label: "General",
    badge: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
    icon: MessageCircle,
  },
  SQUAD_SHARE: {
    label: "Squad Share",
    badge: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
    icon: Shield,
  },
  ACHIEVEMENT: {
    label: "Achievement",
    badge: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
    icon: Trophy,
  },
};

const filterTabs = [
  { key: "ALL", label: "All" },
  { key: "GENERAL", label: "General" },
  { key: "SQUAD_SHARE", label: "Squad Shares" },
  { key: "ACHIEVEMENT", label: "Achievements" },
];

/* Relative time helper */
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

/* -------------------------------------------------------------------------- */
/*                            Memoized Components                             */
/* -------------------------------------------------------------------------- */

const StatChip = memo(({ icon: Icon, label, value, accent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
    <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ${accent}`}>
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  </div>
));

StatChip.displayName = "StatChip";

const CommentItem = memo(({ comment }: { comment: Comment }) => {
  const username = comment.user.profile?.username || comment.user.name || "Player";
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2"
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-xs font-bold text-white ring-1 ring-white/10">
        {username.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/5">
        <p className="text-sm">
          <span className="font-semibold text-white">{username}</span>
          <span className="ml-2 text-gray-300">{comment.content}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">{relativeTime(comment.createdAt)}</p>
      </div>
    </motion.div>
  );
});

CommentItem.displayName = "CommentItem";

/* -------------------------------------------------------------------------- */
/*                            Background Component                            */
/* -------------------------------------------------------------------------- */

const DecorBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl"
    />
    <motion.div
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-600/10 blur-3xl"
    />
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  </div>
));

DecorBackground.displayName = "DecorBackground";

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostType, setNewPostType] = useState<string>("GENERAL");
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [privacySettings, setPrivacySettings] = useState<{
    allowComments: boolean;
  }>({ allowComments: true });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // ✅ Prevent multiple fetches

  // ✅ Only fetch once
  useEffect(() => {
    if (hasFetched) return;
    setHasFetched(true);
    fetchPosts();
    fetchPrivacySettings();
  }, [hasFetched]);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/community/posts");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrivacySettings() {
    try {
      const res = await fetch("/api/settings?category=privacy");
      if (res.ok) {
        const data = await res.json();
        setPrivacySettings({
          allowComments: data.allowComments !== undefined ? data.allowComments : true,
        });
      }
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
    }
  }

  // ✅ Refresh function that resets hasFetched
  const refreshPosts = useCallback(() => {
    setHasFetched(false);
  }, []);

  const handleCreatePost = useCallback(async (e: React.FormEvent) => {
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
        toast.success("Post shared!");
        setNewPost("");
        setNewPostImage(null);
        setNewPostType("GENERAL");
        refreshPosts(); // ✅ Refetch after posting
      } else {
        toast.error("Failed to post");
      }
    } catch (error) {
      toast.error("Failed to post");
    }
    setPosting(false);
  }, [newPost, newPostImage, newPostType, refreshPosts]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.liked) {
          setLikedPosts((prev) => new Set(prev).add(postId));
        } else {
          setLikedPosts((prev) => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
        }
        refreshPosts(); // ✅ Refetch after like
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  }, [refreshPosts]);

  const handleComment = useCallback(async (postId: string) => {
    if (!privacySettings.allowComments) {
      toast.error("Comments are disabled for this post");
      return;
    }

    if (!commentText.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      const res = await fetch("/api/community/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: commentText,
        }),
      });

      if (res.ok) {
        toast.success("Comment added!");
        setCommentText("");
        setCommenting(null);
        refreshPosts(); // ✅ Refetch after comment
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  }, [commentText, privacySettings.allowComments, refreshPosts]);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/community/posts?id=${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Post deleted");
        refreshPosts(); // ✅ Refetch after delete
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  }, [refreshPosts]);

  const handleEditPost = useCallback(async (postId: string) => {
    if (!editContent.trim()) {
      toast.error("Please enter some content");
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
        refreshPosts(); // ✅ Refetch after edit
      } else {
        toast.error("Failed to update post");
      }
    } catch (error) {
      console.error("Error editing post:", error);
      toast.error("Failed to update post");
    }
  }, [editContent, refreshPosts]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPostImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const filteredPosts = useMemo(() => {
    return filterType === "ALL" ? posts : posts.filter((post) => post.type === filterType);
  }, [posts, filterType]);

  const totalPosts = posts.length;
  const totalComments = useMemo(
    () => posts.reduce((acc, p) => acc + (p._count?.comments || 0), 0),
    [posts]
  );
  const myPosts = useMemo(
    () => posts.filter((p) => p.userId === session?.user?.id).length,
    [posts, session?.user?.id]
  );

  const canComment = privacySettings.allowComments || false;

  // ✅ Trigger refetch when hasFetched becomes false
  useEffect(() => {
    if (!hasFetched && !loading) {
      fetchPosts();
      setHasFetched(true);
    }
  }, [hasFetched, loading]);

  if (loading) {
    return (
      <>
        <DecorBackground />
        <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
          <div>
            <Skeleton variant="text" className="h-8 w-48" />
            <Skeleton variant="text" className="mt-1 h-4 w-64" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <Skeleton variant="text" className="h-20 w-full" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton variant="text" className="h-4 w-24" />
              <Skeleton variant="text" className="h-8 w-16" />
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <SkeletonCommunityPost key={i} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      <DecorBackground />

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Post preview"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl space-y-5 will-change-transform sm:space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Users className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">💬 Community Feed</h1>
              <p className="mt-1 text-gray-400">Share updates, celebrate achievements, and connect with players</p>
            </div>
          </div>
        </motion.div>

        {/* Engagement Stats */}
        <motion.div variants={containerVariants} className="grid grid-cols-3 gap-3">
          <StatChip icon={MessageSquare} label="Posts" value={totalPosts} accent="text-indigo-400" />
          <StatChip icon={MessageCircle} label="Comments" value={totalComments} accent="text-purple-400" />
          <StatChip icon={Sparkles} label="Your Posts" value={myPosts} accent="text-pink-400" />
        </motion.div>

        {/* Privacy Warning */}
        {!privacySettings.allowComments && (
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <EyeOff className="mt-0.5 h-5 w-5 text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-400">Comments are Disabled</h3>
                <p className="text-sm text-gray-300">
                  Comments on your posts are currently disabled. You can change
                  this in your
                  <a
                    href="/dashboard/settings/privacy"
                    className="ml-1 text-indigo-400 hover:underline"
                  >
                    Privacy Settings
                  </a>
                  .
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Post */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl"
        >
          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex gap-3">
              <span className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white sm:flex">
                {(session?.user?.name?.charAt(0) || "Y").toUpperCase()}
              </span>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share something with the community..."
                rows={3}
                maxLength={1000}
                className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white placeholder-gray-500 transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <AnimatePresence>
              {newPostImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative inline-block"
                >
                  <img
                    src={newPostImage}
                    alt="Preview"
                    className="h-28 w-auto rounded-xl ring-1 ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPostImage(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-lg transition hover:bg-red-600"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-gray-900/40 px-3 text-gray-400 transition-colors hover:text-white">
                <ImageIcon size={20} />
                <span className="text-sm">Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <select
                value={newPostType}
                onChange={(e) => setNewPostType(e.target.value)}
                className="min-h-[44px] rounded-xl border border-white/10 bg-gray-900/60 px-3 py-1.5 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="GENERAL">General</option>
                <option value="SQUAD_SHARE">Squad Share</option>
                <option value="ACHIEVEMENT">Achievement</option>
              </select>

              <span className="text-xs text-gray-500">{newPost.length}/1000</span>

              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Post
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Category Filter */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`min-h-[44px] rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filterType === tab.key
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "border border-white/10 bg-white/5 text-gray-400 backdrop-blur-xl hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              title="No Posts Yet"
              message="Be the first to share something with the community!"
              icon={MessageCircle}
              buttonText={session ? "Create Post" : "Sign In to Post"}
              buttonLink={session ? "/dashboard/community" : "/auth/signin"}
            />
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => {
              const username = post.user.profile?.username || post.user.name || "Player";
              const isLiked = likedPosts.has(post.id);
              const isOwnPost = post.userId === session?.user?.id;
              const typeCfg = postTypeConfig[post.type] || {
                label: post.type.replace("_", " "),
                badge: "bg-gray-500/15 text-gray-300 ring-gray-500/30",
                icon: MessageCircle,
              };
              const TypeIcon = typeCfg.icon;

              return (
                <motion.div
                  key={post.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="border-b border-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white ring-2 ring-white/10">
                          {username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{username}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-gray-500">{relativeTime(post.createdAt)}</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${typeCfg.badge}`}>
                              <TypeIcon className="h-3 w-3" />
                              {typeCfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isOwnPost && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingPost(post.id);
                              setEditContent(post.content);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-blue-500/10 hover:text-blue-400"
                            aria-label="Edit post"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                            aria-label="Delete post"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {editingPost === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-3 text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-sm font-medium text-white transition hover:shadow-lg hover:shadow-indigo-500/30"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPost(null)}
                            className="rounded-lg border border-white/10 bg-gray-700/40 px-4 py-1.5 text-sm text-white transition hover:bg-gray-600/40"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-gray-200">{post.content}</p>
                        {post.image && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(post.image)}
                            className="mt-3 block w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition hover:ring-indigo-500/40"
                          >
                            <Image
                              src={post.image}
                              alt="Post"
                              width={600}
                              height={400}
                              className="max-h-96 w-full object-contain"
                              loading="lazy"
                            />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-b border-white/5 px-4 pb-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLike(post.id)}
                      className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                        isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                      }`}
                    >
                      <motion.span
                        key={isLiked ? "liked" : "unliked"}
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                      </motion.span>
                      <span>{post.likes} likes</span>
                    </motion.button>
                    <button
                      onClick={() => {
                        if (!privacySettings.allowComments) {
                          toast.error("Comments are disabled for this post");
                          return;
                        }
                        setCommenting(commenting === post.id ? null : post.id);
                      }}
                      className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                        privacySettings.allowComments
                          ? "text-gray-400 hover:text-indigo-400"
                          : "cursor-not-allowed text-gray-600"
                      }`}
                    >
                      <MessageCircle size={18} />
                      <span>{post._count.comments} comments</span>
                    </button>
                    <button className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm text-gray-400 transition-colors hover:text-yellow-400">
                      <Flag size={16} />
                      <span>Report</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {commenting === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-gray-900/40 p-4"
                      >
                        {canComment ? (
                          <div className="mb-3 flex gap-2">
                            <span className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white sm:flex">
                              {(session?.user?.name?.charAt(0) || "Y").toUpperCase()}
                            </span>
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a comment..."
                              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-gray-900/60 p-2 px-3 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 text-white transition hover:shadow-lg hover:shadow-indigo-500/30"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 py-2 text-center text-sm text-gray-400">
                            <EyeOff size={16} />
                            Comments are disabled
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {post.comments.length > 0 && (
                    <div className="space-y-3 bg-gray-900/20 p-4">
                      {post.comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}