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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    try {
      // ✅ Get prize pool from database
      let prizePool = await prisma.prizePool.findUnique({
        where: { seasonId },
        include: {
          season: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      })

      // ✅ Get actual paid players count from LeagueEntry
      const paidPlayers = await prisma.leagueEntry.count({
        where: {
          seasonId,
          seasonEntry: {
            status: CompetitionStatus.ACTIVE,
          },
        },
      })

      // ✅ If no prize pool exists, create one with default
      if (!prizePool) {
        prizePool = await prisma.prizePool.create({
          data: {
            seasonId,
            entryFee: 0,
            totalCollected: 0,
            registeredPlayers: 0,
            championReward: 0,
            runnerReward: 0,
            topScorerReward: 0,
            platformReserve: 0,
          },
          include: {
            season: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        })
      }

      // ✅ Get entry fee from database
      const entryFee = prizePool.entryFee || 0

      // ✅ Calculate from LIVE data only
      const totalCollected = paidPlayers * entryFee

      // ✅ Prize distribution from actual total
      const championReward = totalCollected * 0.5
      const runnerReward = totalCollected * 0.25
      const topScorerReward = totalCollected * 0.1
      const platformReserve = totalCollected * 0.15

      // ✅ Return live data from database
      return NextResponse.json({
        ...prizePool,
        entryFee,
        totalCollected,
        registeredPlayers: paidPlayers,
        championReward,
        runnerReward,
        topScorerReward,
        platformReserve,
      })
    } catch (dbError) {
      console.error("Database error fetching prize pool:", dbError)
      return NextResponse.json(
        { error: "Failed to fetch prize pool" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error fetching prize pool:", error)
    return NextResponse.json(
      { error: "Failed to fetch prize pool" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      seasonId,
      entryFee,
      championPercent,
      runnerPercent,
      topScorerPercent,
      platformPercent,
    } = body

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    if (entryFee === undefined || entryFee === null || entryFee < 0) {
      return NextResponse.json({ error: "Valid entry fee required" }, { status: 400 })
    }

    // ✅ Validate percentages
    const totalPercent = (championPercent || 0) + (runnerPercent || 0) + 
                         (topScorerPercent || 0) + (platformPercent || 0)
    
    if (Math.round(totalPercent) !== 100) {
      return NextResponse.json(
        { error: `Percentages must total 100%. Currently: ${totalPercent}%` },
        { status: 400 }
      )
    }

    try {
      // ✅ Get actual paid players count from database
      const paidPlayers = await prisma.leagueEntry.count({
        where: {
          seasonId,
          seasonEntry: {
            status: CompetitionStatus.ACTIVE,
          },
        },
      })

      // ✅ Calculate from actual data
      const totalCollected = paidPlayers * entryFee

      // Calculate based on percentages
      const championReward = totalCollected * ((championPercent || 0) / 100)
      const runnerReward = totalCollected * ((runnerPercent || 0) / 100)
      const topScorerReward = totalCollected * ((topScorerPercent || 0) / 100)
      const platformReserve = totalCollected * ((platformPercent || 0) / 100)

      // Check if prize pool exists
      const existing = await prisma.prizePool.findUnique({
        where: { seasonId },
      })

      let prizePool
      if (existing) {
        prizePool = await prisma.prizePool.update({
          where: { id: existing.id },
          data: {
            entryFee,
            totalCollected,
            registeredPlayers: paidPlayers,
            championReward,
            runnerReward,
            topScorerReward,
            platformReserve,
          },
          include: {
            season: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        })
      } else {
        prizePool = await prisma.prizePool.create({
          data: {
            seasonId,
            entryFee,
            totalCollected,
            registeredPlayers: paidPlayers,
            championReward,
            runnerReward,
            topScorerReward,
            platformReserve,
          },
          include: {
            season: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        })
      }

      return NextResponse.json({
        success: true,
        prizePool,
        stats: {
          paidPlayers,
          totalCollected,
          championReward,
          runnerReward,
          topScorerReward,
          platformReserve,
        },
      })
    } catch (dbError) {
      console.error("Database error saving prize pool:", dbError)
      return NextResponse.json(
        { error: "Failed to save prize pool" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error saving prize pool:", error)
    return NextResponse.json(
      { error: "Failed to save prize pool" },
      { status: 500 }
    )
  }
}