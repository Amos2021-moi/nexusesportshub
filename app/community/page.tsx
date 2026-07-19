"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Heart, MessageCircle, Send, Image as ImageIcon, X, Trophy, Shield, Calendar, Trash2, Edit2, Flag, Pin, Filter, Users, ArrowRight } from "lucide-react"
import toast from "react-hot-toast"
import { SkeletonCommunityPost, Skeleton } from "@/components/ui/Skeleton"
import Image from "next/image"
interface Post {
  id: string
  content: string
  image: string | null
  type: string
  likes: number
  createdAt: string
  userId: string
  user: {
    name: string
    profile: { username: string } | null
  }
  comments: Comment[]
  _count: { comments: number }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    name: string
    profile: { username: string } | null
  }
}

export default function CommunityPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("ALL")
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch("/api/community/posts")
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(postId: string) {
    const res = await fetch("/api/community/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    })

    if (res.ok) {
      const data = await res.json()
      if (data.liked) {
        setLikedPosts(prev => new Set(prev).add(postId))
      } else {
        setLikedPosts(prev => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
      }
      fetchPosts()
    }
  }

  const filteredPosts = filterType === "ALL" 
    ? posts 
    : posts.filter(post => post.type === filterType)

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div>
          <Skeleton variant="text" className="w-48 h-8" />
          <Skeleton variant="text" className="w-64 h-4 mt-1" />
        </div>
        {[...Array(3)].map((_, i) => (
          <SkeletonCommunityPost key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="h-7 w-7 text-indigo-400" />
          Community Feed
        </h1>
        <p className="text-gray-400 mt-1">Share updates, celebrate achievements, and connect with players</p>
      </div>

      {/* Auth CTA */}
      {!session && (
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-4 text-center">
          <p className="text-gray-300 text-sm mb-3">
            Sign in to join the conversation and share your own posts!
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-all"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterType === "ALL" 
              ? "bg-indigo-600 text-white" 
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType("GENERAL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterType === "GENERAL" 
              ? "bg-indigo-600 text-white" 
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setFilterType("SQUAD_SHARE")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterType === "SQUAD_SHARE" 
              ? "bg-indigo-600 text-white" 
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          Squad Shares
        </button>
        <button
          onClick={() => setFilterType("ACHIEVEMENT")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterType === "ACHIEVEMENT" 
              ? "bg-indigo-600 text-white" 
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
        >
          Achievements
        </button>
      </div>

      {/* Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
          <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Posts Yet</h3>
          <p className="text-gray-400">
            {session ? "Be the first to share something with the community!" : "Sign in to see community posts!"}
          </p>
        </div>
      ) : (
        filteredPosts.map((post) => {
          const username = post.user?.profile?.username || post.user?.name || "Player"
          const isLiked = likedPosts.has(post.id)
          const postTypeColors = {
            GENERAL: "bg-blue-500/20 text-blue-400",
            SQUAD_SHARE: "bg-purple-500/20 text-purple-400",
            ACHIEVEMENT: "bg-yellow-500/20 text-yellow-400"
          }

          return (
            <div key={post.id} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{username}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${postTypeColors[post.type as keyof typeof postTypeColors] || "bg-gray-500/20 text-gray-400"}`}>
                          {post.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                {post.image && (
<Image
  src={post.image}
  alt="Post"
  width={600}
  height={400}
  className="mt-3 rounded-lg max-h-96 w-full object-contain"
  loading="lazy"
/>                )}
              </div>

              {/* Post Actions */}
              <div className="px-4 pb-3 flex flex-wrap gap-4 border-b border-gray-700">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  }`}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  <span>{post.likes} likes</span>
                </button>
                <button
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <MessageCircle size={18} />
                  <span>{post._count?.comments || 0} comments</span>
                </button>
              </div>

              {/* Comments */}
              {post.comments && post.comments.length > 0 && (
                <div className="p-4 space-y-3 bg-gray-700/20">
                  {post.comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                        {(comment.user?.profile?.username?.charAt(0) || comment.user?.name?.charAt(0) || "U").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold text-white">
                            {comment.user?.profile?.username || comment.user?.name || "Player"}
                          </span>
                          <span className="text-gray-300 ml-2">{comment.content}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {post._count?.comments > 3 && (
                    <p className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      View all {post._count.comments} comments
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}