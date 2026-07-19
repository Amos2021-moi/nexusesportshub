import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

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

    // ✅ BATCH: Get all data in a single parallel query
    const [activeSeason, leagueEntry, paymentStatus] = await Promise.all([
      // 1. Get active season with minimal fields
      prisma.season.findFirst({
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
      }),
      
      // 2. Check if user is in league
      prisma.leagueEntry.findUnique({
        where: {
          seasonId_playerId: {
            seasonId: (await prisma.season.findFirst({
              where: { isActive: true },
              select: { id: true }
            }))?.id || '',
            playerId: userId,
          },
        },
        select: {
          id: true,
        },
      }),
      
      // 3. Get payment status in a single optimized query
      prisma.$queryRaw<{ hasPaid: boolean; status: string; receipt: string | null; paidAt: Date | null; checkoutId: string | null }[]>`
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
      `,
    ])

    const duration = performance.now() - startTime
    if (duration > 100) {
      console.log(`📊 Player entry fetched in ${duration.toFixed(0)}ms`)
    }

    // ✅ If no active season
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

    // ✅ If user is not in league
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