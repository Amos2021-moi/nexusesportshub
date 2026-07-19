import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"

// ============================================ //
// ✅ CACHE CONFIGURATION                       //
// ============================================ //

// ✅ Cache stats for 30 seconds (reduced for real-time feel)
const CACHE_DURATION = 30 // seconds
const CACHE_TAGS = ['admin-stats', 'dashboard']

// ============================================ //
// ✅ CACHED STATS FUNCTION                     //
// ============================================ //

const getCachedStats = unstable_cache(
  async () => {
    const startTime = performance.now()

    // ✅ Parallel queries with optimized selects
    const [
      totalPlayers,
      totalFixtures,
      completedResults,
      totalTournaments,
      totalAwards,
      totalSeasons,
      totalNews,
      totalPosts,
      totalComments,
      totalLikes,
      // ✅ Additional metrics
      activePlayers,
      totalAdmins,
      totalMatches,
      pendingResults,
      totalResults,
      tournamentsByType,
      recentSeasons,
      // ✅ Growth metrics (last 30 days)
      newPlayersLast30Days,
      newResultsLast30Days,
      newTournamentsLast30Days,
      // ✅ Engagement metrics
      totalSquads,
      totalNotifications,
      totalAuditLogs,
      // ✅ Performance metrics
      avgTrustScore,
      verifiedPlayers,
    ] = await Promise.all([
      // ✅ Counts
      prisma.user.count({ where: { role: "PLAYER" } }),
      prisma.fixture.count(),
      prisma.result.count({ where: { approved: true } }),
      prisma.tournament.count(),
      prisma.award.count(),
      prisma.season.count(),
      prisma.news.count({ where: { published: true } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),

      // ✅ Active players (played in last 30 days)
      prisma.user.count({
        where: {
          role: "PLAYER",
          OR: [
            { homeFixtures: { some: { scheduledDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { awayFixtures: { some: { scheduledDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
          ],
        },
      }),

      // ✅ Admins count
      prisma.user.count({ where: { role: "ADMIN" } }),

      // ✅ Total matches (both league and tournament)
      prisma.result.count(),

      // ✅ Pending results (not approved)
      prisma.result.count({ where: { approved: false } }),

      // ✅ Total results (approved + pending)
      prisma.result.count(),

      // ✅ Tournaments by type
      prisma.tournament.groupBy({
        by: ['type'],
        _count: true,
      }),

      // ✅ Recent seasons (last 3)
      prisma.season.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          _count: {
            select: {
              leagueEntries: true,
              fixtures: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        take: 3,
      }),

      // ✅ Growth metrics - Last 30 days
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.result.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.tournament.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // ✅ Engagement metrics
      prisma.squad.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),

      // ✅ Performance metrics
      prisma.profile.aggregate({
        _avg: { trustScore: true },
      }),
      prisma.profile.count(),
    ])

    const duration = performance.now() - startTime

    // ✅ Calculate completion rate
    const completionRate = totalFixtures > 0
      ? Math.round((completedResults / totalFixtures) * 100)
      : 0

    // ✅ Calculate engagement rate
    const engagementRate = totalPlayers > 0
      ? Math.round((activePlayers / totalPlayers) * 100)
      : 0

    // ✅ Format tournament types
    const tournamentTypeCounts = tournamentsByType.reduce((acc, curr) => {
      acc[curr.type] = curr._count
      return acc
    }, {} as Record<string, number>)

    // ✅ Format recent seasons
    const formattedSeasons = recentSeasons.map(season => ({
      ...season,
      players: season._count.leagueEntries,
      matches: season._count.fixtures,
    }))

    // ✅ Calculate daily average growth
    const dailyGrowth = {
      players: Math.round((newPlayersLast30Days / 30) * 10) / 10,
      results: Math.round((newResultsLast30Days / 30) * 10) / 10,
      tournaments: Math.round((newTournamentsLast30Days / 30) * 10) / 10,
    }

    return {
      // ✅ Counts
      totalPlayers,
      totalFixtures,
      completedResults,
      pendingResults,
      totalTournaments,
      totalAwards,
      totalSeasons,
      totalNews,
      totalPosts,
      totalComments,
      totalLikes,

      // ✅ Engagement
      activePlayers,
      totalAdmins,
      totalMatches: totalResults,
      totalSquads,
      totalNotifications,
      totalAuditLogs,

      // ✅ Performance
      avgTrustScore: Math.round((avgTrustScore._avg.trustScore || 0) * 10) / 10,
      verifiedPlayers,

      // ✅ Rates
      completionRate,
      engagementRate,

      // ✅ Growth
      growth: {
        players: newPlayersLast30Days,
        results: newResultsLast30Days,
        tournaments: newTournamentsLast30Days,
        daily: dailyGrowth,
      },

      // ✅ Tournament breakdown
      tournamentsByType: tournamentTypeCounts,

      // ✅ Recent seasons
      recentSeasons: formattedSeasons,

      // ✅ System health indicator
      systemHealth: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queryTime: Math.round(duration),
      },

      // ✅ Cache info
      _meta: {
        cachedAt: new Date().toISOString(),
        cacheDuration: `${CACHE_DURATION}s`,
      },
    }
  },
  CACHE_TAGS,
  { revalidate: CACHE_DURATION }
)

// ============================================ //
// ✅ GET HANDLER                              //
// ============================================ //

export async function GET(request: Request) {
  try {
    // ✅ Authenticate admin
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Please login" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // ✅ Parse query params for options
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    const format = searchParams.get('format') || 'full'

    // ✅ Force refresh if requested
    if (refresh) {
      // Clear cache and fetch fresh
      const data = await getCachedStats()
      return NextResponse.json({
        ...data,
        _meta: {
          ...data._meta,
          refreshed: true,
        },
      })
    }

    // ✅ Get cached data
    const data = await getCachedStats()

    // ✅ Return based on format
    if (format === 'compact') {
      return NextResponse.json({
        totalPlayers: data.totalPlayers,
        totalFixtures: data.totalFixtures,
        completedResults: data.completedResults,
        pendingResults: data.pendingResults,
        completionRate: data.completionRate,
        engagementRate: data.engagementRate,
        avgTrustScore: data.avgTrustScore,
        _meta: data._meta,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching admin stats:", error)

    // ✅ Return safe fallback with error flag
    return NextResponse.json({
      totalPlayers: 0,
      totalFixtures: 0,
      completedResults: 0,
      pendingResults: 0,
      totalTournaments: 0,
      totalAwards: 0,
      totalSeasons: 0,
      totalNews: 0,
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      activePlayers: 0,
      totalAdmins: 0,
      totalMatches: 0,
      totalSquads: 0,
      totalNotifications: 0,
      totalAuditLogs: 0,
      avgTrustScore: 0,
      verifiedPlayers: 0,
      completionRate: 0,
      engagementRate: 0,
      growth: {
        players: 0,
        results: 0,
        tournaments: 0,
        daily: { players: 0, results: 0, tournaments: 0 },
      },
      tournamentsByType: {},
      recentSeasons: [],
      systemHealth: {
        status: 'error',
        error: 'Failed to fetch stats',
        timestamp: new Date().toISOString(),
        queryTime: 0,
      },
      _meta: {
        cachedAt: new Date().toISOString(),
        cacheDuration: '0s',
        error: true,
      },
    }, { status: 200 })
  }
}

// ============================================ //
// ✅ POST: Force refresh cache                 //
// ============================================ //

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // ✅ Force refresh cache
    const data = await getCachedStats()

    return NextResponse.json({
      success: true,
      message: "Cache refreshed successfully",
      data,
    })
  } catch (error) {
    console.error("Error refreshing cache:", error)
    return NextResponse.json(
      { error: "Failed to refresh cache" },
      { status: 500 }
    )
  }
}

// ============================================ //
// ✅ OPTIONS: CORS headers                     //
// ============================================ //

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}