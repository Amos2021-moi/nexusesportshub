import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { entryId } = await request.json()

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    // Get the entry
    const entry = await prisma.seasonEntry.findUnique({
      where: { id: entryId },
      include: {
        user: true,
        season: true,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // ✅ Update entry status to ACTIVE (remove approvedAt/approvedBy)
    await prisma.$transaction(async (tx) => {
      await tx.seasonEntry.update({
        where: { id: entryId },
        data: {
          status: CompetitionStatus.ACTIVE,
          paidAt: new Date(), // Use paidAt instead of approvedAt
        },
      })

      // Update prize pool
      const prizePool = await tx.prizePool.findUnique({
        where: { seasonId: entry.seasonId },
      })

      if (prizePool) {
        // Get total paid players count
        const paidPlayers = await tx.leagueEntry.count({
          where: {
            seasonId: entry.seasonId,
            seasonEntry: {
              status: CompetitionStatus.ACTIVE,
            },
          },
        })

        const entryFee = prizePool.entryFee || 50
        const totalCollected = paidPlayers * entryFee
        const championReward = totalCollected * 0.5
        const runnerReward = totalCollected * 0.25
        const topScorerReward = totalCollected * 0.1
        const platformReserve = totalCollected * 0.15

        await tx.prizePool.update({
          where: { id: prizePool.id },
          data: {
            totalCollected,
            registeredPlayers: paidPlayers,
            championReward,
            runnerReward,
            topScorerReward,
            platformReserve,
          },
        })
      }

      // Log audit
      await tx.paymentAudit.create({
        data: {
          userId: entry.userId,
          seasonEntryId: entry.id,
          action: "ADMIN_APPROVED",
          notes: `Entry approved by admin ${session.user.email}`,
        },
      })

      // Send notification to player
      await tx.notification.create({
        data: {
          userId: entry.userId,
          title: "✅ Competition Entry Approved!",
          message: `Your entry for ${entry.season.name} has been approved. You're now active!`,
          type: "AWARD_EARNED",
          link: "/dashboard",
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: "Entry approved successfully",
    })
  } catch (error) {
    console.error("Error approving entry:", error)
    return NextResponse.json(
      { error: "Failed to approve entry" },
      { status: 500 }
    )
  }
}