// lib/services/stats.service.ts
import { prisma } from '@/lib/prisma'
import { withCache, CACHE_OPTIONS } from '@/lib/cache'

// ✅ Cached stats for admin dashboard
export const getAdminStats = withCache(
  async () => {
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
      pendingResults,
      totalResults,
    ] = await Promise.all([
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
      prisma.result.count({ where: { approved: false } }),
      prisma.result.count(),
    ])

    return {
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
      totalMatches: totalResults,
    }
  },
  ['admin-stats'],
  CACHE_OPTIONS.MEDIUM
)

// ✅ Cached player stats
export const getPlayerStats = withCache(
  (async (playerId: string) => {
    const [profile, stats] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId: playerId },
        select: {
          username: true,
          trustScore: true,
          verifiedBadge: true,
          totalWins: true,
          totalDraws: true,
          totalLosses: true,
          goalsFor: true,
          goalsAgainst: true,
        },
      }),
      prisma.playerStat.findUnique({
        where: { userId: playerId },
        select: {
          elo: true,
          matches: true,
          wins: true,
          draws: true,
          losses: true,
        },
      }),
    ])

    return { profile, stats }
  }) as unknown as () => Promise<any>,
  ['player-stats'],
  CACHE_OPTIONS.SHORT
)

// ✅ Cached season standings
export const getSeasonStandings = withCache(
  (async (seasonId: string) => {
    return prisma.leagueEntry.findMany({
      where: { seasonId },
      include: {
        player: {
          include: { profile: true }
        }
      },
      orderBy: [
        { points: 'desc' },
        { goalDifference: 'desc' },
        { goalsFor: 'desc' },
      ],
    })
  }) as unknown as () => Promise<any>,
  ['season-standings'],
  CACHE_OPTIONS.SHORT
)

// ✅ Cached fixtures for a season
export const getSeasonFixtures = withCache(
  (async (seasonId: string) => {
    return prisma.fixture.findMany({
      where: { seasonId },
      include: {
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        },
        result: true,
      },
      orderBy: { scheduledDate: 'asc' },
    })
  }) as unknown as () => Promise<any>,
  ['season-fixtures'],
  CACHE_OPTIONS.SHORT
)

// ✅ Cached tournaments
export const getTournaments = withCache(
  (async (seasonId?: string) => {
    return prisma.tournament.findMany({
      where: seasonId ? { seasonId } : {},
      include: {
        participants: {
          include: {
            player: {
              include: { profile: true }
            }
          }
        },
        matches: {
          include: {
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            },
            winner: {
              include: { profile: true }
            },
          }
        }
      },
      orderBy: { startDate: 'desc' },
    })
  }) as unknown as () => Promise<any>,
  ['tournaments'],
  CACHE_OPTIONS.MEDIUM
)

// ✅ Cached players list (for admin)
export const getPlayers = withCache(
  (async (filters?: { search?: string; limit?: number }) => {
    const where: any = { role: "PLAYER" }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { profile: { username: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: {
          select: {
            username: true,
            profilePicture: true,
            verifiedBadge: true,
            trustScore: true,
          },
        },
      },
      take: filters?.limit || 100,
      orderBy: { createdAt: 'desc' },
    })
  }) as unknown as () => Promise<any>,
  ['players'],
  CACHE_OPTIONS.MEDIUM
)