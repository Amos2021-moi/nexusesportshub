import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger, logApiError } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      logger.warn("Health check attempted without authentication")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      logger.warn(`Health check attempted by non-admin: ${session.user.email}`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    logger.info("Health check started by admin")

    // Get current season
    const currentSeason = await prisma.season.findFirst({
      where: { isActive: true }
    })

    // Pending Results
    const pendingResults = await prisma.result.count({
      where: { approved: false }
    })

    // Unscheduled Fixtures (fixtures without scores in current season)
    const unscheduledFixtures = currentSeason
      ? await prisma.fixture.count({
          where: {
            seasonId: currentSeason.id,
            homeScore: null,
            awayScore: null,
            status: "SCHEDULED"
          }
        })
      : 0

    // Total Fixtures in current season
    const totalFixtures = currentSeason
      ? await prisma.fixture.count({
          where: { seasonId: currentSeason.id }
        })
      : 0

    // Completed Fixtures in current season
    const completedFixtures = currentSeason
      ? await prisma.fixture.count({
          where: {
            seasonId: currentSeason.id,
            status: "COMPLETED"
          }
        })
      : 0

    // Missing Squad Uploads (players without squads in current season)
    const playersInSeason = currentSeason
      ? await prisma.leagueEntry.findMany({
          where: { seasonId: currentSeason.id },
          select: { playerId: true }
        })
      : []

    const playerIds = playersInSeason.map(p => p.playerId)
    
    const playersWithSquads = await prisma.squad.findMany({
      where: {
        userId: { in: playerIds },
        seasonId: currentSeason?.id
      },
      select: { userId: true }
    })

    const playersWithSquadIds = new Set(playersWithSquads.map(s => s.userId))
    const missingSquadUploads = playerIds.filter(id => !playersWithSquadIds.has(id)).length

    // Inactive Players (no matches in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activePlayers = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: { in: playerIds } },
          { awayPlayerId: { in: playerIds } }
        ],
        updatedAt: { gte: thirtyDaysAgo }
      },
      select: { homePlayerId: true, awayPlayerId: true }
    })

    const activePlayerIds = new Set()
    activePlayers.forEach(f => {
      activePlayerIds.add(f.homePlayerId)
      activePlayerIds.add(f.awayPlayerId)
    })

    const inactivePlayers = playerIds.filter(id => !activePlayerIds.has(id)).length

    // Completion Rate
    const completionRate = totalFixtures > 0 
      ? Math.round((completedFixtures / totalFixtures) * 100) 
      : 0

    // Average Approval Time (for approved results)
    const approvedResults = await prisma.result.findMany({
      where: {
        approved: true,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      include: {
        fixture: true
      }
    })

    let avgApprovalTime = 0
    if (approvedResults.length > 0) {
      let totalTime = 0
      let count = 0
      for (const result of approvedResults) {
        if (!result.fixtureId) continue
        
        const fixture = await prisma.fixture.findUnique({
          where: { id: result.fixtureId as string }
        })
        if (fixture?.approvedAt && result.createdAt) {
          totalTime += fixture.approvedAt.getTime() - result.createdAt.getTime()
          count++
        }
      }
      avgApprovalTime = count > 0 ? Math.round(totalTime / count / (1000 * 60 * 60)) : 0
    }

    logger.info("Health check completed successfully", {
      pendingResults,
      totalFixtures,
      completionRate,
      seasonName: currentSeason?.name || "No Active Season"
    })

    return NextResponse.json({
      pendingResults,
      unscheduledFixtures,
      missingSquadUploads,
      inactivePlayers,
      totalPlayers: playerIds.length,
      completionRate,
      avgApprovalTime,
      seasonName: currentSeason?.name || "No Active Season",
      totalFixtures,
      completedFixtures
    })
  } catch (error) {
    logApiError("/api/admin/health", error)
    return NextResponse.json({
      pendingResults: 0,
      unscheduledFixtures: 0,
      missingSquadUploads: 0,
      inactivePlayers: 0,
      totalPlayers: 0,
      completionRate: 0,
      avgApprovalTime: 0,
      seasonName: "Error",
      totalFixtures: 0,
      completedFixtures: 0
    })
  }
}