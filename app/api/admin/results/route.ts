import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper to check if result modifications are allowed
async function checkResultModificationAllowed(seasonId: string) {
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
      throw new Error("Fixtures are locked. No results can be modified.")
    }
  }
}

// ✅ GET: Fetch results with pagination, search, and filter (OPTIMIZED)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filter = searchParams.get("filter") || "pending";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const seasonId = searchParams.get("seasonId");
    const skip = (page - 1) * limit;

    // ✅ Build where clause
    const where: any = {};

    if (filter === "pending") {
      where.approved = false;
    } else if (filter === "approved") {
      where.approved = true;
    }

    if (search) {
      where.OR = [
        { fixture: { homePlayer: { name: { contains: search, mode: "insensitive" } } } },
        { fixture: { awayPlayer: { name: { contains: search, mode: "insensitive" } } } },
        { fixture: { homePlayer: { profile: { username: { contains: search, mode: "insensitive" } } } } },
        { fixture: { awayPlayer: { profile: { username: { contains: search, mode: "insensitive" } } } } },
        { tournamentMatch: { homePlayer: { name: { contains: search, mode: "insensitive" } } } },
        { tournamentMatch: { awayPlayer: { name: { contains: search, mode: "insensitive" } } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { profile: { username: { contains: search, mode: "insensitive" } } } },
        { source: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
    }

    if (seasonId && seasonId !== "all") {
      where.fixture = { seasonId };
    }

    // ✅ Get total count (fast with index)
    const total = await prisma.result.count({ where });

    // ✅ OPTIMIZED: Select only needed fields, not include full relations
    const results = await prisma.result.findMany({
      where,
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        evidenceImage: true,
        submittedBy: true,
        approved: true,
        source: true,
        createdAt: true,
        fixtureId: true,
        tournamentMatchId: true,
        fixture: {
          select: {
            id: true,
            scheduledDate: true,
            seasonId: true,
            homePlayer: {
              select: {
                name: true,
                profile: {
                  select: {
                    username: true,
                    profilePicture: true,
                  },
                },
              },
            },
            awayPlayer: {
              select: {
                name: true,
                profile: {
                  select: {
                    username: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        },
        tournamentMatch: {
          select: {
            id: true,
            homePlayer: {
              select: {
                name: true,
                profile: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            awayPlayer: {
              select: {
                name: true,
                profile: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            tournament: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            profile: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      results,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    )
  }
}

// ✅ POST: Approve or Reject result with freeze/lock checks
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
    const { resultId, action } = body

    if (!resultId || !action) {
      return NextResponse.json(
        { error: "Result ID and action are required" },
        { status: 400 }
      )
    }

    // Get the result with related data
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        fixture: {
          include: {
            season: true
          }
        },
        tournamentMatch: {
          include: {
            tournament: true
          }
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    if (result.approved && action === "approve") {
      return NextResponse.json({ error: "Result already approved" }, { status: 400 })
    }

    // Determine season ID
    let seasonId: string | null = null
    if (result.fixture) {
      seasonId = result.fixture.seasonId
    } else if (result.tournamentMatch) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: result.tournamentMatch.tournamentId },
        include: { season: true }
      })
      if (tournament?.seasonId) {
        seasonId = tournament.seasonId
      }
    }

    // ✅ Check if modifications are allowed (only for league results)
    if (seasonId && result.source === "LEAGUE") {
      await checkResultModificationAllowed(seasonId)
    }

    // Handle approve or reject
    if (action === "approve") {
      await prisma.result.update({
        where: { id: resultId },
        data: { approved: true }
      })

      if (result.fixtureId) {
        await prisma.fixture.update({
          where: { id: result.fixtureId },
          data: {
            status: "COMPLETED",
            approvedBy: session.user.id,
            approvedAt: new Date()
          }
        })

        await updateLeagueStandings(result.fixtureId)
      }

      return NextResponse.json({ success: true, message: "Result approved" })
    } 
    else if (action === "reject") {
      await prisma.result.delete({
        where: { id: resultId }
      })

      if (result.fixtureId) {
        await prisma.fixture.update({
          where: { id: result.fixtureId },
          data: {
            status: "SCHEDULED",
            homeScore: null,
            awayScore: null,
            submittedBy: null,
            submittedAt: null
          }
        })
      }

      return NextResponse.json({ success: true, message: "Result rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process result"
    console.error("Error processing result:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ✅ Helper function to update league standings (OPTIMIZED)
async function updateLeagueStandings(fixtureId: string) {
  try {
    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        result: true,
        season: true
      }
    })

    if (!fixture || !fixture.result) {
      throw new Error("Fixture or result not found")
    }

    const { homePlayerId, awayPlayerId, homeScore, awayScore } = fixture
    const seasonId = fixture.seasonId

    if (homeScore === null || awayScore === null) {
      throw new Error("Scores not set")
    }

    // ✅ Update both players in parallel
    await Promise.all([
      updatePlayerStandings(seasonId, homePlayerId, homeScore, awayScore),
      updatePlayerStandings(seasonId, awayPlayerId, awayScore, homeScore)
    ])

  } catch (error) {
    console.error("Error updating league standings:", error)
  }
}

// ✅ Helper to update a single player's standings (OPTIMIZED)
async function updatePlayerStandings(seasonId: string, playerId: string, goalsFor: number, goalsAgainst: number) {
  const existingEntry = await prisma.leagueEntry.findUnique({
    where: {
      seasonId_playerId: {
        seasonId,
        playerId
      }
    }
  })

  const points = goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0
  const win = goalsFor > goalsAgainst ? 1 : 0
  const draw = goalsFor === goalsAgainst ? 1 : 0
  const loss = goalsFor < goalsAgainst ? 1 : 0

  if (existingEntry) {
    await prisma.leagueEntry.update({
      where: { id: existingEntry.id },
      data: {
        played: { increment: 1 },
        wins: { increment: win },
        draws: { increment: draw },
        losses: { increment: loss },
        goalsFor: { increment: goalsFor },
        goalsAgainst: { increment: goalsAgainst },
        points: { increment: points },
      }
    })
  } else {
    await prisma.leagueEntry.create({
      data: {
        seasonId,
        playerId,
        played: 1,
        wins: win,
        draws: draw,
        losses: loss,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
      }
    })
  }
}