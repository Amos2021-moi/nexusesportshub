import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get match with all related data
    const match = await prisma.fixture.findUnique({
      where: { id },
      include: {
        homePlayer: {
          include: {
            profile: true,
            squads: {
              where: { isActive: true },
              take: 1
            }
          }
        },
        awayPlayer: {
          include: {
            profile: true,
            squads: {
              where: { isActive: true },
              take: 1
            }
          }
        },
        season: {
          include: {
            leagueSettings: true,
          },
        },
        result: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // ✅ Check if match is locked or completed
    if (match.status === "COMPLETED" || match.status === "PENDING") {
      // Allow viewing completed/pending matches without payment check
      // Continue to return data
    } else {
      // ✅ For scheduled/locked matches, check payment
      const leagueSettings = match.season?.leagueSettings

      if (leagueSettings?.paymentRequired) {
        // ✅ Check if current user has paid
        const playerEntry = await prisma.playerSeasonEntry.findUnique({
          where: {
            userId_seasonId: {
              userId: session.user.id,
              seasonId: match.seasonId,
            },
          },
        })

        const seasonEntry = await prisma.seasonEntry.findUnique({
          where: {
            userId_seasonId: {
              userId: session.user.id,
              seasonId: match.seasonId,
            },
          },
        })

        const hasPaid = playerEntry?.hasPaid || seasonEntry?.status === "ACTIVE"

        // ✅ If not paid, return limited data with payment info
        if (!hasPaid) {
          return NextResponse.json({
            match: {
              id: match.id,
              status: match.status,
              scheduledDate: match.scheduledDate,
              homePlayer: {
                name: match.homePlayer?.name || "Home Player",
                profile: {
                  username: match.homePlayer?.profile?.username || "Home",
                  profilePicture: match.homePlayer?.profile?.profilePicture || null,
                }
              },
              awayPlayer: {
                name: match.awayPlayer?.name || "Away Player",
                profile: {
                  username: match.awayPlayer?.profile?.username || "Away",
                  profilePicture: match.awayPlayer?.profile?.profilePicture || null,
                }
              },
              season: {
                name: match.season?.name || "Season",
              },
            },
            paymentRequired: true,
            hasPaid: false,
            message: "Payment required to view full match details. Please pay on your dashboard.",
            headToHead: { homeWins: 0, awayWins: 0, draws: 0, total: 0 },
            homeForm: [],
            awayForm: [],
          })
        }
      }
    }

    // Get head-to-head history
    const headToHead = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: match.homePlayerId, awayPlayerId: match.awayPlayerId },
          { homePlayerId: match.awayPlayerId, awayPlayerId: match.homePlayerId }
        ],
        status: "COMPLETED",
        id: { not: id }
      },
      include: {
        result: true
      }
    })

    // Calculate head-to-head stats
    let homeWins = 0, awayWins = 0, draws = 0
    for (const h2h of headToHead) {
      if (h2h.result) {
        const isHome = h2h.homePlayerId === match.homePlayerId
        const homeScore = isHome ? h2h.result.homeScore : h2h.result.awayScore
        const awayScore = isHome ? h2h.result.awayScore : h2h.result.homeScore
        if (homeScore > awayScore) homeWins++
        else if (awayScore > homeScore) awayWins++
        else draws++
      }
    }

    // Get recent form (last 5 matches for each player)
    const homeForm = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: match.homePlayerId },
          { awayPlayerId: match.homePlayerId }
        ],
        status: "COMPLETED",
        id: { not: id }
      },
      include: { result: true },
      orderBy: { scheduledDate: 'desc' },
      take: 5
    })

    const awayForm = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: match.awayPlayerId },
          { awayPlayerId: match.awayPlayerId }
        ],
        status: "COMPLETED",
        id: { not: id }
      },
      include: { result: true },
      orderBy: { scheduledDate: 'desc' },
      take: 5
    })

    const formatResult = (fixture: any, playerId: string) => {
      if (!fixture.result) return "N/A"
      const isHome = fixture.homePlayerId === playerId
      const myScore = isHome ? fixture.result.homeScore : fixture.result.awayScore
      const oppScore = isHome ? fixture.result.awayScore : fixture.result.homeScore
      if (myScore > oppScore) return "W"
      if (myScore < oppScore) return "L"
      return "D"
    }

    const homeFormResults = homeForm.map(f => formatResult(f, match.homePlayerId))
    const awayFormResults = awayForm.map(f => formatResult(f, match.awayPlayerId))

    return NextResponse.json({
      match,
      headToHead: { homeWins, awayWins, draws, total: headToHead.length },
      homeForm: homeFormResults,
      awayForm: awayFormResults,
      paymentRequired: false,
      hasPaid: true,
    })
  } catch (error) {
    console.error("Error fetching match:", error)
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 })
  }
}