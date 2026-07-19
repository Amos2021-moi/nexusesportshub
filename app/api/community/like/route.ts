import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id
          }
        }
      })

      await prisma.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          userId: session.user.id
        }
      })

      await prisma.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } }
      })

      // ✅ Send notification to post owner (if not the liker)
      if (post.userId !== session.user.id) {
        const likerName = session.user.name || "Someone"
        
        await prisma.notification.create({
          data: {
            userId: post.userId,
            title: "❤️ New Like",
            message: `${likerName} liked your post`,
            type: "LIKE",
            link: `/dashboard/community`
          }
        })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    )
  }
}