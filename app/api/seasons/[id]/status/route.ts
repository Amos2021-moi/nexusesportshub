import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Valid status transitions
const statusFlow: Record<string, string[]> = {
  PRESEASON: ["REGISTRATION"],
  REGISTRATION: ["FIXTURE_LOCK"],
  FIXTURE_LOCK: ["LIVE"],
  LIVE: ["ENDED"],
  ENDED: ["ARCHIVED"],
  ARCHIVED: [],
}

// Helper to check admin access
async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error("Unauthorized: Please login")
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required")
  }
  return session
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin()

    const { id } = await params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ["PRESEASON", "REGISTRATION", "FIXTURE_LOCK", "LIVE", "ENDED", "ARCHIVED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      )
    }

    // Get current season
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        fixtures: true,
        leagueEntries: true,
      },
    })

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 })
    }

    // Check if transition is allowed
    const allowedNext = statusFlow[season.status] || []
    if (!allowedNext.includes(status) && season.status !== status) {
      return NextResponse.json(
        { error: `Cannot transition from ${season.status} to ${status}` },
        { status: 400 }
      )
    }

    // Execute side effects based on new status
    if (status === "FIXTURE_LOCK") {
      // Lock all fixtures - prevent edits
      await prisma.fixture.updateMany({
        where: { seasonId: id },
        data: { status: "LOCKED" },
      })
    }

    if (status === "LIVE") {
      // Activate this season, deactivate others
      await prisma.season.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
      await prisma.season.update({
        where: { id },
        data: { isActive: true },
      })
    }

    if (status === "ENDED") {
      // Finalize standings and create champion in Hall of Fame
      const champion = await prisma.leagueEntry.findFirst({
        where: { seasonId: id },
        orderBy: [
          { points: "desc" },
          { goalDifference: "desc" },
          { goalsFor: "desc" },
        ],
        include: { player: true },
      })

      if (champion) {
        await prisma.hallOfFame.create({
          data: {
            playerId: champion.playerId,
            seasonId: id,
            category: "Champion",
            reason: `Season ${season.name} Champion with ${champion.points} points`,
          },
        })
      }
    }

    if (status === "ARCHIVED") {
      // Make season inactive
      await prisma.season.update({
        where: { id },
        data: { isActive: false },
      })
    }

    // Update season status
    const updated = await prisma.season.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      season: updated,
      message: `Season status updated to ${status}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status"
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}