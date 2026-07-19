import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      // ✅ Get active season
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
        include: {
          prizePool: true,
        },
      })

      if (!activeSeason) {
        return NextResponse.json({
          totalPlayers: 0,
          paidPlayers: 0,
          pendingPayments: 0,
          unpaidPlayers: 0,
          totalPrizePool: 0,
          registeredPlayers: 0,
          seasonName: "No Active Season",
          entryFee: 0,
          championReward: 0,
          runnerReward: 0,
          topScorerReward: 0,
          platformReserve: 0,
          completionRate: 0,
        })
      }

      // ✅ Get all league entries for this season with seasonEntry
      const leagueEntries = await prisma.leagueEntry.findMany({
        where: { seasonId: activeSeason.id },
        include: {
          seasonEntry: true,
        },
      })

      const totalPlayers = leagueEntries.length
      const paidPlayers = leagueEntries.filter(e => e.seasonEntry?.status === CompetitionStatus.ACTIVE).length
      const pendingPayments = leagueEntries.filter(e => e.seasonEntry?.status === CompetitionStatus.PAYMENT_PENDING).length
      const unpaidPlayers = leagueEntries.filter(e => !e.seasonEntry || e.seasonEntry?.status === CompetitionStatus.NOT_ENROLLED).length

      // ✅ Get entry fee from prize pool
      const entryFee = activeSeason.prizePool?.entryFee || 0

      // ✅ Calculate from LIVE data
      const totalPrizePool = paidPlayers * entryFee
      const registeredPlayers = paidPlayers

      // ✅ Prize distribution from actual total
      const championReward = totalPrizePool * 0.5
      const runnerReward = totalPrizePool * 0.25
      const topScorerReward = totalPrizePool * 0.1
      const platformReserve = totalPrizePool * 0.15

      // ✅ Calculate completion rate
      const completionRate = totalPlayers > 0 ? Math.round((paidPlayers / totalPlayers) * 100) : 0

      return NextResponse.json({
        totalPlayers,
        paidPlayers,
        pendingPayments,
        unpaidPlayers,
        totalPrizePool,
        registeredPlayers,
        seasonName: activeSeason.name,
        entryFee,
        championReward,
        runnerReward,
        topScorerReward,
        platformReserve,
        completionRate,
      })
    } catch (dbError) {
      console.error("Database error fetching overview:", dbError)
      return NextResponse.json({
        totalPlayers: 0,
        paidPlayers: 0,
        pendingPayments: 0,
        unpaidPlayers: 0,
        totalPrizePool: 0,
        registeredPlayers: 0,
        seasonName: "Error Loading Data",
        entryFee: 0,
        championReward: 0,
        runnerReward: 0,
        topScorerReward: 0,
        platformReserve: 0,
        completionRate: 0,
      })
    }
  } catch (error) {
    console.error("Error fetching competition overview:", error)
    return NextResponse.json({
      totalPlayers: 0,
      paidPlayers: 0,
      pendingPayments: 0,
      unpaidPlayers: 0,
      totalPrizePool: 0,
      registeredPlayers: 0,
      seasonName: "Error Loading Data",
      entryFee: 0,
      championReward: 0,
      runnerReward: 0,
      topScorerReward: 0,
      platformReserve: 0,
      completionRate: 0,
    })
  }
}