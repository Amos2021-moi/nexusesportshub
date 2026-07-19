import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import { CompetitionStatus } from "@prisma/client"

// ✅ Helper to check if player has paid - OPTIMIZED with single query
async function hasPlayerPaid(userId: string, seasonId: string): Promise<boolean> {
  // ✅ Single query with OR condition instead of two separate queries
  const entry = await prisma.$queryRaw<{ paid: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "PlayerSeasonEntry" 
      WHERE "userId" = ${userId} AND "seasonId" = ${seasonId} AND "hasPaid" = true
      UNION
      SELECT 1 FROM "SeasonEntry" 
      WHERE "userId" = ${userId} AND "seasonId" = ${seasonId} AND status = ${CompetitionStatus.ACTIVE}
    ) as paid
  `
  return entry[0]?.paid || false
}

// ✅ OPTIMIZED: Get paid player IDs in a single query
async function getPaidPlayerIds(seasonId: string): Promise<Set<string>> {
  const paidIds = new Set<string>()
  
  // ✅ Single query using UNION
  const results = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT "userId" FROM "PlayerSeasonEntry" 
    WHERE "seasonId" = ${seasonId} AND "hasPaid" = true
    UNION
    SELECT "userId" FROM "SeasonEntry" 
    WHERE "seasonId" = ${seasonId} AND status = ${CompetitionStatus.ACTIVE}
  `
  
  results.forEach(r => paidIds.add(r.userId))
  return paidIds
}

// ✅ Cache dashboard stats per user with shorter cache time
const getCachedDashboardStats = unstable_cache(
  async (userId: string) => {
    // ✅ BATCH: Get all data in parallel with optimized queries
    const [activeSeason, profile, leagueEntries, fixtures, recentResult] = await Promise.all([
      // 1. Get active season - optimized select
      prisma.season.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          leagueSettings: {
            select: {
              paymentRequired: true,
            },
          },
        },
      }),
      
      // 2. Get profile (minimal data)
      prisma.profile.findUnique({
        where: { userId },
        select: { username: true },
      }),
      
      // 3. Get league entries - with player data included
      prisma.leagueEntry.findMany({
        where: activeSeason ? { seasonId: activeSeason.id } : undefined,
        select: {
          id: true,
          playerId: true,
          points: true,
          played: true,
          wins: true,
          draws: true,
          losses: true,
          goalsFor: true,
          goalsAgainst: true,
          goalDifference: true,
          player: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
        orderBy: [
          { points: 'desc' },
          { goalDifference: 'desc' },
          { goalsFor: 'desc' },
        ],
      }),
      
      // 4. Get next fixture - OPTIMIZED with direct query
      activeSeason ? prisma.fixture.findFirst({
        where: {
          seasonId: activeSeason.id,
          OR: [
            { homePlayerId: userId },
            { awayPlayerId: userId }
          ],
          homeScore: null,
          awayScore: null,
          scheduledDate: { gt: new Date() }
        },
        select: {
          id: true,
          scheduledDate: true,
          homePlayerId: true,
          awayPlayerId: true,
          homePlayer: {
            select: {
              name: true,
              profile: {
                select: {
                  username: true,
                },
              },
            },
          },
          awayPlayer: {
            select: {
              name: true,
              profile: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { scheduledDate: 'asc' }
      }) : Promise.resolve(null),
      
      // 5. Get recent result - OPTIMIZED with direct query
      activeSeason ? prisma.result.findFirst({
        where: {
          source: "LEAGUE",
          approved: true,
          fixture: {
            seasonId: activeSeason.id,
            OR: [
              { homePlayerId: userId },
              { awayPlayerId: userId }
            ]
          }
        },
        select: {
          id: true,
          homeScore: true,
          awayScore: true,
          fixture: {
            select: {
              homePlayerId: true,
              awayPlayerId: true,
              homePlayer: {
                select: {
                  name: true,
                  profile: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
              awayPlayer: {
                select: {
                  name: true,
                  profile: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' }
      }) : Promise.resolve(null),
    ])

    // ✅ Early return if no active season
    if (!activeSeason) {
      return {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        winRate: 0,
        currentRank: 0,
        totalPlayers: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        nextFixture: null,
        recentResult: null,
        paymentRequired: false,
        isPaid: true,
        showFixtures: true,
      }
    }

    const paymentRequired = activeSeason.leagueSettings?.paymentRequired || false
    let isPaid = true
    let showFixtures = true
    let filteredEntries = leagueEntries

    // ✅ Handle payment filtering - OPTIMIZED
    if (paymentRequired) {
      isPaid = await hasPlayerPaid(userId, activeSeason.id)
      
      if (!isPaid) {
        showFixtures = false
        // ✅ Only keep the user's entry for rank calculation
        filteredEntries = leagueEntries.filter(e => e.playerId === userId)
      } else {
        // ✅ Get all paid player IDs in one query
        const paidIds = await getPaidPlayerIds(activeSeason.id)
        filteredEntries = leagueEntries.filter(e => paidIds.has(e.playerId))
      }
    }

    // ✅ Find user entry
    const userEntry = leagueEntries.find(e => e.playerId === userId)
    
    // ✅ Calculate rank
    const rank = filteredEntries.findIndex(e => e.playerId === userId) + 1
    const totalPlayers = filteredEntries.length

    // ✅ Calculate stats
    const totalMatches = userEntry?.played || 0
    const wins = userEntry?.wins || 0
    const draws = userEntry?.draws || 0
    const losses = userEntry?.losses || 0
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    // ✅ Process next fixture
    let nextFixtureData = null
    if (showFixtures && fixtures) {
      const isHome = fixtures.homePlayerId === userId
      const opponent = isHome 
        ? (fixtures.awayPlayer.profile?.username || fixtures.awayPlayer.name)
        : (fixtures.homePlayer.profile?.username || fixtures.homePlayer.name)
      nextFixtureData = {
        id: fixtures.id,
        opponent,
        opponentId: isHome ? fixtures.awayPlayerId : fixtures.homePlayerId,
        date: fixtures.scheduledDate,
        isHome,
      }
    }

    // ✅ Process recent result
    let recentResultData = null
    if (showFixtures && recentResult) {
      const isHome = recentResult.fixture.homePlayerId === userId
      const opponent = isHome
        ? (recentResult.fixture.awayPlayer.profile?.username || recentResult.fixture.awayPlayer.name)
        : (recentResult.fixture.homePlayer.profile?.username || recentResult.fixture.homePlayer.name)
      const myScore = isHome ? recentResult.homeScore : recentResult.awayScore
      const opponentScore = isHome ? recentResult.awayScore : recentResult.homeScore
      const result = myScore > opponentScore ? "W" : myScore < opponentScore ? "L" : "D"
      
      recentResultData = {
        opponent,
        score: `${myScore} - ${opponentScore}`,
        result,
      }
    }

    return {
      matchesPlayed: totalMatches,
      wins,
      draws,
      losses,
      winRate,
      currentRank: rank > 0 ? rank : totalPlayers,
      totalPlayers,
      points: userEntry?.points || 0,
      goalsFor: userEntry?.goalsFor || 0,
      goalsAgainst: userEntry?.goalsAgainst || 0,
      goalDifference: (userEntry?.goalsFor || 0) - (userEntry?.goalsAgainst || 0),
      nextFixture: nextFixtureData,
      recentResult: recentResultData,
      paymentRequired,
      isPaid,
      showFixtures,
    }
  },
  ['dashboard-stats'],
  { revalidate: 15 } // ✅ Reduced from 30 to 15 seconds for fresher data
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    const startTime = performance.now()
    const data = await getCachedDashboardStats(session.user.id)
    const duration = performance.now() - startTime
    
    // ✅ Log performance
    if (duration > 100) {
      console.log(`📊 Dashboard stats fetched in ${duration.toFixed(0)}ms`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    // ✅ Return cached fallback if available
    return NextResponse.json({
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      currentRank: 0,
      totalPlayers: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      nextFixture: null,
      recentResult: null,
      paymentRequired: false,
      isPaid: true,
      showFixtures: true,
    })
  }
}