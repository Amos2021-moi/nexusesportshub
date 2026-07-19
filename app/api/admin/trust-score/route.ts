import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // If userId provided, get specific user's trust score
    if (userId) {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: {
          trustScore: true,
          verifiedBadge: true,
          username: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (!profile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        trustScore: profile.trustScore,
        verifiedBadge: profile.verifiedBadge,
        username: profile.username,
        name: profile.user.name,
        email: profile.user.email
      })
    }

    // Get all users' trust scores (admin view)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profiles = await prisma.profile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { trustScore: 'desc' }
    })

    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Error fetching trust scores:", error)
    return NextResponse.json(
      { error: "Failed to fetch trust scores" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, trustScore } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (trustScore === undefined || trustScore < 0 || trustScore > 100) {
      return NextResponse.json(
        { error: "Trust score must be between 0 and 100" },
        { status: 400 }
      )
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: { trustScore }
    })

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_TRUST_SCORE",
        targetType: "PROFILE",
        targetId: profile.id,
        details: {
          userId,
          trustScore
        }
      }
    })

    return NextResponse.json({
      success: true,
      trustScore: profile.trustScore
    })
  } catch (error) {
    console.error("Error updating trust score:", error)
    return NextResponse.json(
      { error: "Failed to update trust score" },
      { status: 500 }
    )
  }
}