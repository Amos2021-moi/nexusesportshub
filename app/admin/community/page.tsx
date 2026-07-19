"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  CheckCircle, XCircle, Eye, MessageCircle, Users, 
  Clock, AlertCircle, Loader2, RefreshCw 
} from "lucide-react"
import toast from "react-hot-toast"

interface Post {
  id: string
  content: string
  image: string | null
  type: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    profile: { username: string } | null
  }
  _count: {
    comments: number
    likes: number
  }
}

export default function AdminCommunityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchPosts()
  }, [session, status, router])

  async function fetchPosts() {
    try {
      const res = await fetch("/api/admin/community/posts")
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(postId: string) {
    setProcessing(postId)
    try {
      const res = await fetch("/api/admin/community/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action: "approve" })
      })

      if (res.ok) {
        toast.success("Post approved!")
        fetchPosts()
      } else {
        toast.error("Failed to approve")
      }
    } catch (error) {
      toast.error("Failed to approve")
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(postId: string) {
    setProcessing(postId)
    try {
      const res = await fetch("/api/admin/community/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action: "reject" })
      })

      if (res.ok) {
        toast.success("Post rejected")
        fetchPosts()
      } else {
        toast.error("Failed to reject")
      }
    } catch (error) {
      toast.error("Failed to reject")
    } finally {
      setProcessing(null)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true
    return post.status === filter.toUpperCase()
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>
      case "APPROVED":
        return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Approved</span>
      case "REJECTED":
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Rejected</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-indigo-400" />
            Community Moderation
          </h1>
          <p className="text-gray-400 text-sm">Review and manage community posts</p>
        </div>
        <button
          onClick={fetchPosts}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {posts.filter(p => p.status === "PENDING").length}
          </p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-green-400">
            {posts.filter(p => p.status === "APPROVED").length}
          </p>
          <p className="text-xs text-gray-400">Approved</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700 text-center">
          <p className="text-2xl font-bold text-red-400">
            {posts.filter(p => p.status === "REJECTED").length}
          </p>
          <p className="text-xs text-gray-400">Rejected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-gray-700/50 text-gray-400 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
          <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Posts</h3>
          <p className="text-gray-400">No posts found for the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {(post.user?.profile?.username || post.user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {post.user?.profile?.username || post.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-2">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{post.content}</p>
                  {post.image && (
                    <div className="mt-2">
                      <img src={post.image} alt="Post" className="max-h-48 rounded-lg" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>❤️ {post._count.likes} likes</span>
                    <span>💬 {post._count.comments} comments</span>
                  </div>
                </div>
                {post.status === "PENDING" && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(post.id)}
                      disabled={processing === post.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {processing === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      disabled={processing === post.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {processing === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}