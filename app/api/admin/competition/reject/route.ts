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

    await prisma.$transaction(async (tx) => {
      await tx.seasonEntry.update({
        where: { id: entryId },
        data: {
          status: CompetitionStatus.NOT_ENROLLED,
        },
      })

      // Log audit
      await tx.paymentAudit.create({
        data: {
          userId: entry.userId,
          seasonEntryId: entry.id,
          action: "ADMIN_REJECTED",
          notes: `Entry rejected by admin ${session.user.email}`,
        },
      })

      // Send notification to player
      await tx.notification.create({
        data: {
          userId: entry.userId,
          title: "❌ Competition Entry Rejected",
          message: `Your entry for ${entry.season.name} was rejected. Please contact admin for details.`,
          type: "SYSTEM",
          link: "/dashboard",
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: "Entry rejected successfully",
    })
  } catch (error) {
    console.error("Error rejecting entry:", error)
    return NextResponse.json(
      { error: "Failed to reject entry" },
      { status: 500 }
    )
  }
}