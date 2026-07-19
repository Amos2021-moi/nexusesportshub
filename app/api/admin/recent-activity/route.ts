import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const activities = []

    // Get recent fixture results (league)
    const recentResults = await prisma.result.findMany({
      where: { 
        source: "LEAGUE",
        approved: true 
      },
      include: {
        fixture: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // ✅ Only process if fixture exists
    for (const result of recentResults) {
      if (result.fixture) {
        const homeName = result.fixture.homePlayer?.profile?.username || 
                         result.fixture.homePlayer?.name || 
                         "Home Player"
        const awayName = result.fixture.awayPlayer?.profile?.username || 
                         result.fixture.awayPlayer?.name || 
                         "Away Player"
        
        activities.push({
          id: `result-${result.id}`,
          type: "RESULT_APPROVED",
          title: `⚽ ${homeName} ${result.homeScore} - ${result.awayScore} ${awayName}`,
          description: `Match result approved`,
          timestamp: result.createdAt,
          icon: "Trophy",
          link: `/matches/${result.fixtureId}`
        })
      }
    }

    // Get recent tournament results
    const recentTournamentResults = await prisma.result.findMany({
      where: { 
        source: "TOURNAMENT",
        approved: true 
      },
      include: {
        tournamentMatch: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
            tournament: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // ✅ Process tournament results
    for (const result of recentTournamentResults) {
      if (result.tournamentMatch) {
        const homeName = result.tournamentMatch.homePlayer?.profile?.username || 
                         result.tournamentMatch.homePlayer?.name || 
                         "Home Player"
        const awayName = result.tournamentMatch.awayPlayer?.profile?.username || 
                         result.tournamentMatch.awayPlayer?.name || 
                         "Away Player"
        const tournamentName = result.tournamentMatch.tournament?.name || "Tournament"
        
        activities.push({
          id: `tournament-result-${result.id}`,
          type: "TOURNAMENT_RESULT",
          title: `🏆 ${homeName} ${result.homeScore} - ${result.awayScore} ${awayName}`,
          description: `Tournament result approved in ${tournamentName}`,
          timestamp: result.createdAt,
          icon: "Crown",
          link: `/tournaments/${result.tournamentMatch.tournamentId}`
        })
      }
    }

    // Get recent fixtures created
    const recentFixtures = await prisma.fixture.findMany({
      include: {
        homePlayer: { include: { profile: true } },
        awayPlayer: { include: { profile: true } },
        season: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    for (const fixture of recentFixtures) {
      const homeName = fixture.homePlayer?.profile?.username || 
                       fixture.homePlayer?.name || 
                       "Home Player"
      const awayName = fixture.awayPlayer?.profile?.username || 
                       fixture.awayPlayer?.name || 
                       "Away Player"
      
      activities.push({
        id: `fixture-${fixture.id}`,
        type: "FIXTURE_CREATED",
        title: `📅 ${homeName} vs ${awayName}`,
        description: `New fixture created for ${fixture.season?.name || "Season"}`,
        timestamp: fixture.createdAt,
        icon: "Calendar",
        link: `/dashboard/fixtures`
      })
    }

    // Get recent player registrations
    const recentUsers = await prisma.user.findMany({
      where: { role: "PLAYER" },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    for (const user of recentUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: "USER_REGISTERED",
        title: `👤 ${user.profile?.username || user.name || "New Player"}`,
        description: `New player registered`,
        timestamp: user.createdAt,
        icon: "User",
        link: `/admin/players`
      })
    }

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return only the latest 20 activities
    return NextResponse.json(activities.slice(0, 20))
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json([])
  }
}