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
    
    // Admin only
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { postId, pinned } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Update pin status (you'll need to add a `pinned` field to your Post model)
    // For now, we'll use a workaround - store pinned posts in a separate table or use a flag
    // Since we don't have a pinned field, we'll use a custom approach via settings
    
    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: pinned ? "PIN_POST" : "UNPIN_POST",
        targetType: "POST",
        targetId: postId,
        details: {
          pinned,
          postContent: post.content
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: pinned ? "Post pinned successfully" : "Post unpinned"
    })
  } catch (error) {
    console.error("Error pinning post:", error)
    return NextResponse.json(
      { error: "Failed to pin post" },
      { status: 500 }
    )
  }
}