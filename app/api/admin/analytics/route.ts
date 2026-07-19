import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalFixtures,
      completedFixtures,
      pendingResults,
      totalTournaments,
      activeTournaments,
      totalAwards,
      totalSeasons,
      recentActivity,
      userGrowthData
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActive: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.fixture.count(),
      prisma.fixture.count({
        where: { status: "COMPLETED" }
      }),
      prisma.result.count({
        where: { approved: false }
      }),
      prisma.tournament.count(),
      prisma.tournament.count({
        where: { status: "ACTIVE" }
      }),
      prisma.award.count(),
      prisma.season.count(),
      prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `
    ])

    // ✅ Convert BigInt to Number
    const formattedGrowthData = (userGrowthData as any[]).map(item => ({
      date: item.date,
      count: Number(item.count)
    }))

    const completionRate = totalFixtures > 0 
      ? Math.round((completedFixtures / totalFixtures) * 100) 
      : 0

    const recentMatches = await prisma.fixture.findMany({
      where: {
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
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })

    const formattedRecentMatches = recentMatches.map(match => ({
      id: match.id,
      homePlayer: match.homePlayer?.profile?.username || match.homePlayer?.name || "Unknown",
      awayPlayer: match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Unknown",
      score: match.result ? `${match.result.homeScore} - ${match.result.awayScore}` : null,
      status: match.status,
      date: match.updatedAt
    }))

    const topPlayers = await prisma.leagueEntry.findMany({
      include: {
        player: {
          include: { profile: true }
        }
      },
      orderBy: { points: 'desc' },
      take: 5
    })

    const formattedTopPlayers = topPlayers.map(entry => ({
      id: entry.playerId,
      name: entry.player?.profile?.username || entry.player?.name || "Unknown",
      points: entry.points,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses
    }))

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        newUsersThisWeek,
        totalFixtures,
        completedFixtures,
        pendingResults,
        totalTournaments,
        activeTournaments,
        totalAwards,
        totalSeasons,
        completionRate
      },
      userGrowth: formattedGrowthData,
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        createdAt: log.createdAt,
        user: log.user ? {
          name: log.user.name,
          email: log.user.email
        } : null
      })),
      recentMatches: formattedRecentMatches,
      topPlayers: formattedTopPlayers
    })
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}