import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")

    console.log('🔍 Champion Stats Request:', { tournamentId: id, playerId })

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 })
    }

    // ✅ Get all matches for the tournament where the player participated
    const matches = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId: id,
        OR: [
          { homePlayerId: playerId },
          { awayPlayerId: playerId }
        ],
        status: "COMPLETED"
      },
      include: {
        result: true
      }
    })

    console.log('✅ Found matches:', matches.length)

    // Calculate stats
    let wins = 0
    let losses = 0
    let goalsFor = 0
    let goalsAgainst = 0
    let matchesPlayed = matches.length

    for (const match of matches) {
      const isHome = match.homePlayerId === playerId
      const myScore = isHome ? match.result?.homeScore : match.result?.awayScore
      const opponentScore = isHome ? match.result?.awayScore : match.result?.homeScore

      console.log(`Match: isHome=${isHome}, myScore=${myScore}, oppScore=${opponentScore}`)

      if (myScore !== undefined && opponentScore !== undefined) {
        goalsFor += myScore
        goalsAgainst += opponentScore

        if (myScore > opponentScore) {
          wins++
        } else if (myScore < opponentScore) {
          losses++
        }
      }
    }

    const goalDifference = goalsFor - goalsAgainst
    const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0

    // ✅ Get awards for this player from Award table
    const awards = await prisma.award.findMany({
      where: {
        winnerId: playerId
      },
      select: { name: true }
    })

    const awardNames = awards.map(a => a.name)

    // ✅ Check if player is champion (winner of final match)
    const allTournamentMatches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: id }
    })
    
    const maxRound = Math.max(...allTournamentMatches.map(m => m.round))
    const finalMatch = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId: id,
        round: maxRound
      }
    })
    
    if (finalMatch?.winnerId === playerId) {
      awardNames.push("Champion")
    }

    const stats = {
      wins,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      winRate,
      matchesPlayed,
      awards: awardNames
    }

    console.log('✅ Champion Stats:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching champion stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch champion stats" },
      { status: 500 }
    )
  }
}