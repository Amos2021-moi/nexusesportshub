import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  try {
    const { fixtureId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { proposedTime, message } = await request.json()

    if (!proposedTime) {
      return NextResponse.json({ error: "Proposed time is required" }, { status: 400 })
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        homePlayer: { include: { profile: true } },
        awayPlayer: { include: { profile: true } },
        season: true,
      }
    })

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    // Check if user is part of this fixture
    const isHomePlayer = fixture.homePlayerId === session.user.id
    const isAwayPlayer = fixture.awayPlayerId === session.user.id

    if (!isHomePlayer && !isAwayPlayer) {
      return NextResponse.json(
        { error: "You are not part of this fixture" },
        { status: 403 }
      )
    }

    // ✅ Check payment requirement for this season
    const leagueSettings = await prisma.leagueSettings.findUnique({
      where: { seasonId: fixture.seasonId },
    })

    if (leagueSettings?.paymentRequired) {
      // ✅ Check PlayerSeasonEntry (admin marked paid)
      const playerEntry = await prisma.playerSeasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: session.user.id,
            seasonId: fixture.seasonId,
          },
        },
      })

      // ✅ Check SeasonEntry (M-Pesa payment)
      const seasonEntry = await prisma.seasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: session.user.id,
            seasonId: fixture.seasonId,
          },
        },
      })

      const hasPaid = playerEntry?.hasPaid || seasonEntry?.status === "ACTIVE"

      if (!hasPaid) {
        return NextResponse.json(
          { error: "You must pay the entry fee to suggest match times. Please pay on your dashboard." },
          { status: 403 }
        )
      }
    }

    // Determine opponent
    const opponentId = isHomePlayer ? fixture.awayPlayerId : fixture.homePlayerId
    const proposerName = session.user.name || "Player"

    // ✅ Update fixture with proposed date (using existing scheduledDate field)
    await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        scheduledDate: new Date(proposedTime),
      }
    })

    // Get opponent's WhatsApp number
    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
      include: { profile: true }
    })

    const whatsappNumber = opponent?.profile?.whatsappNumber
    const whatsappVisible = opponent?.profile?.whatsappVisible

    // Create notification for opponent
    await prisma.notification.create({
      data: {
        userId: opponentId,
        title: "📅 Match Time Proposed",
        message: `${proposerName} proposed a match time for your fixture. Please check and respond.`,
        type: "NEW_FIXTURE",
        link: `/dashboard/fixtures`
      }
    })

    // Generate WhatsApp URL if number is visible
    let whatsappUrl = null
    if (whatsappVisible && whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/\D/g, '')
      const date = new Date(proposedTime).toLocaleString()
      const whatsappMessage = `Hi, I proposed ${date} for our match. Please check the app to confirm. ${message ? '\n\n' + message : ''}`
      whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`
    }

    return NextResponse.json({
      success: true,
      message: "Match time proposed successfully",
      whatsappUrl
    })
  } catch (error) {
    console.error("Error proposing match time:", error)
    return NextResponse.json(
      { error: "Failed to propose match time" },
      { status: 500 }
    )
  }
}