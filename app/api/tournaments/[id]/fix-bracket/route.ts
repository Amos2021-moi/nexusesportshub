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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Get tournament with matches
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    const matches = tournament.matches

    if (matches.length === 0) {
      return NextResponse.json({ error: "No matches found" }, { status: 400 })
    }

    console.log('🔍 Found matches:', matches.map(m => ({
      id: m.id,
      round: m.round,
      matchNumber: m.matchNumber,
      homePlayerId: m.homePlayerId,
      awayPlayerId: m.awayPlayerId,
      winnerId: m.winnerId,
      status: m.status
    })))

    // Get max round
    const maxRound = Math.max(...matches.map(m => m.round))
    console.log('🔍 Max Round:', maxRound)

    // Group matches by round
    const matchesByRound: { [key: number]: any[] } = {}
    matches.forEach(m => {
      if (!matchesByRound[m.round]) matchesByRound[m.round] = []
      matchesByRound[m.round].push(m)
    })

    console.log('🔍 Matches by round:', Object.keys(matchesByRound).map(r => ({
      round: r,
      count: matchesByRound[Number(r)].length
    })))

    let linkedCount = 0
    let advancedCount = 0
    let fixedMatches = 0

    // ✅ LINK MATCHES: For each round, link to next round
    for (let round = 1; round < maxRound; round++) {
      const currentRoundMatches = matchesByRound[round] || []
      const nextRoundMatches = matchesByRound[round + 1] || []
      
      console.log(`🔍 Round ${round}: ${currentRoundMatches.length} matches, Round ${round + 1}: ${nextRoundMatches.length} matches`)
      
      // Sort matches by matchNumber
      currentRoundMatches.sort((a, b) => a.matchNumber - b.matchNumber)
      nextRoundMatches.sort((a, b) => a.matchNumber - b.matchNumber)
      
      // For each pair of matches in current round, link to next round
      for (let i = 0; i < currentRoundMatches.length; i += 2) {
        const nextMatchIndex = Math.floor(i / 2)
        const nextMatch = nextRoundMatches[nextMatchIndex]
        
        if (nextMatch) {
          // Link first match
          if (!currentRoundMatches[i].nextMatchId) {
            await prisma.tournamentMatch.update({
              where: { id: currentRoundMatches[i].id },
              data: { nextMatchId: nextMatch.id }
            })
            linkedCount++
            fixedMatches++
          }
          
          // Link second match (if exists)
          if (currentRoundMatches[i + 1] && !currentRoundMatches[i + 1].nextMatchId) {
            await prisma.tournamentMatch.update({
              where: { id: currentRoundMatches[i + 1].id },
              data: { nextMatchId: nextMatch.id }
            })
            linkedCount++
            fixedMatches++
          }
          
          // ✅ ADVANCE WINNERS
          const match1 = currentRoundMatches[i]
          const match2 = currentRoundMatches[i + 1]
          
          // Get winners (match1 winner or home/away based on score)
          let winner1 = match1.winnerId
          let winner2 = match2?.winnerId || null
          
          // If match is completed but winnerId is null, determine winner from result
          if (match1.status === "COMPLETED" && !winner1) {
            const result = await prisma.result.findFirst({
              where: { tournamentMatchId: match1.id }
            })
            if (result) {
              winner1 = result.homeScore > result.awayScore 
                ? match1.homePlayerId 
                : result.awayScore > result.homeScore 
                  ? match1.awayPlayerId 
                  : null
              
              if (winner1) {
                await prisma.tournamentMatch.update({
                  where: { id: match1.id },
                  data: { winnerId: winner1 }
                })
              }
            }
          }
          
          if (match2 && match2.status === "COMPLETED" && !winner2) {
            const result = await prisma.result.findFirst({
              where: { tournamentMatchId: match2.id }
            })
            if (result) {
              winner2 = result.homeScore > result.awayScore 
                ? match2.homePlayerId 
                : result.awayScore > result.homeScore 
                  ? match2.awayPlayerId 
                  : null
              
              if (winner2) {
                await prisma.tournamentMatch.update({
                  where: { id: match2.id },
                  data: { winnerId: winner2 }
                })
              }
            }
          }
          
          // Assign winners to next match
          if (winner1 || winner2) {
            const updates: any = {}
            
            // Match 1 winner goes to home slot (matchNumber % 2 === 1)
            // Match 2 winner goes to away slot (matchNumber % 2 === 0)
            if (winner1 && !nextMatch.homePlayerId) {
              updates.homePlayerId = winner1
            }
            if (winner2 && !nextMatch.awayPlayerId) {
              updates.awayPlayerId = winner2
            }
            
            // Also handle if match numbers are reversed
            if (winner1 && !nextMatch.awayPlayerId && nextMatch.homePlayerId) {
              // If home is already taken, put winner1 in away
              updates.awayPlayerId = winner1
            }
            if (winner2 && !nextMatch.homePlayerId && nextMatch.awayPlayerId) {
              updates.homePlayerId = winner2
            }
            
            if (Object.keys(updates).length > 0) {
              await prisma.tournamentMatch.update({
                where: { id: nextMatch.id },
                data: updates
              })
              advancedCount++
              fixedMatches++
            }
          }
        }
      }
    }

    // ✅ STEP 3: Set status for matches that now have both players
    const allMatches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: id }
    })

    for (const match of allMatches) {
      if (match.homePlayerId && match.awayPlayerId && match.status === "SCHEDULED") {
        // Already scheduled
        continue
      } else if (match.homePlayerId && match.awayPlayerId && match.status !== "COMPLETED") {
        await prisma.tournamentMatch.update({
          where: { id: match.id },
          data: { status: "SCHEDULED" }
        })
        fixedMatches++
      }
    }

    // ✅ STEP 4: Check if tournament is complete
    const allMatchesAfter = await prisma.tournamentMatch.findMany({
      where: { tournamentId: id }
    })
    
    const allCompleted = allMatchesAfter.every(m => m.status === "COMPLETED")
    if (allCompleted) {
      await prisma.tournament.update({
        where: { id },
        data: { status: "COMPLETED" }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Fixed bracket: ${linkedCount} matches linked, ${advancedCount} winners advanced`,
      details: {
        totalMatches: matches.length,
        maxRound,
        linkedCount,
        advancedCount,
        fixedMatches,
        allCompleted
      }
    })

  } catch (error) {
    console.error("Error fixing bracket:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fix bracket" },
      { status: 500 }
    )
  }
}