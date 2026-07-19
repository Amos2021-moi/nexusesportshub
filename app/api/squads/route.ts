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

// ✅ GET handler
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Get moderation settings
    const moderation = await getModerationSettings()

    // ✅ If squad approval is enabled, only show approved squads
    const whereClause: any = { userId: session.user.id }
    
    if (moderation.squadApproval) {
      whereClause.status = "APPROVED"
    }

    const squads = await prisma.squad.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(squads)
  } catch (error: unknown) {
    console.error("Error fetching squads:", error)
    return NextResponse.json([], { status: 200 })
  }
}

// ✅ POST handler
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    // ✅ Get moderation settings
    const moderation = await getModerationSettings()

    // Check if user exists, if not create profile
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email || "user@example.com",
          name: session.user.name || "User",
          role: "PLAYER",
        }
      })

      // Also create profile
      await prisma.profile.create({
        data: {
          userId: user.id,
          username: session.user.email?.split('@')[0] || `player_${Date.now()}`,
        }
      })
    }

    const body = await request.json()
    const { type, screenshot, formation, teamStrength, playstyle, description } = body

    if (!screenshot) {
      return NextResponse.json({ error: "Screenshot is required" }, { status: 400 })
    }
    if (!formation) {
      return NextResponse.json({ error: "Formation is required" }, { status: 400 })
    }

    let strength = parseInt(teamStrength) || 0
    if (strength < 1000) strength = 1000
    if (strength > 4000) strength = 4000

    // ✅ Determine squad status based on squad approval setting
    const status = moderation.squadApproval ? "PENDING" : "APPROVED"

    const squad = await prisma.squad.create({
      data: {
        userId: user.id,
        type: type || "MAIN",
        screenshot,
        formation,
        teamStrength: strength,
        playstyle: playstyle || "",
        description: description || "",
        isActive: false,
        status: status,
      },
    })

    // ✅ If squad is pending approval, notify admins
    if (status === "PENDING") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true }
      })

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: "🛡️ New Squad Pending Approval",
            message: `A new squad by ${session.user.name || "a player"} needs your review.`,
            type: "MODERATION",
            link: `/admin/squads`
          }))
        })
      }
    }

    return NextResponse.json(squad, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating squad:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to create squad"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// ✅ DELETE handler
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Squad ID required" }, { status: 400 })
    }

    const squad = await prisma.squad.findUnique({
      where: { id }
    })

    if (!squad) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 })
    }

    if (squad.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.squad.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting squad:", error)
    return NextResponse.json(
      { error: "Failed to delete squad" },
      { status: 500 }
    )
  }
}