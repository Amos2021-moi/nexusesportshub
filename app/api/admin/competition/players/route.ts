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

    // ✅ Get all league entries for this season
    const entries = await prisma.leagueEntry.findMany({
      where: { seasonId },
      include: {
        player: {
          include: {
            profile: true,
          },
        },
        season: true,
      },
      orderBy: { points: 'desc' },
    })

    // ✅ Get payment status from SeasonEntry (primary source)
    const seasonEntries = await prisma.seasonEntry.findMany({
      where: { seasonId },
    })

    // ✅ Get payment status from PlayerSeasonEntry (secondary source)
    const playerEntries = await prisma.playerSeasonEntry.findMany({
      where: { seasonId },
    })

    // ✅ Get league settings
    const leagueSettings = await prisma.leagueSettings.findUnique({
      where: { seasonId },
    })

    const paymentRequired = leagueSettings?.paymentRequired || false
    const entryFee = leagueSettings?.entryFee || 0

    // ✅ Combine data
    const players = entries.map(entry => {
      // ✅ Check SeasonEntry first (primary source)
      const seasonEntry = seasonEntries.find(s => s.userId === entry.playerId)
      const playerEntry = playerEntries.find(p => p.userId === entry.playerId)
      
      // ✅ Determine if paid - check both sources
      let hasPaid = false
      let paidAt = null
      let paymentReceipt = null
      let paymentMethod = null
      let paymentPhone = null
      let status = "UNPAID"

      // ✅ Check SeasonEntry (primary source from M-Pesa callback)
      if (seasonEntry) {
        if (seasonEntry.status === CompetitionStatus.ACTIVE) {
          hasPaid = true
          paidAt = seasonEntry.paidAt
          paymentReceipt = seasonEntry.mpesaReceipt
          status = "PAID"
        } else if (seasonEntry.status === CompetitionStatus.PAYMENT_PENDING) {
          status = "PENDING"
        }
      }

      // ✅ If not paid in SeasonEntry, check PlayerSeasonEntry (admin mark paid)
      if (!hasPaid && playerEntry?.hasPaid) {
        hasPaid = true
        paidAt = playerEntry.paidAt
        paymentReceipt = playerEntry.paymentReceipt
        paymentMethod = playerEntry.paymentMethod
        paymentPhone = playerEntry.paymentPhone
        status = "PAID"
      }

      return {
        id: entry.id,
        playerId: entry.playerId,
        name: entry.player.name || entry.player.email || "Unknown",
        username: entry.player.profile?.username || entry.player.email?.split('@')[0] || "Unknown",
        profilePicture: entry.player.profile?.profilePicture || null,
        points: entry.points || 0,
        played: entry.played || 0,
        wins: entry.wins || 0,
        draws: entry.draws || 0,
        losses: entry.losses || 0,
        hasPaid,
        paidAt,
        paymentReceipt,
        paymentMethod,
        paymentPhone,
        paymentRequired,
        entryFee,
        status,
      }
    })

    return NextResponse.json({
      players,
      stats: {
        total: players.length,
        paid: players.filter(p => p.hasPaid).length,
        unpaid: players.filter(p => !p.hasPaid && p.paymentRequired).length,
        free: players.filter(p => !p.paymentRequired).length,
      },
      settings: {
        paymentRequired,
        entryFee,
      },
    })
  } catch (error) {
    console.error("Error fetching competition players:", error)
    return NextResponse.json({
      players: [],
      stats: { total: 0, paid: 0, unpaid: 0, free: 0 },
      settings: { paymentRequired: false, entryFee: 0 },
    })
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
    const { userId, seasonId, receipt, method } = body

    if (!userId || !seasonId) {
      return NextResponse.json(
        { error: "User ID and Season ID required" },
        { status: 400 }
      )
    }

    // ✅ Check if SeasonEntry exists, create or update
    let seasonEntry = await prisma.seasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
    })

    if (seasonEntry) {
      seasonEntry = await prisma.seasonEntry.update({
        where: { id: seasonEntry.id },
        data: {
          status: CompetitionStatus.ACTIVE,
          paidAt: new Date(),
          mpesaReceipt: receipt || `ADMIN-${Date.now()}`,
          resultCode: 0,
          resultDesc: "Marked as paid by admin",
        },
      })
    } else {
      seasonEntry = await prisma.seasonEntry.create({
        data: {
          userId,
          seasonId,
          status: CompetitionStatus.ACTIVE,
          entryFee: 50,
          paidAt: new Date(),
          mpesaReceipt: receipt || `ADMIN-${Date.now()}`,
          resultCode: 0,
          resultDesc: "Marked as paid by admin",
        },
      })
    }

    // ✅ Also update PlayerSeasonEntry
    let playerEntry = await prisma.playerSeasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
    })

    if (playerEntry) {
      playerEntry = await prisma.playerSeasonEntry.update({
        where: { id: playerEntry.id },
        data: {
          hasPaid: true,
          paidAt: new Date(),
          paymentReceipt: receipt || `ADMIN-${Date.now()}`,
          paymentMethod: method || "CASH",
        },
      })
    } else {
      playerEntry = await prisma.playerSeasonEntry.create({
        data: {
          userId,
          seasonId,
          hasPaid: true,
          paidAt: new Date(),
          paymentReceipt: receipt || `ADMIN-${Date.now()}`,
          paymentMethod: method || "CASH",
        },
      })
    }

    // ✅ Update prize pool
    await updatePrizePool(seasonId)

    return NextResponse.json({
      success: true,
      message: "Player marked as paid",
      entry: seasonEntry,
    })
  } catch (error) {
    console.error("Error marking player as paid:", error)
    return NextResponse.json(
      { error: "Failed to mark player as paid" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const seasonId = searchParams.get("seasonId")

    if (!userId || !seasonId) {
      return NextResponse.json(
        { error: "User ID and Season ID required" },
        { status: 400 }
      )
    }

    // ✅ Update SeasonEntry
    const seasonEntry = await prisma.seasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
    })

    if (seasonEntry) {
      await prisma.seasonEntry.update({
        where: { id: seasonEntry.id },
        data: {
          status: CompetitionStatus.NOT_ENROLLED,
          resultDesc: "Unmarked by admin",
        },
      })
    }

    // ✅ Update PlayerSeasonEntry
    const playerEntry = await prisma.playerSeasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
    })

    if (playerEntry) {
      await prisma.playerSeasonEntry.update({
        where: { id: playerEntry.id },
        data: {
          hasPaid: false,
          paidAt: null,
          paymentReceipt: null,
        },
      })
    }

    // ✅ Update prize pool
    await updatePrizePool(seasonId)

    return NextResponse.json({
      success: true,
      message: "Player marked as unpaid",
    })
  } catch (error) {
    console.error("Error marking player as unpaid:", error)
    return NextResponse.json(
      { error: "Failed to mark player as unpaid" },
      { status: 500 }
    )
  }
}

// ✅ Helper function to update prize pool
async function updatePrizePool(seasonId: string) {
  const prizePool = await prisma.prizePool.findUnique({
    where: { seasonId },
  })

  if (!prizePool) return

  const paidPlayers = await prisma.leagueEntry.count({
    where: {
      seasonId,
      seasonEntry: {
        status: CompetitionStatus.ACTIVE,
      },
    },
  })

  const entryFee = prizePool.entryFee || 50
  const totalCollected = paidPlayers * entryFee

  await prisma.prizePool.update({
    where: { id: prizePool.id },
    data: {
      totalCollected,
      registeredPlayers: paidPlayers,
      championReward: totalCollected * 0.5,
      runnerReward: totalCollected * 0.25,
      topScorerReward: totalCollected * 0.1,
      platformReserve: totalCollected * 0.15,
    },
  })
}