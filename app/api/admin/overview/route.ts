// app/api/admin/overview/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const CACHE_DURATION = 30; // seconds

const getCachedOverview = unstable_cache(
  async () => {
    const startTime = performance.now();

    // ✅ Get all metrics in parallel using correct model names
    const [
      totalPlayers,
      activePlayers,
      totalFixtures,
      completedResults,
      pendingResults,
      totalTournaments,
      activeTournaments,
      totalSeasons,
      activeSeasons,
      totalSquads,
      totalRevenue,
      pendingPayments,
      totalAwards,
      totalReports,
      pendingReports,
      totalNews,
      totalResults,
    ] = await Promise.all([
      // Player counts
      prisma.user.count({ where: { role: "PLAYER" } }),
      prisma.user.count({
        where: {
          role: "PLAYER",
          lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      // Fixtures
      prisma.fixture.count(),
      prisma.result.count({ where: { approved: true } }),
      prisma.result.count({ where: { approved: false } }),
      // Tournaments
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: "ACTIVE" } }),
      // Seasons
      prisma.season.count(),
      prisma.season.count({ where: { isActive: true } }),
      // Squads
      prisma.squad.count(),
      // Revenue from SeasonEntry (using entryFee)
      prisma.seasonEntry.aggregate({
        _sum: { entryFee: true },
      }),
      // Pending payments
      prisma.seasonEntry.count({
        where: { status: "PAYMENT_PENDING" },
      }),
      // Awards
      prisma.award.count(),
      // Reports
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      // News
      prisma.news.count({ where: { published: true } }),
      // Total results
      prisma.result.count(),
    ]);

    // Calculate growth metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newPlayersLast30Days = await prisma.user.count({
      where: {
        role: "PLAYER",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const newResultsLast30Days = await prisma.result.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const duration = performance.now() - startTime;

    // Calculate rates
    const completionRate = totalFixtures > 0
      ? Math.round((completedResults / totalFixtures) * 100)
      : 0;

    const engagementRate = totalPlayers > 0
      ? Math.round((activePlayers / totalPlayers) * 100)
      : 0;

    const pendingRate = totalResults > 0
      ? Math.round((pendingResults / totalResults) * 100)
      : 0;

    return {
      stats: {
        totalPlayers,
        activePlayers,
        totalFixtures,
        completedResults,
        pendingResults,
        totalTournaments,
        activeTournaments,
        totalSeasons,
        activeSeasons,
        totalSquads,
        totalRevenue: totalRevenue._sum?.entryFee || 0,
        pendingPayments,
        totalAwards,
        totalReports,
        pendingReports,
        totalNews,
        totalResults,
        completionRate,
        engagementRate,
        pendingRate,
      },
      growth: {
        newPlayers: newPlayersLast30Days,
        newResults: newResultsLast30Days,
        playerGrowthRate: totalPlayers > 0
          ? Math.round((newPlayersLast30Days / totalPlayers) * 100)
          : 0,
        resultGrowthRate: totalResults > 0
          ? Math.round((newResultsLast30Days / totalResults) * 100)
          : 0,
      },
      system: {
        queryTime: Math.round(duration),
        cachedAt: new Date().toISOString(),
      },
    };
  },
  ["admin-dashboard-overview"],
  { revalidate: CACHE_DURATION }
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await getCachedOverview();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      {
        stats: {
          totalPlayers: 0,
          activePlayers: 0,
          totalFixtures: 0,
          completedResults: 0,
          pendingResults: 0,
          totalTournaments: 0,
          activeTournaments: 0,
          totalSeasons: 0,
          activeSeasons: 0,
          totalSquads: 0,
          totalRevenue: 0,
          pendingPayments: 0,
          totalAwards: 0,
          totalReports: 0,
          pendingReports: 0,
          totalNews: 0,
          totalResults: 0,
          completionRate: 0,
          engagementRate: 0,
          pendingRate: 0,
        },
        growth: {
          newPlayers: 0,
          newResults: 0,
          playerGrowthRate: 0,
          resultGrowthRate: 0,
        },
        system: {
          queryTime: 0,
          cachedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  }
}