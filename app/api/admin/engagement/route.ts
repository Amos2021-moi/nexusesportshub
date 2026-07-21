// app/api/admin/engagement/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedEngagement = unstable_cache(
  async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ✅ Get ALL engagement metrics from database
    const [
      totalPlayers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      newToday,
      newThisWeek,
      newThisMonth,
      matchParticipation,
      totalMatches,
      resultsThisMonth,
      approvedResults,
      playersWithResults,
      // ✅ Get distinct users who submitted results
      distinctUsersWithResults,
    ] = await Promise.all([
      // Total players
      prisma.user.count({ where: { role: "PLAYER" } }),
      
      // Active today (players with lastActive today OR who submitted results today)
      prisma.user.count({
        where: {
          role: "PLAYER",
          OR: [
            { lastActive: { gte: today } },
            { submittedResults: { some: { createdAt: { gte: today } } } },
            { homeFixtures: { some: { scheduledDate: { gte: today } } } },
            { awayFixtures: { some: { scheduledDate: { gte: today } } } },
          ],
        },
      }),
      
      // Active this week
      prisma.user.count({
        where: {
          role: "PLAYER",
          OR: [
            { lastActive: { gte: weekAgo } },
            { submittedResults: { some: { createdAt: { gte: weekAgo } } } },
            { homeFixtures: { some: { scheduledDate: { gte: weekAgo } } } },
            { awayFixtures: { some: { scheduledDate: { gte: weekAgo } } } },
          ],
        },
      }),
      
      // Active this month
      prisma.user.count({
        where: {
          role: "PLAYER",
          OR: [
            { lastActive: { gte: monthAgo } },
            { submittedResults: { some: { createdAt: { gte: monthAgo } } } },
            { homeFixtures: { some: { scheduledDate: { gte: monthAgo } } } },
            { awayFixtures: { some: { scheduledDate: { gte: monthAgo } } } },
          ],
        },
      }),
      
      // New today
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: today },
        },
      }),
      
      // New this week
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: weekAgo },
        },
      }),
      
      // New this month
      prisma.user.count({
        where: {
          role: "PLAYER",
          createdAt: { gte: monthAgo },
        },
      }),
      
      // Match participation (players who have played at least one match)
      prisma.user.count({
        where: {
          role: "PLAYER",
          OR: [
            { homeFixtures: { some: {} } },
            { awayFixtures: { some: {} } },
          ],
        },
      }),
      
      // Total matches
      prisma.fixture.count(),
      
      // Results this month
      prisma.result.count({
        where: {
          createdAt: { gte: monthAgo },
          approved: true,
        },
      }),
      
      // Approved results
      prisma.result.count({
        where: { approved: true },
      }),
      
      // ✅ Players who have submitted approved results
      prisma.user.count({
        where: {
          role: "PLAYER",
          submittedResults: {
            some: {
              approved: true,
            },
          },
        },
      }),
      
      // ✅ Distinct users who have submitted ANY result
      prisma.result.findMany({
        where: {
          approved: true,
        },
        select: {
          submittedBy: true,
        },
        distinct: ['submittedBy'],
      }),
    ]);

    // ✅ Calculate rates
    const totalPlayersCount = totalPlayers || 0;
    const engagementRate = totalPlayersCount > 0
      ? Math.round((activeThisMonth / totalPlayersCount) * 100)
      : 0;

    const participationRate = totalPlayersCount > 0
      ? Math.round((matchParticipation / totalPlayersCount) * 100)
      : 0;

    // ✅ Get daily activity for the last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          role: "PLAYER",
          OR: [
            { lastActive: { gte: date, lt: nextDate } },
            { submittedResults: { some: { createdAt: { gte: date, lt: nextDate } } } },
          ],
        },
      });

      dailyActivity.push({
        date: date.toLocaleDateString("default", { 
          weekday: "short", 
          month: "short", 
          day: "numeric" 
        }),
        activePlayers: count || 0,
      });
    }

    return {
      active: {
        today: activeToday || 0,
        week: activeThisWeek || 0,
        month: activeThisMonth || 0,
      },
      new: {
        today: newToday || 0,
        week: newThisWeek || 0,
        month: newThisMonth || 0,
      },
      totalPlayers: totalPlayersCount,
      matchParticipation: matchParticipation || 0,
      engagementRate: engagementRate || 0,
      participationRate: participationRate || 0,
      totalMatches: totalMatches || 0,
      resultsThisMonth: resultsThisMonth || 0,
      approvedResults: approvedResults || 0,
      playersWithResults: playersWithResults || 0,
      distinctUsersWithResults: distinctUsersWithResults.length || 0,
      dailyActivity: dailyActivity,
    };
  },
  ["admin-engagement"],
  { revalidate: 30 } // Cache for 30 seconds
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getCachedEngagement();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching engagement data:", error);
    return NextResponse.json(
      {
        active: { today: 0, week: 0, month: 0 },
        new: { today: 0, week: 0, month: 0 },
        totalPlayers: 0,
        matchParticipation: 0,
        engagementRate: 0,
        participationRate: 0,
        totalMatches: 0,
        resultsThisMonth: 0,
        approvedResults: 0,
        playersWithResults: 0,
        distinctUsersWithResults: 0,
        dailyActivity: [],
      },
      { status: 200 }
    );
  }
}