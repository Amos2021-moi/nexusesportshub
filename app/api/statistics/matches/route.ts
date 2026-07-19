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
    const limit = parseInt(searchParams.get("limit") || "10")

    const userId = session.user.id

    // Get fixtures where user is involved
    const fixtures = await prisma.fixture.findMany({
      where: {
        seasonId: seasonId || undefined,
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ]
      },
      include: {
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        },
        result: true,
        season: true
      },
      orderBy: { scheduledDate: 'desc' },
      take: limit
    })

    // Format match history
    const matchHistory = fixtures.map(fixture => {
      const isHome = fixture.homePlayerId === userId
      const opponent = isHome ? fixture.awayPlayer : fixture.homePlayer
      const opponentName = opponent?.profile?.username || opponent?.name || "Unknown"

      let result = "SCHEDULED"
      let score = null
      let myScore = null
      let opponentScore = null

      if (fixture.result) {
        const homeScore = fixture.result.homeScore
        const awayScore = fixture.result.awayScore
        myScore = isHome ? homeScore : awayScore
        opponentScore = isHome ? awayScore : homeScore
        
        if (fixture.result.approved) {
          if (myScore > opponentScore) result = "WIN"
          else if (myScore < opponentScore) result = "LOSS"
          else result = "DRAW"
        } else {
          result = "PENDING"
        }
        score = `${homeScore} - ${awayScore}`
      }

      return {
        id: fixture.id,
        opponentName,
        opponentId: opponent?.id,
        isHome,
        scheduledDate: fixture.scheduledDate,
        status: fixture.status,
        result,
        score,
        myScore,
        opponentScore,
        seasonName: fixture.season?.name,
        approved: fixture.result?.approved || false,
        submittedBy: fixture.result?.submittedBy || null
      }
    })

    // Get summary stats
    const completedMatches = matchHistory.filter(m => m.status === "COMPLETED" || m.result === "WIN" || m.result === "LOSS" || m.result === "DRAW")
    const wins = matchHistory.filter(m => m.result === "WIN").length
    const draws = matchHistory.filter(m => m.result === "DRAW").length
    const losses = matchHistory.filter(m => m.result === "LOSS").length
    const pending = matchHistory.filter(m => m.result === "PENDING").length

    // Get form (last 5 matches)
    const recentMatches = matchHistory.slice(0, 5)
    const form = recentMatches.map(m => {
      if (m.result === "WIN") return "W"
      if (m.result === "LOSS") return "L"
      if (m.result === "DRAW") return "D"
      return "-"
    }).join("")

    return NextResponse.json({
      matches: matchHistory,
      summary: {
        total: matchHistory.length,
        completed: completedMatches.length,
        wins,
        draws,
        losses,
        pending,
        winRate: matchHistory.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0
      },
      form
    })
  } catch (error) {
    console.error("Error fetching match history:", error)
    return NextResponse.json(
      { error: "Failed to fetch match history" },
      { status: 500 }
    )
  }
}