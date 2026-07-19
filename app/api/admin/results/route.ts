import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper to check if result modifications are allowed
async function checkResultModificationAllowed(seasonId: string) {
  // Check if season is frozen
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

  // Check if fixture lock is enabled
  const lockSetting = await prisma.setting.findFirst({
    where: {
      category: "league",
      key: "fixtureLock"
    }
  })

  if (lockSetting) {
    const isLocked = JSON.parse(lockSetting.value)
    if (isLocked) {
      throw new Error("Fixtures are locked. No results can be modified.")
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all results
    const results = await prisma.result.findMany({
      include: {
        fixture: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } }
          }
        },
        user: { include: { profile: true } },
        tournamentMatch: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
            tournament: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json([])
  }
}

// ✅ POST: Approve result with freeze/lock checks
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { resultId, action } = body // action: "approve" or "reject"

    if (!resultId || !action) {
      return NextResponse.json(
        { error: "Result ID and action are required" },
        { status: 400 }
      )
    }

    // Get the result with related data
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        fixture: {
          include: {
            season: true
          }
        },
        tournamentMatch: {
          include: {
            tournament: true
          }
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Determine season ID
    let seasonId: string | null = null
    if (result.fixture) {
      seasonId = result.fixture.seasonId
    } else if (result.tournamentMatch) {
      // For tournament results, check if there's a season
      const tournament = await prisma.tournament.findUnique({
        where: { id: result.tournamentMatch.tournamentId },
        include: { season: true }
      })
      if (tournament?.seasonId) {
        seasonId = tournament.seasonId
      }
    }

    // ✅ Check if modifications are allowed (only for league results)
    if (seasonId && result.source === "LEAGUE") {
      await checkResultModificationAllowed(seasonId)
    }

    // Handle approve or reject
    if (action === "approve") {
      // Use the existing approve function from result.service
      // For now, just update the result
      await prisma.result.update({
        where: { id: resultId },
        data: { approved: true }
      })

      // If it's a league result, update fixture status
      if (result.fixtureId) {
        await prisma.fixture.update({
          where: { id: result.fixtureId },
          data: {
            status: "COMPLETED",
            approvedBy: session.user.id,
            approvedAt: new Date()
          }
        })

        // Update league entries (standings)
        // This would be handled by the result.service
      }

      return NextResponse.json({ success: true, message: "Result approved" })
    } 
    else if (action === "reject") {
      // Delete the result
      await prisma.result.delete({
        where: { id: resultId }
      })

      // Reset fixture status
      if (result.fixtureId) {
        await prisma.fixture.update({
          where: { id: result.fixtureId },
          data: {
            status: "SCHEDULED",
            homeScore: null,
            awayScore: null,
            submittedBy: null,
            submittedAt: null
          }
        })
      }

      return NextResponse.json({ success: true, message: "Result rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process result"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}