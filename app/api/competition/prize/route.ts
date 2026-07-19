import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")

    // ✅ Get active season if no seasonId provided
    let activeSeasonId = seasonId

    if (!activeSeasonId) {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
        include: {
          leagueSettings: true,
        },
      })
      if (!activeSeason) {
        return NextResponse.json({
          totalPrizePool: 0,
          entryFee: 0,
          registeredPlayers: 0,
          totalPlayers: 0,
          breakdown: {
            champion: { percentage: 50, amount: 0 },
            runnerUp: { percentage: 25, amount: 0 },
            topScorer: { percentage: 10, amount: 0 },
            platformReserve: { percentage: 15, amount: 0 },
          },
          playerPosition: null,
          message: "No active season",
        })
      }
      activeSeasonId = activeSeason.id
    }

    // ✅ Get league settings - THIS IS THE SOURCE OF TRUTH FOR ENTRY FEE
    const leagueSettings = await prisma.leagueSettings.findUnique({
      where: { seasonId: activeSeasonId },
    })

    const entryFee = leagueSettings?.entryFee || 0
    const paymentRequired = leagueSettings?.paymentRequired || false

    // ✅ If payment is not required, show as free competition
    if (!paymentRequired || entryFee === 0) {
      return NextResponse.json({
        totalPrizePool: 0,
        entryFee: 0,
        registeredPlayers: 0,
        totalPlayers: 0,
        breakdown: {
          champion: { percentage: 50, amount: 0 },
          runnerUp: { percentage: 25, amount: 0 },
          topScorer: { percentage: 10, amount: 0 },
          platformReserve: { percentage: 15, amount: 0 },
        },
        playerPosition: null,
        message: "free",
        seasonId: activeSeasonId,
      })
    }

    // ✅ Get paid players
    const playerSeasonEntries = await prisma.playerSeasonEntry.findMany({
      where: {
        seasonId: activeSeasonId,
        hasPaid: true,
      },
      select: { userId: true },
    })

    const seasonEntries = await prisma.seasonEntry.findMany({
      where: {
        seasonId: activeSeasonId,
        status: CompetitionStatus.ACTIVE,
      },
      select: { userId: true },
    })

    const paidPlayerIds = new Set<string>()
    for (const entry of playerSeasonEntries) {
      paidPlayerIds.add(entry.userId)
    }
    for (const entry of seasonEntries) {
      paidPlayerIds.add(entry.userId)
    }

    const paidPlayersCount = paidPlayerIds.size
    const paidPlayerIdArray = Array.from(paidPlayerIds)

    // ✅ Get total players in season
    const totalPlayers = await prisma.leagueEntry.count({
      where: { seasonId: activeSeasonId },
    })

    // ✅ Calculate total prize pool from entry fee and paid players
    const totalPrizePool = paidPlayersCount * entryFee

    // ✅ Calculate breakdown
    const championAmount = totalPrizePool * 0.5
    const runnerUpAmount = totalPrizePool * 0.25
    const topScorerAmount = totalPrizePool * 0.1
    const platformReserveAmount = totalPrizePool * 0.15

    // ✅ Update or create PrizePool with correct values
    const existingPrizePool = await prisma.prizePool.findUnique({
      where: { seasonId: activeSeasonId },
    })

    if (existingPrizePool) {
      await prisma.prizePool.update({
        where: { id: existingPrizePool.id },
        data: {
          entryFee: entryFee,
          totalCollected: totalPrizePool,
          registeredPlayers: paidPlayersCount,
          championReward: championAmount,
          runnerReward: runnerUpAmount,
          topScorerReward: topScorerAmount,
          platformReserve: platformReserveAmount,
        },
      })
    } else {
      await prisma.prizePool.create({
        data: {
          seasonId: activeSeasonId,
          entryFee: entryFee,
          totalCollected: totalPrizePool,
          registeredPlayers: paidPlayersCount,
          championReward: championAmount,
          runnerReward: runnerUpAmount,
          topScorerReward: topScorerAmount,
          platformReserve: platformReserveAmount,
        },
      })
    }

    const breakdown = {
      champion: {
        percentage: 50,
        amount: championAmount,
      },
      runnerUp: {
        percentage: 25,
        amount: runnerUpAmount,
      },
      topScorer: {
        percentage: 10,
        amount: topScorerAmount,
      },
      platformReserve: {
        percentage: 15,
        amount: platformReserveAmount,
      },
    }

    console.log(`📊 Prize Calculation: ${paidPlayersCount} paid players × KES ${entryFee} = KES ${totalPrizePool}`)

    // ✅ Get player's position in standings
    let playerPosition = null

    if (session.user.id && paidPlayerIdArray.length > 0) {
      const entries = await prisma.leagueEntry.findMany({
        where: {
          seasonId: activeSeasonId,
          playerId: {
            in: paidPlayerIdArray,
          },
        },
        orderBy: [
          { points: 'desc' },
          { goalDifference: 'desc' },
          { goalsFor: 'desc' },
        ],
        select: {
          playerId: true,
          points: true,
          goalsFor: true,
        },
      })

      const playerIndex = entries.findIndex(e => e.playerId === session.user.id)
      
      if (playerIndex !== -1) {
        const rank = playerIndex + 1
        const totalActivePlayers = entries.length
        
        let potentialWinnings = 0
        if (rank === 1) {
          potentialWinnings = championAmount
        } else if (rank === 2) {
          potentialWinnings = runnerUpAmount
        } else if (rank <= 5) {
          potentialWinnings = Math.round(totalPrizePool * 0.02)
        }

        const topScorer = await prisma.leagueEntry.findFirst({
          where: {
            seasonId: activeSeasonId,
            playerId: {
              in: paidPlayerIdArray,
            },
          },
          orderBy: { goalsFor: 'desc' },
          select: { playerId: true },
        })

        const isTopScorer = topScorer?.playerId === session.user.id

        if (isTopScorer) {
          potentialWinnings += topScorerAmount
        }

        playerPosition = {
          rank,
          totalPlayers: totalActivePlayers,
          points: entries[playerIndex]?.points || 0,
          goals: entries[playerIndex]?.goalsFor || 0,
          potentialWinnings: Math.round(potentialWinnings),
          isTopScorer,
          currentReward: rank === 1 ? championAmount : 
                         rank === 2 ? runnerUpAmount : 
                         rank <= 3 ? Math.round(totalPrizePool * 0.02) : 0,
        }
      }
    }

    // ✅ Get top scorer among paid players
    const topScorer = await prisma.leagueEntry.findFirst({
      where: {
        seasonId: activeSeasonId,
        playerId: {
          in: paidPlayerIdArray,
        },
      },
      orderBy: { goalsFor: 'desc' },
      include: {
        player: {
          include: {
            profile: true,
          },
        },
      },
    })

    return NextResponse.json({
      totalPrizePool: Math.round(totalPrizePool),
      entryFee,
      registeredPlayers: paidPlayersCount,
      totalPlayers,
      breakdown,
      topScorer: topScorer ? {
        name: topScorer.player.profile?.username || topScorer.player.name || "Unknown",
        goals: topScorer.goalsFor,
      } : null,
      playerPosition,
      seasonId: activeSeasonId,
    })
  } catch (error) {
    console.error("Error fetching prize distribution:", error)
    return NextResponse.json(
      { error: "Failed to fetch prize distribution" },
      { status: 500 }
    )
  }
}