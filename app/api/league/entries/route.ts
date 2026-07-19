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

    const entries = await prisma.leagueEntry.findMany({
      where: { seasonId },
      include: {
        player: {
          include: { profile: true }
        }
      },
      orderBy: { points: 'desc' }
    })

    // ✅ Return with no-cache headers
    return NextResponse.json(entries, {
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

    // Check if any fixtures exist for this player in the season
    const entry = await prisma.leagueEntry.findUnique({
      where: { id: entryId },
      include: {
        player: true
      }
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Check if player has any fixtures in this season
    const fixtures = await prisma.fixture.findFirst({
      where: {
        seasonId: entry.seasonId,
        OR: [
          { homePlayerId: entry.playerId },
          { awayPlayerId: entry.playerId }
        ]
      }
    })

    if (fixtures) {
      return NextResponse.json(
        { error: "Cannot remove player. They already have fixtures assigned." },
        { status: 400 }
      )
    }

    // Delete the league entry
    await prisma.leagueEntry.delete({
      where: { id: entryId }
    })

    // ✅ Return with no-cache headers
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