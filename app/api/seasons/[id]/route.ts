import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

// ✅ Helper to check if season is frozen
async function checkSeasonFreeze(seasonId: string) {
  // Get league settings
  const freezeSetting = await prisma.setting.findFirst({
    where: {
      category: "league",
      key: "seasonFreeze"
    }
  })

  if (freezeSetting) {
    const isFrozen = JSON.parse(freezeSetting.value)
    if (isFrozen) {
      throw new Error("Season is frozen. No changes can be made.")
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        leagueEntries: {
          include: {
            player: {
              include: { profile: true }
            }
          },
          orderBy: { points: "desc" }
        },
        fixtures: true,
        awards: true,
      },
    })

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 })
    }

    return NextResponse.json(season)
  } catch (error) {
    console.error("Error fetching season:", error)
    return NextResponse.json(
      { error: "Failed to fetch season" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin()
    const { id } = await params

    // ✅ Check if season is frozen
    await checkSeasonFreeze(id)

    const body = await request.json()
    const { name, startDate, endDate, isActive, status } = body

    // Validate dates if provided
    let start, end
    if (startDate) {
      start = new Date(startDate)
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: "Invalid start date" }, { status: 400 })
      }
    }
    if (endDate) {
      end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return NextResponse.json({ error: "Invalid end date" }, { status: 400 })
      }
    }
    if (start && end && start >= end) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 })
    }

    const season = await prisma.season.update({
      where: { id },
      data: {
        name: name ?? undefined,
        startDate: start ?? undefined,
        endDate: end ?? undefined,
        isActive: isActive ?? undefined,
        status: status ?? undefined,
      },
    })

    return NextResponse.json(season)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update season"
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin()
    const { id } = await params

    // Check if season exists
    const season = await prisma.season.findUnique({ where: { id } })
    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 })
    }

    // ✅ Check if season is frozen
    await checkSeasonFreeze(id)

    // ✅ Delete related data in order (respecting foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // 1. Delete Hall of Fame entries first (has foreign key to Season)
      await tx.hallOfFame.deleteMany({
        where: { seasonId: id }
      })

      // 2. Delete awards (has foreign key to Season)
      await tx.award.deleteMany({
        where: { seasonId: id }
      })

      // 3. Delete season entries (has foreign key to Season)
      await tx.seasonEntry.deleteMany({
        where: { seasonId: id }
      })

      // 4. Delete league entries (has foreign key to Season)
      await tx.leagueEntry.deleteMany({
        where: { seasonId: id }
      })

      // 5. Delete fixtures (has foreign key to Season)
      await tx.fixture.deleteMany({
        where: { seasonId: id }
      })

      // 6. Delete prize pool (has unique foreign key to Season)
      await tx.prizePool.deleteMany({
        where: { seasonId: id }
      })

      // 7. Delete league settings (has unique foreign key to Season)
      await tx.leagueSettings.deleteMany({
        where: { seasonId: id }
      })

      // 8. Delete player season entries (has foreign key to Season)
      await tx.playerSeasonEntry.deleteMany({
        where: { seasonId: id }
      })

      // 9. Finally delete the season
      await tx.season.delete({
        where: { id }
      })
    })

    return NextResponse.json({ 
      success: true, 
      message: "Season and all related data deleted successfully" 
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete season"
    const status = message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500
    console.error("Delete season error:", error)
    return NextResponse.json({ error: message }, { status })
  }
}