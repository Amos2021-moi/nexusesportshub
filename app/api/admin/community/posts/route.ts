import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ GET: Fetch all posts for moderation
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const posts = await prisma.post.findMany({
      include: {
        user: {
          include: { profile: true }
        },
        _count: {
          select: { comments: true, likes_rel: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format the response
    const formattedPosts = posts.map(post => ({
      ...post,
      _count: {
        comments: post._count.comments,
        likes: post._count.likes_rel
      }
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

// ✅ PUT: Approve or reject a post
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, action } = await request.json()

    if (!postId || !action) {
      return NextResponse.json({ error: "Post ID and action required" }, { status: 400 })
    }

    if (action === "approve") {
      await prisma.post.update({
        where: { id: postId },
        data: { status: "APPROVED" }
      })
      
      // Notify the author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true }
      })
      
      if (post) {
        await prisma.notification.create({
          data: {
            userId: post.userId,
            title: "✅ Your post was approved!",
            message: "Your community post has been approved and is now visible to everyone.",
            type: "MODERATION",
            link: "/dashboard/community"
          }
        })
      }
    } else if (action === "reject") {
      await prisma.post.update({
        where: { id: postId },
        data: { status: "REJECTED" }
      })
      
      // Notify the author
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true }
      })
      
      if (post) {
        await prisma.notification.create({
          data: {
            userId: post.userId,
            title: "❌ Your post was rejected",
            message: "Your community post was rejected. Please review the guidelines and try again.",
            type: "MODERATION",
            link: "/dashboard/community"
          }
        })
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}