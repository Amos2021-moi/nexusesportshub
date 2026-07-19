import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, verified } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // ✅ Check if admin user exists in database
    let adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // ✅ If admin doesn't exist, try to find by email or create
    if (!adminUser) {
      adminUser = await prisma.user.findUnique({
        where: { email: session.user.email || "" }
      })

      // ✅ If still not found, create the admin user
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || "admin@example.com",
            name: session.user.name || "Admin",
            role: "ADMIN"
          }
        })
      }
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user verification status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? session.user.id : null
      },
      include: {
        profile: true
      }
    })

    // Also update profile verifiedBadge
    if (user.profile) {
      await prisma.profile.update({
        where: { userId: userId },
        data: {
          verifiedBadge: verified
        }
      })
    }

    // ✅ Log to audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: verified ? "VERIFY_PLAYER" : "UNVERIFY_PLAYER",
          targetType: "USER",
          targetId: userId,
          details: {
            verified,
            verifiedBy: adminUser.id,
            targetEmail: targetUser.email,
            targetName: targetUser.name
          }
        }
      })
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError)
    }

    // Create notification for the player
    await prisma.notification.create({
      data: {
        userId: userId,
        title: verified ? "✅ You've been Verified!" : "❌ Verification Removed",
        message: verified 
          ? "Your account has been verified by an admin. You now have a verified badge!"
          : "Your verification has been removed by an admin.",
        type: "AWARD_EARNED",
        link: "/dashboard/profile"
      }
    })

    return NextResponse.json({
      success: true,
      message: verified ? "Player verified successfully" : "Player unverified",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    })
  } catch (error) {
    console.error("Error verifying player:", error)
    return NextResponse.json(
      { error: "Failed to verify player" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      const unverifiedPlayers = await prisma.user.findMany({
        where: {
          role: "PLAYER",
          isVerified: false
        },
        include: {
          profile: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(unverifiedPlayers)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      verifiedAt: user.verifiedAt,
      verifiedBy: user.verifiedBy,
      profile: user.profile
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    )
  }
}