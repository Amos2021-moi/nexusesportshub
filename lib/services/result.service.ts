import { prisma } from "@/lib/prisma"
import { updateTrustScore } from "@/lib/services/trust.service"

interface ApproveResultParams {
  resultId: string
  adminId: string
}

interface RejectResultParams {
  resultId: string
  adminId: string
}

// ✅ Approve Tournament Match
async function approveTournamentMatch({ result, adminId }: { result: any; adminId: string }) {
  const match = result.tournamentMatch
  
  if (!match) throw new Error("Tournament match not found")
  if (!match.homePlayerId || !match.awayPlayerId) throw new Error("Match players not found")

  console.log("🔍 Approving Tournament Match:", match.id)
  console.log("🔍 Home:", match.homePlayerId, "Away:", match.awayPlayerId)
  console.log("🔍 Score:", result.homeScore, "-", result.awayScore)
  console.log("🔍 Next Match ID:", match.nextMatchId)

  // 1. Mark result as approved
  await prisma.result.update({
    where: { id: result.id },
    data: { approved: true }
  })

  // 2. Determine winner
  let winnerId: string | null = null
  if (result.homeScore > result.awayScore) {
    winnerId = match.homePlayerId
  } else if (result.awayScore > result.homeScore) {
    winnerId = match.awayPlayerId
  }

  console.log("🔍 Winner ID:", winnerId)

  // 3. Update tournament match
  await prisma.tournamentMatch.update({
    where: { id: match.id },
    data: {
      status: "COMPLETED",
      winnerId: winnerId
    }
  })

  // ✅ 4. ADVANCE WINNER TO NEXT MATCH
  if (match.nextMatchId && winnerId) {
    console.log("🔍 Advancing winner to next match:", match.nextMatchId)
    
    const nextMatch = await prisma.tournamentMatch.findUnique({
      where: { id: match.nextMatchId }
    })

    console.log("🔍 Next Match Data:", nextMatch)

    if (nextMatch) {
      const hasHomePlayer = nextMatch.homePlayerId !== null
      const hasAwayPlayer = nextMatch.awayPlayerId !== null

      console.log("🔍 Next Match - Home:", hasHomePlayer, "Away:", hasAwayPlayer)

      if (hasHomePlayer && hasAwayPlayer) {
        console.log("⚠️ Next match already has both players assigned!")
      } else if (!hasHomePlayer) {
        console.log("✅ Setting winner as HOME player for next match")
        await prisma.tournamentMatch.update({
          where: { id: nextMatch.id },
          data: { homePlayerId: winnerId }
        })
      } else if (!hasAwayPlayer) {
        console.log("✅ Setting winner as AWAY player for next match")
        await prisma.tournamentMatch.update({
          where: { id: nextMatch.id },
          data: { awayPlayerId: winnerId }
        })
      }
    } else {
      console.log("⚠️ Next match not found for ID:", match.nextMatchId)
    }
  } else {
    console.log("ℹ️ No next match or no winner to advance (this might be the final)")
  }

  // 5. Send notifications
  const homeName = match.homePlayer?.profile?.username || match.homePlayer?.name || "Home"
  const awayName = match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Away"
  const winnerName = winnerId === match.homePlayerId ? homeName : awayName

  const notifications = []
  if (match.homePlayerId) {
    notifications.push({
      userId: match.homePlayerId,
      title: "✅ Tournament Result Approved",
      message: `Your tournament match vs ${awayName} (${result.homeScore}-${result.awayScore}) has been approved. ${winnerName} advances!`,
      type: "RESULT_APPROVED",
      link: `/tournaments/${match.tournamentId}`
    })
  }
  if (match.awayPlayerId) {
    notifications.push({
      userId: match.awayPlayerId,
      title: "✅ Tournament Result Approved",
      message: `Your tournament match vs ${homeName} (${result.homeScore}-${result.awayScore}) has been approved. ${winnerName} advances!`,
      type: "RESULT_APPROVED",
      link: `/tournaments/${match.tournamentId}`
    })
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications
    })
  }

  // 6. Check if tournament is complete
  const tournament = await prisma.tournament.findUnique({
    where: { id: match.tournamentId },
    include: {
      matches: {
        where: { 
          status: { not: "COMPLETED" },
          AND: [
            { homePlayerId: { not: null } },
            { awayPlayerId: { not: null } }
          ]
        }
      }
    }
  })

  const remainingMatches = tournament?.matches || []
  console.log("🔍 Remaining active matches:", remainingMatches.length)

  if (tournament && remainingMatches.length === 0) {
    console.log("🏆 Tournament Complete! All matches finished.")
    await prisma.tournament.update({
      where: { id: match.tournamentId },
      data: { status: "COMPLETED" }
    })

    // Find champion (winner of the final match)
    const finalMatch = await prisma.tournamentMatch.findFirst({
      where: { 
        tournamentId: match.tournamentId,
        round: { 
          equals: await prisma.tournamentMatch.aggregate({
            where: { tournamentId: match.tournamentId },
            _max: { round: true }
          }).then(r => r._max.round || 1)
        }
      },
      select: { winnerId: true }
    })

    if (finalMatch?.winnerId) {
      const champion = await prisma.user.findUnique({
        where: { id: finalMatch.winnerId },
        include: { profile: true }
      })

      if (champion) {
        await prisma.hallOfFame.create({
          data: {
            playerId: champion.id,
            seasonId: tournament.seasonId || "default",
            category: "CHAMPION",
            reason: `Tournament Champion - ${tournament.name}`,
            imageUrl: champion.profile?.profilePicture || null,
            inductedAt: new Date()
          }
        })
      }
    }
  }

  return { success: true, message: "Tournament result approved!" }
}

// ✅ Approve League Match
export async function approveMatch({ resultId, adminId }: ApproveResultParams) {
  try {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { 
        fixture: {
          include: {
            season: true,
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            }
          }
        },
        tournamentMatch: {
          include: {
            tournament: true,
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            }
          }
        }
      }
    })

    if (!result) throw new Error("Result not found")
    if (result.approved) throw new Error("Result already approved")

    if (result.source === "TOURNAMENT") {
      return await approveTournamentMatch({ result, adminId })
    }

    if (!result.fixture) throw new Error("Fixture not found")

    const fixture = result.fixture
    const seasonId = fixture.seasonId

    if (result.fixtureId) {
      await prisma.fixture.update({
        where: { id: result.fixtureId },
        data: {
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "COMPLETED",
          approvedBy: adminId,
          approvedAt: new Date()
        }
      })
    }

    await prisma.result.update({
      where: { id: resultId },
      data: { approved: true }
    })

    // ✅ Get league settings for points
const leagueSettings = await prisma.setting.findMany({
  where: {
    category: "league",
    key: {
      in: ["pointsWin", "pointsDraw", "pointsLoss"]
    }
  }
})

const settingsMap: Record<string, number> = {}
leagueSettings.forEach(s => {
  settingsMap[s.key] = JSON.parse(s.value)
})

const pointsWin = settingsMap.pointsWin || 3
const pointsDraw = settingsMap.pointsDraw || 1
const pointsLoss = settingsMap.pointsLoss || 0

const homePoints = result.homeScore > result.awayScore ? pointsWin : result.homeScore === result.awayScore ? pointsDraw : pointsLoss
const awayPoints = result.awayScore > result.homeScore ? pointsWin : result.awayScore === result.homeScore ? pointsDraw : pointsLoss
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

    const winner = result.homeScore > result.awayScore ? fixture.homePlayer : result.awayScore > result.homeScore ? fixture.awayPlayer : null
    const winnerName = winner?.name || "No one (Draw)"
    const homePlayerName = fixture.homePlayer.profile?.username || fixture.homePlayer.name
    const awayPlayerName = fixture.awayPlayer.profile?.username || fixture.awayPlayer.name

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

    await prisma.auditLog.create({
      data: {
        userId: adminId,
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

    try {
      await updateTrustScore(fixture.homePlayerId)
      await updateTrustScore(fixture.awayPlayerId)
    } catch (trustError) {
      console.error("Error updating trust scores:", trustError)
    }

    return { 
      success: true, 
      message: "Result approved successfully!",
      data: {
        homePoints,
        awayPoints,
        homePlayer: fixture.homePlayerId,
        awayPlayer: fixture.awayPlayerId,
        winner: winner?.id || null
      }
    }
  } catch (error) {
    console.error("Error in approveMatch:", error)
    throw error
  }
}

// ✅ Reject Match
export async function rejectMatch({ resultId, adminId }: RejectResultParams) {
  try {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { 
        fixture: {
          include: {
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            }
          }
        },
        tournamentMatch: {
          include: {
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            }
          }
        }
      }
    })

    if (!result) throw new Error("Result not found")
    if (result.approved) throw new Error("Result already approved")

    if (result.source === "TOURNAMENT") {
      const match = result.tournamentMatch
      if (!match) throw new Error("Tournament match not found")

      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: {
          status: "SCHEDULED",
          resultId: null
        }
      })

      await prisma.result.delete({
        where: { id: resultId }
      })

      const homeName = match.homePlayer?.profile?.username || match.homePlayer?.name || "Home"
      const awayName = match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Away"

      const notifications = []
      if (match.homePlayerId) {
        notifications.push({
          userId: match.homePlayerId,
          title: "❌ Tournament Result Rejected",
          message: `Your tournament match vs ${awayName} has been rejected. Please resubmit with correct evidence.`,
          type: "RESULT_APPROVED",
          link: `/tournaments/${match.tournamentId}`
        })
      }
      if (match.awayPlayerId) {
        notifications.push({
          userId: match.awayPlayerId,
          title: "❌ Tournament Result Rejected",
          message: `Your tournament match vs ${homeName} has been rejected. Please resubmit with correct evidence.`,
          type: "RESULT_APPROVED",
          link: `/tournaments/${match.tournamentId}`
        })
      }

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        })
      }

      return { success: true }
    }

    if (!result.fixture) throw new Error("Fixture not found")

    const fixture = result.fixture
    const homePlayerName = fixture.homePlayer.profile?.username || fixture.homePlayer.name
    const awayPlayerName = fixture.awayPlayer.profile?.username || fixture.awayPlayer.name

    if (result.fixtureId) {
      await prisma.fixture.update({
        where: { id: result.fixtureId },
        data: {
          homeScore: null,
          awayScore: null,
          status: "SCHEDULED",
          submittedBy: null,
          submittedAt: null
        }
      })
    }

    await prisma.result.delete({
      where: { id: resultId }
    })

    await prisma.notification.createMany({
      data: [
        {
          userId: fixture.homePlayerId,
          title: "❌ Result Rejected",
          message: `Your match vs ${awayPlayerName} has been rejected. Please resubmit with correct evidence.`,
          type: "RESULT_APPROVED",
          link: `/dashboard/fixtures`
        },
        {
          userId: fixture.awayPlayerId,
          title: "❌ Result Rejected",
          message: `Your match vs ${homePlayerName} has been rejected. Please resubmit with correct evidence.`,
          type: "RESULT_APPROVED",
          link: `/dashboard/fixtures`
        }
      ]
    })

    return { success: true }
  } catch (error) {
    console.error("Error in rejectMatch:", error)
    throw error
  }
}