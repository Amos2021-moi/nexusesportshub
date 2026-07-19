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

    // Get season with all related data
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        leagueEntries: {
          include: {
            player: {
              include: { profile: true }
            }
          },
          orderBy: [
            { points: 'desc' },
            { goalDifference: 'desc' },
            { goalsFor: 'desc' }
          ]
        },
        fixtures: {
          include: {
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            },
            result: true
          },
          where: {
            status: "COMPLETED"
          }
        },
        awards: {
          include: {
            winner: {
              include: { profile: true }
            }
          }
        },
        hallOfFame: {
          include: {
            player: {
              include: { profile: true }
            }
          }
        },
        tournaments: {
          include: {
            participants: {
              include: {
                player: {
                  include: { profile: true }
                }
              }
            },
            matches: {
              include: {
                homePlayer: { include: { profile: true } },
                awayPlayer: { include: { profile: true } },
                winner: { include: { profile: true } }
              }
            }
          },
          where: {
            status: "COMPLETED"
          }
        }
      }
    })

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 })
    }

    // Calculate additional stats
    const totalMatches = season.fixtures.length
    const completedMatches = season.fixtures.filter(f => f.status === "COMPLETED").length
    const totalGoals = season.fixtures.reduce((sum, f) => {
      return sum + (f.homeScore || 0) + (f.awayScore || 0)
    }, 0)

    // Find top scorer (from league entries)
    const topScorer = season.leagueEntries.length > 0 
      ? season.leagueEntries.reduce((max, entry) => 
          entry.goalsFor > max.goalsFor ? entry : max
        , season.leagueEntries[0])
      : null

    // Find champion
    const champion = season.leagueEntries.length > 0 ? season.leagueEntries[0] : null

    return NextResponse.json({
      season,
      stats: {
        totalMatches,
        completedMatches,
        totalGoals,
        completionRate: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
        totalPlayers: season.leagueEntries.length,
        totalAwards: season.awards.length,
        totalTournaments: season.tournaments.length
      },
      champion: champion ? {
        id: champion.playerId,
        name: champion.player.profile?.username || champion.player.name,
        points: champion.points,
        wins: champion.wins,
        draws: champion.draws,
        losses: champion.losses,
        goalsFor: champion.goalsFor,
        goalsAgainst: champion.goalsAgainst,
        profilePicture: champion.player.profile?.profilePicture
      } : null,
      topScorer: topScorer ? {
        name: topScorer.player.profile?.username || topScorer.player.name,
        goals: topScorer.goalsFor
      } : null
    })
  } catch (error) {
    console.error("Error fetching season archive:", error)
    return NextResponse.json({ error: "Failed to fetch season archive" }, { status: 500 })
  }
}