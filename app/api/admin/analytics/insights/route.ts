import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const insights = [];

    // ✅ 1. Check user growth
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });
    const previousUsers = await prisma.user.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    if (recentUsers > previousUsers && recentUsers > 10) {
      insights.push({
        id: "user-growth",
        type: "positive",
        title: "📈 User Growth",
        description: `${recentUsers} new users joined in the last 30 days. ${recentUsers - previousUsers} more than previous period.`,
        action: "View Users",
        link: "/admin/players",
      });
    }

    // ✅ 2. Check pending results
    const pendingResults = await prisma.result.count({
      where: { approved: false },
    });

    if (pendingResults > 5) {
      insights.push({
        id: "pending-results",
        type: "warning",
        title: "⏳ Pending Results",
        description: `${pendingResults} results are awaiting approval. Review them to keep the league running smoothly.`,
        action: "Review Results",
        link: "/admin/results",
      });
    }

    // ✅ 3. Check low completion rate
    const totalMatches = await prisma.fixture.count();
    const completedMatches = await prisma.fixture.count({
      where: { status: "COMPLETED" },
    });
    const completionRate = totalMatches > 0
      ? (completedMatches / totalMatches) * 100
      : 0;

    if (completionRate < 50 && totalMatches > 10) {
      insights.push({
        id: "low-completion",
        type: "negative",
        title: "⚠️ Low Match Completion",
        description: `Only ${Math.round(completionRate)}% of matches are completed. Consider reaching out to players.`,
        action: "View Fixtures",
        link: "/admin/league",
      });
    }

    // ✅ 4. Check revenue milestones
    const totalRevenue = await prisma.seasonEntry.aggregate({
      where: { status: "ACTIVE" },
      _sum: { entryFee: true },
    });
    const totalRevenueSum = totalRevenue._sum.entryFee ?? 0;

    if (totalRevenueSum > 10000) {
      insights.push({
        id: "revenue-milestone",
        type: "positive",
        title: "💰 Revenue Milestone",
        description: `Total revenue has exceeded KES ${totalRevenueSum.toLocaleString()}! Great work.`,
        action: "View Analytics",
        link: "/admin/payments",
      });
    }

    // ✅ 5. Check inactive players
    const activeThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inactivePlayers = await prisma.user.count({
      where: {
        role: "PLAYER",
        lastActive: {
          lt: activeThreshold,
          not: null,
        },
      },
    });

    if (inactivePlayers > 10) {
      insights.push({
        id: "inactive-players",
        type: "info",
        title: "💤 Inactive Players",
        description: `${inactivePlayers} players haven't been active in 30 days. Consider re-engagement campaigns.`,
        action: "View Players",
        link: "/admin/players",
      });
    }

    // ✅ 6. Check tournament activity
    const activeTournaments = await prisma.tournament.count({
      where: { status: "ACTIVE" },
    });

    if (activeTournaments === 0) {
      insights.push({
        id: "no-tournaments",
        type: "info",
        title: "🏆 No Active Tournaments",
        description: "There are no active tournaments. Create one to engage players and increase competition.",
        action: "Create Tournament",
        link: "/admin/tournaments",
      });
    }

    // ✅ If no insights, add a default positive one
    if (insights.length === 0) {
      insights.push({
        id: "all-good",
        type: "positive",
        title: "✅ All Systems Good",
        description: "Everything is running smoothly. Keep up the great work!",
      });
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}