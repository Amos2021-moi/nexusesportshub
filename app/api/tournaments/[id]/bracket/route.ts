import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: { player: true }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Delete existing matches
    await prisma.tournamentMatch.deleteMany({
      where: { tournamentId: id }
    })

    const players = tournament.participants.map(p => p.playerId)
    
    if (players.length < 2) {
      return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 })
    }

    // Random seeding
    const shuffledPlayers = players.sort(() => Math.random() - 0.5)
    const numPlayers = shuffledPlayers.length
    const numRounds = Math.ceil(Math.log2(numPlayers))
    const numByes = Math.pow(2, numRounds) - numPlayers

    let matchCounter = 0
    let playerIndex = 0

    // ✅ First round matches (with byes)
    const firstRoundMatches = []
    
    // Bye matches (players get free pass)
    for (let i = 0; i < numByes; i++) {
      matchCounter++
      firstRoundMatches.push({
        round: 1,
        matchNumber: matchCounter,
        homePlayerId: shuffledPlayers[playerIndex] || null,
        awayPlayerId: null,
        status: "SCHEDULED",
      })
      playerIndex++
    }

    // Regular first round matches
    for (let i = playerIndex; i < shuffledPlayers.length; i += 2) {
      matchCounter++
      firstRoundMatches.push({
        round: 1,
        matchNumber: matchCounter,
        homePlayerId: shuffledPlayers[i] || null,
        awayPlayerId: shuffledPlayers[i + 1] || null,
        status: "SCHEDULED",
      })
    }

    // Create all matches
    const createdMatches = []
    for (const matchData of firstRoundMatches) {
      const match = await prisma.tournamentMatch.create({
        data: {
          tournamentId: id,
          round: matchData.round,
          matchNumber: matchData.matchNumber,
          bracket: "WINNERS",
          homePlayerId: matchData.homePlayerId,
          awayPlayerId: matchData.awayPlayerId,
          status: matchData.status,
          scheduledDate: new Date(),
        }
      })
      createdMatches.push(match)
    }

    // ✅ Create subsequent rounds and link them
    let nextMatchNumber = matchCounter + 1

    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round)
      const roundMatches = []
      
      for (let i = 0; i < matchesInRound; i++) {
        const match = await prisma.tournamentMatch.create({
          data: {
            tournamentId: id,
            round: round,
            matchNumber: nextMatchNumber + i,
            bracket: "WINNERS",
            homePlayerId: null,
            awayPlayerId: null,
            status: "SCHEDULED",
            scheduledDate: new Date(Date.now() + (round - 1) * 7 * 24 * 60 * 60 * 1000),
          }
        })
        roundMatches.push(match)
      }
      nextMatchNumber += matchesInRound
    }

    // ✅ LINK MATCHES: Connect each match to the next round
    const allMatches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
    })

    // Group by round
    const groupedByRound: { [key: number]: any[] } = {}
    allMatches.forEach(m => {
      if (!groupedByRound[m.round]) groupedByRound[m.round] = []
      groupedByRound[m.round].push(m)
    })

    // Link round 1 to round 2, round 2 to round 3, etc.
    for (let round = 1; round < numRounds; round++) {
      const currentRound = groupedByRound[round] || []
      const nextRound = groupedByRound[round + 1] || []
      
      for (let i = 0; i < currentRound.length; i += 2) {
        const nextIndex = Math.floor(i / 2)
        if (nextRound[nextIndex]) {
          // Link both matches to the same next match
          await prisma.tournamentMatch.update({
            where: { id: currentRound[i].id },
            data: { nextMatchId: nextRound[nextIndex].id }
          })
          if (currentRound[i + 1]) {
            await prisma.tournamentMatch.update({
              where: { id: currentRound[i + 1].id },
              data: { nextMatchId: nextRound[nextIndex].id }
            })
          }
        }
      }
    }

    await prisma.tournament.update({
      where: { id },
      data: { status: "ACTIVE" }
    })

    const finalMatches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
    })

    return NextResponse.json({
      success: true,
      message: `Bracket generated with ${finalMatches.length} matches`,
      matches: finalMatches
    })

  } catch (error) {
    console.error("Error generating bracket:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate bracket" },
      { status: 500 }
    )
  }
}