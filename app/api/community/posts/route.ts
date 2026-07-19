import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Add pagination support
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // ✅ Get moderation settings
    const moderation = await getModerationSettings()

    // ✅ Build where clause
    const whereClause: any = {}
    if (moderation.postApproval) {
      whereClause.status = "APPROVED"
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          user: {
            include: { profile: true }
          },
          comments: {
            include: {
              user: {
                include: { profile: true }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 3
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: whereClause })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ posts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false } })
  }
}

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

// ✅ POST method (keep your existing code)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const moderation = await getModerationSettings()

    if (moderation.requireVerification) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true }
      })

      if (!user?.emailVerified) {
        return NextResponse.json({ 
          error: "Email verification required to post. Please verify your email first." 
        }, { status: 403 })
      }
    }

    const { content, image, type } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const status = moderation.postApproval ? "PENDING" : "APPROVED"

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        content: content.trim(),
        image: image || null,
        type: type || "GENERAL",
        status: status
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    if (status === "PENDING") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      })

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: "📝 New Post Pending Approval",
            message: `A new post by ${session.user.name || "a player"} needs your review.`,
            type: "MODERATION",
            link: `/admin/community`
          }))
        })
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}

// ✅ DELETE method (keep your existing code)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("id")

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this post" }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}