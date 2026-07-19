import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper to check if fixture modifications are allowed
async function checkFixtureLock(seasonId: string) {
  // Check if fixture lock is enabled
  const lockSetting = await prisma.setting.findFirst({
    where: {
      category: "league",
      key: "fixtureLock"
    }
  })

  if (lockSetting) {
    const isLocked = JSON.parse(lockSetting.value)
    if (isLocked) {
      throw new Error("Fixtures are locked. No modifications allowed.")
    }
  }

  // Check if season is frozen
  const freezeSetting = await prisma.setting.findFirst({
    where: {
      category: "league",
      key: "seasonFreeze"
    }
  })

  if (freezeSetting) {
    const isFrozen = JSON.parse(freezeSetting.value)
    if (isFrozen) {
      throw new Error("Season is frozen. No changes can be made.")
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Get the current active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        leagueSettings: true,
      },
    })

    // ✅ If no active season, return empty fixtures
    if (!activeSeason) {
      return NextResponse.json([])
    }

    // ✅ Check if payment is required for this season
    const paymentRequired = activeSeason.leagueSettings?.paymentRequired || false
    const entryFee = activeSeason.leagueSettings?.entryFee || 0

    // ✅ If payment is required, check if the player has paid
    if (paymentRequired) {
      const playerEntry = await prisma.playerSeasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: session.user.id,
            seasonId: activeSeason.id,
          },
        },
      })

      // ✅ Also check SeasonEntry (for M-Pesa payments)
      const seasonEntry = await prisma.seasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: session.user.id,
            seasonId: activeSeason.id,
          },
        },
      })

      const hasPaid = playerEntry?.hasPaid || seasonEntry?.status === "ACTIVE"

      // ✅ If not paid, return empty fixtures with payment info
      if (!hasPaid) {
        return NextResponse.json({
          fixtures: [],
          paymentRequired: true,
          hasPaid: false,
          entryFee: entryFee,
          seasonName: activeSeason.name,
          message: "Payment required to view fixtures. Please pay the entry fee.",
        })
      }
    }

    // ✅ Return fixtures (only for paid players or when payment is not required)
    const fixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: session.user.id },
          { awayPlayerId: session.user.id }
        ]
      },
      select: {
        id: true,
        status: true,
        homeScore: true,
        awayScore: true,
        scheduledDate: true,
        homePlayer: {
          select: {
            name: true,
            profile: {
              select: {
                username: true,
                profilePicture: true,
                whatsappNumber: true,
                whatsappVisible: true
              }
            }
          }
        },
        awayPlayer: {
          select: {
            name: true,
            profile: {
              select: {
                username: true,
                profilePicture: true,
                whatsappNumber: true,
                whatsappVisible: true
              }
            }
          }
        },
        season: {
          select: {
            name: true,
            status: true,
            endDate: true
          }
        },
        result: {
          select: {
            approved: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    return NextResponse.json({
      fixtures: fixtures,
      paymentRequired: false,
      hasPaid: true,
    })
  } catch (error) {
    console.error("Error fetching fixtures:", error)
    return NextResponse.json([])
  }
}

// ✅ Add POST with lock/freeze checks
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
    const { seasonId, homePlayerId, awayPlayerId, scheduledDate } = body

    if (!seasonId || !homePlayerId || !awayPlayerId || !scheduledDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // ✅ Check if fixture modifications are allowed
    await checkFixtureLock(seasonId)

    const fixture = await prisma.fixture.create({
      data: {
        seasonId,
        homePlayerId,
        awayPlayerId,
        scheduledDate: new Date(scheduledDate),
        status: "SCHEDULED"
      }
    })

    return NextResponse.json(fixture, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create fixture"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}