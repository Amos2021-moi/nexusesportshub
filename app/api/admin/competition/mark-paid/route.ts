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

    // ✅ Check if player entry exists
    let playerEntry = await prisma.playerSeasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
    })

    if (playerEntry) {
      // ✅ Update existing entry
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
      // ✅ Create new entry
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

    // ✅ Get league settings to update prize pool
    const leagueSettings = await prisma.leagueSettings.findUnique({
      where: { seasonId },
    })

    if (leagueSettings?.paymentRequired) {
      // ✅ Update prize pool (if you want to track total collected)
      // This would require a PrizePool model - optional
    }

    return NextResponse.json({
      success: true,
      message: "Player marked as paid successfully",
      entry: playerEntry,
    })
  } catch (error) {
    console.error("Error marking as paid:", error)
    return NextResponse.json(
      { error: "Failed to mark as paid" },
      { status: 500 }
    )
  }
}