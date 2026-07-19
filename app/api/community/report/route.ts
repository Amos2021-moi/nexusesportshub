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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // ✅ Check if user is logged in (or guest reporting allowed)
    const moderation = await getModerationSettings()
    const isLoggedIn = !!session?.user?.id

    if (!isLoggedIn && !moderation.allowGuestReporting) {
      return NextResponse.json({ 
        error: "You must be logged in to report content" 
      }, { status: 401 })
    }

    // ✅ Check if player reports are enabled
    if (!moderation.playerReports) {
      return NextResponse.json({ 
        error: "Reporting is currently disabled by the admin" 
      }, { status: 403 })
    }

    const { postId, reason } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 })
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // ✅ Prevent reporting own post
    if (isLoggedIn && post.userId === session.user.id) {
      return NextResponse.json({ 
        error: "You cannot report your own post" 
      }, { status: 403 })
    }

    // ✅ Create report record
    const report = await prisma.report.create({
      data: {
        postId,
        reporterId: isLoggedIn ? session.user.id : null,
        reason: reason.trim(),
        status: "PENDING",
        reportedUserId: post.userId
      }
    })

    // ✅ Check if this user has reached auto-ban threshold
    const reports = await prisma.report.groupBy({
      by: ['reportedUserId'],
      where: {
        reportedUserId: post.userId,
        status: "PENDING"
      },
      _count: {
        id: true
      }
    })

    const reportCount = reports[0]?._count?.id || 0
    const autoBanThreshold = moderation.autoBanThreshold || 5

    // ✅ If threshold reached, auto-ban the user
    if (reportCount >= autoBanThreshold) {
      await prisma.user.update({
        where: { id: post.userId },
        data: {
          isVerified: false,
          // You could add a "banned" field or use a custom status
        }
      })

      // Notify admins about auto-ban
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      })

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: "🚫 Auto-Ban Triggered",
            message: `${post.user?.name || "A player"} was automatically banned after receiving ${reportCount} reports.`,
            type: "SYSTEM",
            link: `/admin/players`
          }))
        })
      }

      // Mark all pending reports as resolved
      await prisma.report.updateMany({
        where: {
          reportedUserId: post.userId,
          status: "PENDING"
        },
        data: {
          status: "RESOLVED"
        }
      })

      return NextResponse.json({
        success: true,
        message: `User has been automatically banned after ${reportCount} reports.`,
        autoBanned: true
      })
    }

    // ✅ Notify admins about new report (if not auto-banned)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: "🚨 New Content Report",
          message: `Post by ${post.user?.name || "Unknown"} has been reported. Reason: ${reason}`,
          type: "SYSTEM",
          link: `/admin/reports`
        }))
      })
    }

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: isLoggedIn ? session.user.id : "guest",
        action: "REPORT_POST",
        targetType: "POST",
        targetId: postId,
        details: {
          reason,
          postContent: post.content,
          postAuthor: post.user?.name,
          reportCount: reportCount + 1,
          threshold: autoBanThreshold,
          autoBanTriggered: false
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Post reported successfully. Admin will review it.",
      reportCount: reportCount + 1,
      threshold: autoBanThreshold,
      autoBanTriggered: false
    })
  } catch (error) {
    console.error("Error reporting post:", error)
    return NextResponse.json(
      { error: "Failed to report post" },
      { status: 500 }
    )
  }
}