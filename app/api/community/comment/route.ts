import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper: Get moderation settings
async function getModerationSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      category: "moderation"
    }
  })

  const result: Record<string, any> = {
    postApproval: false,
    commentFiltering: true,
    squadApproval: false,
    playerReports: true,
    autoBanThreshold: 5,
    requireVerification: false,
    allowGuestReporting: true
  }

  settings.forEach(s => {
    if (s.key in result) {
      result[s.key] = JSON.parse(s.value)
    }
  })

  return result
}

// ✅ Simple profanity filter (can be expanded)
function containsProfanity(text: string): boolean {
  const profanityList = ['badword1', 'badword2', 'curse'] // Add your list
  const lowerText = text.toLowerCase()
  return profanityList.some(word => lowerText.includes(word))
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Get moderation settings
    const moderation = await getModerationSettings()

    const { postId, content } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // ✅ Check if comment filtering is enabled
    if (moderation.commentFiltering) {
      // Check for profanity
      if (containsProfanity(content)) {
        return NextResponse.json({ 
          error: "Comment contains inappropriate language. Please keep it clean." 
        }, { status: 403 })
      }
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { username: true }
            }
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: session.user.id,
        content: content.trim()
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    // Send notification to post owner (if not the commenter)
    if (post.userId !== session.user.id) {
      const commenterName = session.user.name || "Someone"

      await prisma.notification.create({
        data: {
          userId: post.userId,
          title: "💬 New Comment",
          message: `${commenterName} commented on your post: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
          type: "COMMENT",
          link: `/dashboard/community`
        }
      })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    )
  }
}