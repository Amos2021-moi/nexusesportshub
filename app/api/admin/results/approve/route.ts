import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateTrustScore } from "@/lib/services/trust.service"
import { notificationWithEmailService } from "@/lib/services/notificationWithEmail.service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { resultId } = await request.json()

    if (!resultId) {
      return NextResponse.json({ error: "Result ID required" }, { status: 400 })
    }

    // Get the result with fixture and tournament match
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { 
        fixture: {
          include: {
            season: true,
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } }
          }
        },
        tournamentMatch: {
          include: {
            tournament: true,
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } }
          }
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    if (result.approved) {
      return NextResponse.json({ error: "Result already approved" }, { status: 400 })
    }

    // ✅ Check if this is a TOURNAMENT match
    if (result.tournamentMatch) {
      const match = result.tournamentMatch
      
      // Determine winner
      let winnerId = null
      if (result.homeScore > result.awayScore) {
        winnerId = match.homePlayerId
      } else if (result.awayScore > result.homeScore) {
        winnerId = match.awayPlayerId
      }

      // Update the match with winner
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: {
          winnerId: winnerId,
          status: "COMPLETED"
        }
      })

      // ✅ ADVANCE WINNER TO NEXT ROUND using nextMatchId
      if (winnerId && match.nextMatchId) {
        const nextMatch = await prisma.tournamentMatch.findUnique({
          where: { id: match.nextMatchId }
        })

        if (nextMatch) {
          // Determine if this winner goes to home or away
          const isHomeSlot = match.matchNumber % 2 === 1
          
          if (isHomeSlot && !nextMatch.homePlayerId) {
            await prisma.tournamentMatch.update({
              where: { id: nextMatch.id },
              data: { homePlayerId: winnerId }
            })
          } else if (!isHomeSlot && !nextMatch.awayPlayerId) {
            await prisma.tournamentMatch.update({
              where: { id: nextMatch.id },
              data: { awayPlayerId: winnerId }
            })
          }

          // Check if both players are now assigned
          const updatedNextMatch = await prisma.tournamentMatch.findUnique({
            where: { id: nextMatch.id }
          })

          if (updatedNextMatch?.homePlayerId && updatedNextMatch?.awayPlayerId) {
            await prisma.tournamentMatch.update({
              where: { id: nextMatch.id },
              data: { status: "SCHEDULED" }
            })
          }
        }
      }

      // ✅ Check if tournament is complete
      const allMatches = await prisma.tournamentMatch.findMany({
        where: { tournamentId: match.tournamentId }
      })
      const allCompleted = allMatches.every(m => m.status === "COMPLETED")
      
      if (allCompleted) {
        await prisma.tournament.update({
          where: { id: match.tournamentId },
          data: { status: "COMPLETED" }
        })
      }

      // Mark result as approved
      await prisma.result.update({
        where: { id: resultId },
        data: { approved: true }
      })

      // ✅ SEND EMAIL NOTIFICATIONS FOR TOURNAMENT
      const homeName = match.homePlayer?.profile?.username || match.homePlayer?.name || "Home Player"
      const awayName = match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Away Player"
      const winnerName = winnerId === match.homePlayerId ? homeName : awayName

      // Send to home player
      if (match.homePlayerId) {
        await notificationWithEmailService.sendResultNotification(match.homePlayerId, {
          homePlayer: homeName,
          awayPlayer: awayName,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "approved"
        })
      }

      // Send to away player
      if (match.awayPlayerId) {
        await notificationWithEmailService.sendResultNotification(match.awayPlayerId, {
          homePlayer: homeName,
          awayPlayer: awayName,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "approved"
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Tournament result approved! Winner advanced to next round.",
        data: {
          winnerId,
          advanced: !!match.nextMatchId,
          nextMatchId: match.nextMatchId
        }
      })
    }

    // ✅ REGULAR LEAGUE FIXTURE APPROVAL
    if (!result.fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    const fixture = result.fixture
    const seasonId = fixture.seasonId

    // 1. Update fixture with scores
    await prisma.fixture.update({
      where: { id: fixture.id },
      data: {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        status: "COMPLETED",
        approvedBy: session.user.id,
        approvedAt: new Date()
      }
    })

    // 2. Mark result as approved
    await prisma.result.update({
      where: { id: resultId },
      data: { approved: true }
    })

    // 3. Calculate points
    const homePoints = result.homeScore > result.awayScore ? 3 : result.homeScore === result.awayScore ? 1 : 0
    const awayPoints = result.awayScore > result.homeScore ? 3 : result.awayScore === result.homeScore ? 1 : 0

    // 4. Update league table - Home Player
    const homeEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId: seasonId,
          playerId: fixture.homePlayerId
        }
      }
    })

    const awayEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId: seasonId,
          playerId: fixture.awayPlayerId
        }
      }
    })

    if (homeEntry) {
      await prisma.leagueEntry.update({
        where: { id: homeEntry.id },
        data: {
          played: { increment: 1 },
          wins: { increment: homePoints === 3 ? 1 : 0 },
          draws: { increment: homePoints === 1 ? 1 : 0 },
          losses: { increment: homePoints === 0 ? 1 : 0 },
          goalsFor: { increment: result.homeScore },
          goalsAgainst: { increment: result.awayScore },
          points: { increment: homePoints }
        }
      })
    }

    if (awayEntry) {
      await prisma.leagueEntry.update({
        where: { id: awayEntry.id },
        data: {
          played: { increment: 1 },
          wins: { increment: awayPoints === 3 ? 1 : 0 },
          draws: { increment: awayPoints === 1 ? 1 : 0 },
          losses: { increment: awayPoints === 0 ? 1 : 0 },
          goalsFor: { increment: result.awayScore },
          goalsAgainst: { increment: result.homeScore },
          points: { increment: awayPoints }
        }
      })
    }

    // 5. Update player profiles (career stats)
    await prisma.profile.updateMany({
      where: { userId: fixture.homePlayerId },
      data: {
        totalWins: { increment: homePoints === 3 ? 1 : 0 },
        totalDraws: { increment: homePoints === 1 ? 1 : 0 },
        totalLosses: { increment: homePoints === 0 ? 1 : 0 },
        totalPoints: { increment: homePoints },
        goalsFor: { increment: result.homeScore },
        goalsAgainst: { increment: result.awayScore }
      }
    })

    await prisma.profile.updateMany({
      where: { userId: fixture.awayPlayerId },
      data: {
        totalWins: { increment: awayPoints === 3 ? 1 : 0 },
        totalDraws: { increment: awayPoints === 1 ? 1 : 0 },
        totalLosses: { increment: awayPoints === 0 ? 1 : 0 },
        totalPoints: { increment: awayPoints },
        goalsFor: { increment: result.awayScore },
        goalsAgainst: { increment: result.homeScore }
      }
    })

    // 6. Send notifications (In-App)
    const winner = result.homeScore > result.awayScore ? fixture.homePlayer : result.awayScore > result.homeScore ? fixture.awayPlayer : null
    const winnerName = winner?.profile?.username || winner?.name || "No one (Draw)"
    const homePlayerName = fixture.homePlayer.profile?.username ?? fixture.homePlayer.name ?? "Home Player"
    const awayPlayerName = fixture.awayPlayer.profile?.username ?? fixture.awayPlayer.name ?? "Away Player"

    await prisma.notification.createMany({
      data: [
        {
          userId: fixture.homePlayerId,
          title: "✅ Result Approved!",
          message: `Your match vs ${awayPlayerName} (${result.homeScore}-${result.awayScore}) has been approved. ${winnerName} won!`,
          type: "RESULT_APPROVED",
          link: `/matches/${result.fixtureId}`
        },
        {
          userId: fixture.awayPlayerId,
          title: "✅ Result Approved!",
          message: `Your match vs ${homePlayerName} (${result.homeScore}-${result.awayScore}) has been approved. ${winnerName} won!`,
          type: "RESULT_APPROVED",
          link: `/matches/${result.fixtureId}`
        }
      ]
    })

    // ✅ SEND EMAIL NOTIFICATIONS FOR LEAGUE
    await notificationWithEmailService.sendResultNotification(fixture.homePlayerId, {
      homePlayer: homePlayerName,
      awayPlayer: awayPlayerName,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: "approved"
    })

    await notificationWithEmailService.sendResultNotification(fixture.awayPlayerId, {
      homePlayer: homePlayerName,
      awayPlayer: awayPlayerName,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: "approved"
    })

    // 7. Update trust scores
    try {
      await updateTrustScore(fixture.homePlayerId)
      await updateTrustScore(fixture.awayPlayerId)
    } catch (trustError) {
      console.error("Error updating trust scores:", trustError)
    }

    // 8. Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPROVE_RESULT",
        targetType: "RESULT",
        targetId: resultId,
        details: {
          fixtureId: result.fixtureId,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          homePlayerId: fixture.homePlayerId,
          awayPlayerId: fixture.awayPlayerId,
          seasonId: seasonId
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "League result approved successfully!" 
    })

  } catch (error) {
    console.error("Error approving result:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to approve result" },
      { status: 500 }
    )
  }
}