import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")

    const userId = session.user.id

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        playerStats: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get league entry for the selected season
    let leagueEntry = null
    if (seasonId) {
      leagueEntry = await prisma.leagueEntry.findUnique({
        where: {
          seasonId_playerId: {
            seasonId: seasonId,
            playerId: userId
          }
        },
        include: {
          season: true
        }
      })
    }

    // Get all league entries for career stats
    const allLeagueEntries = await prisma.leagueEntry.findMany({
      where: { playerId: userId },
      include: {
        season: true
      },
      orderBy: {
        season: {
          startDate: 'desc'
        }
      }
    })

    // Get awards
    const awards = await prisma.award.findMany({
      where: { winnerId: userId },
      include: {
        season: true
      },
      orderBy: { awardedAt: 'desc' }
    })

// Calculate career totals
const careerStats = allLeagueEntries.reduce((acc, entry) => {
  acc.matches += entry.played
  acc.wins += entry.wins
  acc.draws += entry.draws
  acc.losses += entry.losses
  acc.points += entry.points
  acc.goalsFor += entry.goalsFor
  acc.goalsAgainst += entry.goalsAgainst
  return acc
}, {
  matches: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  points: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  winRate: 0
})

// Calculate derived stats
careerStats.goalDifference = careerStats.goalsFor - careerStats.goalsAgainst
careerStats.winRate = careerStats.matches > 0 ? Math.round((careerStats.wins / careerStats.matches) * 100) : 0
    // Format response
    const response = {
      profile: {
        username: profile.username,
        profilePicture: profile.profilePicture,
        trustScore: profile.trustScore,
        verifiedBadge: profile.verifiedBadge
      },
      seasonStats: leagueEntry ? {
        played: leagueEntry.played,
        wins: leagueEntry.wins,
        draws: leagueEntry.draws,
        losses: leagueEntry.losses,
        points: leagueEntry.points,
        goalsFor: leagueEntry.goalsFor,
        goalsAgainst: leagueEntry.goalsAgainst,
        goalDifference: leagueEntry.goalDifference,
        winRate: leagueEntry.played > 0 ? Math.round((leagueEntry.wins / leagueEntry.played) * 100) : 0,
        season: {
          id: leagueEntry.season.id,
          name: leagueEntry.season.name,
          status: leagueEntry.season.status
        }
      } : null,
      careerStats,
      awards,
      seasons: allLeagueEntries.map(entry => ({
        id: entry.season.id,
        name: entry.season.name,
        status: entry.season.status,
        points: entry.points,
        played: entry.played,
        wins: entry.wins,
        draws: entry.draws,
        losses: entry.losses
      })),
      totalSeasons: allLeagueEntries.length
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching player statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}