// app/api/public/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ✅ Get all stats in parallel for performance
    const [totalPlayers, totalFixtures, totalTournaments, totalAwards, totalSeasons, totalNews] = await Promise.all([
      prisma.user.count(),
      prisma.fixture.count(),
      prisma.tournament.count(),
      prisma.award.count(),
      prisma.season.count(),
      prisma.news.count({ where: { published: true } }),
    ]);

    // ✅ Get active players (users who have played in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Count distinct users who have results in the last 30 days.
    // Some Prisma schemas don't allow filtering User by relation name `results` in this context,
    // so query the Result model directly and count unique users.
    const recentResultUsers = await prisma.result.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { user: { select: { id: true } } },
    });
    const activePlayers = new Set(recentResultUsers.map((result) => result.user.id)).size;

    // ✅ Get completion rate (matches with results vs total matches)
    const totalMatches = await prisma.fixture.count();
    const completedMatches = await prisma.fixture.count({
      where: {
        status: "COMPLETED"
      }
    });
    const completionRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    return NextResponse.json({
      totalPlayers,
      totalFixtures,
      totalTournaments,
      totalAwards,
      totalSeasons,
      totalNews,
      activePlayers,
      completionRate,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    // ✅ Return default values instead of error
    return NextResponse.json({
      totalPlayers: 0,
      totalFixtures: 0,
      totalTournaments: 0,
      totalAwards: 0,
      totalSeasons: 0,
      totalNews: 0,
      activePlayers: 0,
      completionRate: 0,
    });
  }
}