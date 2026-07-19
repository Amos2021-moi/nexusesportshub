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

    const userId = session.user.id

    // Get all opponents the user has played against
    const fixtures = await prisma.fixture.findMany({
      where: {
        seasonId: seasonId || undefined,
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ],
        status: "COMPLETED"
      },
      include: {
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        },
        result: true
      }
    })

    // Group by opponent
    const opponentStats: Record<string, {
      opponentId: string
      opponentName: string
      played: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      lastMatch: Date | null
      winRate: number
    }> = {}

    for (const fixture of fixtures) {
      const isHome = fixture.homePlayerId === userId
      const opponent = isHome ? fixture.awayPlayer : fixture.homePlayer
      const opponentId = opponent?.id

      if (!opponentId) continue

      if (!opponentStats[opponentId]) {
        opponentStats[opponentId] = {
          opponentId,
          opponentName: opponent?.profile?.username || opponent?.name || "Unknown",
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          lastMatch: null,
          winRate: 0
        }
      }

      const stats = opponentStats[opponentId]
      stats.played++

      if (fixture.result) {
        const myScore = isHome ? fixture.result.homeScore : fixture.result.awayScore
        const opponentScore = isHome ? fixture.result.awayScore : fixture.result.homeScore
        
        stats.goalsFor += myScore
        stats.goalsAgainst += opponentScore

        if (myScore > opponentScore) stats.wins++
        else if (myScore < opponentScore) stats.losses++
        else stats.draws++

        if (!stats.lastMatch || fixture.scheduledDate > stats.lastMatch) {
          stats.lastMatch = fixture.scheduledDate
        }
      }
    }

    // Calculate win rates and convert to array
    const opponentStatsArray = Object.values(opponentStats).map(stat => ({
      ...stat,
      winRate: stat.played > 0 ? Math.round((stat.wins / stat.played) * 100) : 0,
      goalDifference: stat.goalsFor - stat.goalsAgainst
    }))

    // Sort by most played
    opponentStatsArray.sort((a, b) => b.played - a.played)

    return NextResponse.json(opponentStatsArray)
  } catch (error) {
    console.error("Error fetching head-to-head stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch head-to-head stats" },
      { status: 500 }
    )
  }
}