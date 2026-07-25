import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

// ✅ GET - Fetch player entry status
// ✅ GET - Fetch player entry status (FIXED)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const userId = session.user.id
    const startTime = performance.now()

    // ✅ First, get active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        leagueSettings: {
          select: {
            paymentRequired: true,
            entryFee: true,
          },
        },
        prizePool: {
          select: {
            entryFee: true,
          },
        },
      },
    })

    // ✅ If no active season, return early
    if (!activeSeason) {
      return NextResponse.json({
        hasEntry: false,
        seasonId: null,
        seasonName: null,
        paymentRequired: false,
        entryFee: 0,
        hasPaid: false,
        status: "NO_ACTIVE_SEASON",
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // ✅ Now check if user is in league using the actual seasonId
    const leagueEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId: activeSeason.id,
          playerId: userId,
        },
      },
      select: {
        id: true,
      },
    })

    // ✅ If user is not in league, return early
    if (!leagueEntry) {
      return NextResponse.json({
        hasEntry: false,
        seasonId: activeSeason.id,
        seasonName: activeSeason.name,
        paymentRequired: activeSeason.leagueSettings?.paymentRequired || false,
        entryFee: activeSeason.leagueSettings?.entryFee || activeSeason.prizePool?.entryFee || 0,
        hasPaid: false,
        status: "NOT_REGISTERED",
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // ✅ Get payment status
    const paymentStatus = await prisma.$queryRaw<{ hasPaid: boolean; status: string; receipt: string | null; paidAt: Date | null; checkoutId: string | null }[]>`
      SELECT 
        CASE 
          WHEN se.status = 'ACTIVE' THEN true
          WHEN se.status = 'PAYMENT_PENDING' THEN false
          WHEN pse."hasPaid" = true THEN true
          ELSE false
        END as "hasPaid",
        CASE 
          WHEN se.status = 'ACTIVE' THEN 'PAID'
          WHEN se.status = 'PAYMENT_PENDING' THEN 'PAYMENT_PENDING'
          WHEN pse."hasPaid" = true THEN 'PAID'
          ELSE 'NOT_ENROLLED'
        END as status,
        COALESCE(se."mpesaReceipt", pse."paymentReceipt") as receipt,
        COALESCE(se."paidAt", pse."paidAt") as "paidAt",
        se."checkoutRequestId" as "checkoutId"
      FROM "Season" s
      LEFT JOIN "SeasonEntry" se ON se."seasonId" = s.id AND se."userId" = ${userId}
      LEFT JOIN "PlayerSeasonEntry" pse ON pse."seasonId" = s.id AND pse."userId" = ${userId}
      WHERE s."isActive" = true
      LIMIT 1
    `

    const duration = performance.now() - startTime
    if (duration > 100) {
      console.log(`📊 Player entry fetched in ${duration.toFixed(0)}ms`)
    }

    // ✅ Extract payment data
    const paymentData = paymentStatus[0] || {
      hasPaid: false,
      status: "NOT_ENROLLED",
      receipt: null,
      paidAt: null,
      checkoutId: null,
    }

    const paymentRequired = activeSeason.leagueSettings?.paymentRequired || false
    const entryFee = activeSeason.leagueSettings?.entryFee || activeSeason.prizePool?.entryFee || 0

    // ✅ Return optimized response
    return NextResponse.json({
      hasEntry: true,
      seasonId: activeSeason.id,
      seasonName: activeSeason.name,
      paymentRequired,
      entryFee,
      hasPaid: paymentData.hasPaid,
      status: paymentData.status,
      paymentReceipt: paymentData.receipt,
      paidAt: paymentData.paidAt,
      checkoutRequestId: paymentData.checkoutId,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error fetching player entry:", error)
    return NextResponse.json({
      hasEntry: false,
      seasonId: null,
      seasonName: null,
      paymentRequired: false,
      entryFee: 0,
      hasPaid: false,
      status: "ERROR",
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}

// ✅ POST - Create or update player entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { seasonId, userId } = body

    if (!seasonId || !userId) {
      return NextResponse.json(
        { error: "Season ID and User ID required" },
        { status: 400 }
      )
    }

    // ✅ Use upsert for SeasonEntry
    const seasonEntry = await prisma.seasonEntry.upsert({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
      update: {
        // Only update if needed - keep existing data
      },
      create: {
        userId,
        seasonId,
        status: CompetitionStatus.NOT_ENROLLED,
        entryFee: 0,
        currency: "KES",
      },
    })

    // ✅ Use upsert for LeagueEntry
    const leagueEntry = await prisma.leagueEntry.upsert({
      where: {
        seasonId_playerId: {
          seasonId,
          playerId: userId,
        },
      },
      update: {
        // Update if needed
        seasonEntryId: seasonEntry.id,
      },
      create: {
        seasonId,
        playerId: userId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        seasonEntryId: seasonEntry.id,
      },
    })

    // ✅ Use upsert for PlayerSeasonEntry
    await prisma.playerSeasonEntry.upsert({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
      update: {
        hasPaid: false,
        seasonEntryId: seasonEntry.id,
      },
      create: {
        userId,
        seasonId,
        hasPaid: false,
        seasonEntryId: seasonEntry.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Player entry created/updated successfully",
      data: { seasonEntry, leagueEntry },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error creating player entry:", error)
    
    // ✅ Handle unique constraint error
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({
        success: true,
        message: "Player entry already exists",
        alreadyExists: true,
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    return NextResponse.json(
      { error: "Failed to create player entry" },
      { status: 500 }
    )
  }
}