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

    const formData = await request.formData()
    const homeScore = parseInt(formData.get("homeScore") as string)
    const awayScore = parseInt(formData.get("awayScore") as string)
    const evidence = formData.get("evidence") as File | null

    if (isNaN(homeScore) || isNaN(awayScore)) {
      return NextResponse.json(
        { error: "Valid scores are required" },
        { status: 400 }
      )
    }

    // Get fixture with players
    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        homePlayer: {
          include: { profile: true },
        },
        awayPlayer: {
          include: { profile: true },
        },
        season: true,
      },
    })

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    // ✅ Check if fixture is completed
    if (fixture.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Fixture already completed" },
        { status: 400 }
      )
    }

    // ✅ Check if user is part of this fixture
    if (fixture.homePlayerId !== session.user.id && fixture.awayPlayerId !== session.user.id) {
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
          { error: "You must pay the entry fee to submit results. Please pay on your dashboard." },
          { status: 403 }
        )
      }
    }

    // Check if result already exists for this fixture
    const existingResult = await prisma.result.findUnique({
      where: { fixtureId },
    })

    if (existingResult) {
      return NextResponse.json(
        { error: "Result already submitted for this fixture" },
        { status: 400 }
      )
    }

    // Handle evidence upload
    let evidenceBase64 = null
    if (evidence) {
      const buffer = Buffer.from(await evidence.arrayBuffer())
      evidenceBase64 = buffer.toString("base64")
    }

    // Create result with PENDING status
    const result = await prisma.result.create({
      data: {
        fixtureId,
        homeScore,
        awayScore,
        evidenceImage: evidenceBase64,
        submittedBy: session.user.id,
        approved: false,
        source: "LEAGUE",
      },
      include: {
        fixture: {
          include: {
            homePlayer: {
              include: { profile: true },
            },
            awayPlayer: {
              include: { profile: true },
            },
          },
        },
      },
    })

    // Update fixture status to PENDING
    await prisma.fixture.update({
      where: { id: fixtureId },
      data: { status: "PENDING" },
    })

    // ✅ Notify admins about pending result
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "📋 New Result Pending",
          message: `New result submitted for ${fixture.homePlayer?.name || "Home"} vs ${fixture.awayPlayer?.name || "Away"}. Please review.`,
          type: "RESULT_SUBMITTED",
          link: `/admin/results`,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Result submitted successfully! Waiting for admin approval.",
      result,
    })
  } catch (error) {
    console.error("Error submitting result:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit result" },
      { status: 500 }
    )
  }
}