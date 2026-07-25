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
    const seasonId = searchParams.get("seasonId")

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    // ✅ Get ALL SeasonEntry records for this season
    const seasonEntries = await prisma.seasonEntry.findMany({
      where: { 
        seasonId,
      },
      include: {
        user: {
          include: { 
            profile: true 
          }
        },
        leagueEntry: true, // Include the league entry (stats)
      },
    })

    // ✅ If no season entries, return empty array
    if (seasonEntries.length === 0) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

    // ✅ Transform to match the expected format
    const transformedEntries = seasonEntries.map(se => {
      // ✅ If LeagueEntry exists, use it. Otherwise create a default one
      const leagueEntry = se.leagueEntry || {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      }

      return {
        id: se.leagueEntry?.id || se.id,
        playerId: se.userId,
        player: {
          id: se.user.id,
          name: se.user.name || se.user.email || "Unknown",
          email: se.user.email,
          profile: se.user.profile,
          role: se.user.role,
        },
        played: leagueEntry.played || 0,
        wins: leagueEntry.wins || 0,
        draws: leagueEntry.draws || 0,
        losses: leagueEntry.losses || 0,
        points: leagueEntry.points || 0,
        goalsFor: leagueEntry.goalsFor || 0,
        goalsAgainst: leagueEntry.goalsAgainst || 0,
        goalDifference: leagueEntry.goalDifference || 0,
        seasonEntryId: se.id,
        status: se.status,
        hasLeagueEntry: !!se.leagueEntry, // ✅ Track if LeagueEntry exists
      }
    })

    // ✅ Sort by points descending
    transformedEntries.sort((a, b) => b.points - a.points || b.wins - a.wins)

    console.log(`📊 Found ${transformedEntries.length} entries for season ${seasonId}`)
    console.log(`📋 Entries:`, transformedEntries.map(e => ({ name: e.player.name, hasLeagueEntry: e.hasLeagueEntry })))

    // ✅ Return with no-cache headers
    return NextResponse.json(transformedEntries, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching league entries:", error)
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { entryId } = await request.json()

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    // ✅ Find the season entry first
    const seasonEntry = await prisma.seasonEntry.findFirst({
      where: {
        OR: [
          { id: entryId },
          { leagueEntry: { id: entryId } }
        ]
      },
      include: {
        user: true,
        leagueEntry: true
      }
    })

    if (!seasonEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Check if player has any fixtures in this season
    const fixtures = await prisma.fixture.findFirst({
      where: {
        seasonId: seasonEntry.seasonId,
        OR: [
          { homePlayerId: seasonEntry.userId },
          { awayPlayerId: seasonEntry.userId }
        ]
      }
    })

    if (fixtures) {
      return NextResponse.json(
        { error: "Cannot remove player. They already have fixtures assigned." },
        { status: 400 }
      )
    }

    // ✅ Delete both league entry and season entry in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete league entry if it exists
      if (seasonEntry.leagueEntry) {
        await tx.leagueEntry.delete({
          where: { id: seasonEntry.leagueEntry.id }
        })
      }
      
      // Delete season entry
      await tx.seasonEntry.delete({
        where: { id: seasonEntry.id }
      })
    })

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error deleting league entry:", error)
    return NextResponse.json(
      { error: "Failed to remove player" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}