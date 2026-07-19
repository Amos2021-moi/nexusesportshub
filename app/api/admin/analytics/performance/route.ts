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

    // ✅ Get all seasons
    const seasons = await prisma.season.findMany({
      include: {
        _count: {
          select: {
            fixtures: true,
            leagueEntries: true,
          },
        },
      },
    });

    // ✅ Calculate performance metrics
    const metrics = [];

    for (const season of seasons) {
      const totalMatches = season._count.fixtures || 0;
      const completedMatches = await prisma.fixture.count({
        where: {
          seasonId: season.id,
          status: "COMPLETED",
        },
      });

      const players = season._count.leagueEntries || 0;
      const completionRate = totalMatches > 0
        ? (completedMatches / totalMatches) * 100
        : 0;

      // ✅ Get season revenue
      const revenue = await prisma.seasonEntry.aggregate({
        where: {
          seasonId: season.id,
          status: "ACTIVE",
        },
        _sum: {
          entryFee: true,
        },
      });

      metrics.push({
        seasonId: season.id,
        seasonName: season.name,
        matches: totalMatches,
        completedMatches,
        players,
        revenue: revenue._sum.entryFee || 0,
        completionRate: Math.round(completionRate * 10) / 10,
        status: season.status,
        isActive: season.isActive,
      });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}