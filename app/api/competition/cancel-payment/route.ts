import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { seasonId, checkoutRequestId } = await request.json()

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    // ✅ Find the pending SeasonEntry
    const seasonEntry = await prisma.seasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId: session.user.id,
          seasonId,
        },
      },
    })

    if (!seasonEntry) {
      return NextResponse.json({ error: "No payment found to cancel" }, { status: 404 })
    }

    if (seasonEntry.status !== "PAYMENT_PENDING") {
      return NextResponse.json({ error: "Payment is not pending" }, { status: 400 })
    }

    // ✅ Update status to NOT_ENROLLED so user can retry
    await prisma.seasonEntry.update({
      where: { id: seasonEntry.id },
      data: {
        status: "NOT_ENROLLED",
        resultDesc: "Cancelled by user",
        resultCode: 1037,
      },
    })

    // ✅ Also update PlayerSeasonEntry
    const playerSeasonEntry = await prisma.playerSeasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId: session.user.id,
          seasonId,
        },
      },
    })

    if (playerSeasonEntry) {
      await prisma.playerSeasonEntry.update({
        where: { id: playerSeasonEntry.id },
        data: {
          hasPaid: false,
          paidAt: null,
          paymentReceipt: null,
        },
      })
    }

    // ✅ Log cancellation
    await prisma.paymentAudit.create({
      data: {
        userId: session.user.id,
        seasonEntryId: seasonEntry.id,
        action: "PAYMENT_CANCELLED",
        notes: "Payment cancelled by user",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Payment cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling payment:", error)
    return NextResponse.json(
      { error: "Failed to cancel payment" },
      { status: 500 }
    )
  }
}