// app/api/admin/tournament-health/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get tournament health metrics using correct model names
    const [
      totalTournaments,
      activeTournaments,
      pendingTournaments,
      completedTournaments,
      totalMatches,
      completedMatches,
      tournamentTypes,
      recentTournaments,
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: "ACTIVE" } }),
      prisma.tournament.count({ where: { status: "PENDING" } }),
      prisma.tournament.count({ where: { status: "COMPLETED" } }),
      prisma.tournamentMatch.count(),
      prisma.tournamentMatch.count({ where: { status: "COMPLETED" } }),
      // Tournament types breakdown
      prisma.tournament.groupBy({
        by: ["type"],
        _count: true,
      }),
      // Recent tournaments
      prisma.tournament.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          type: true,
          startDate: true,
          endDate: true,
          participants: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const completionRate = totalMatches > 0
      ? Math.round((completedMatches / totalMatches) * 100)
      : 0;

    const healthStatus = 
      completionRate >= 80 ? "healthy" :
      completionRate >= 50 ? "warning" :
      "critical";

    // Format tournament types
    const typeBreakdown = tournamentTypes.reduce((acc, curr) => {
      acc[curr.type] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary: {
        totalTournaments,
        activeTournaments,
        pendingTournaments,
        completedTournaments,
        totalMatches,
        completedMatches,
        completionRate,
        healthStatus,
      },
      typeBreakdown,
      recentTournaments: recentTournaments.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        type: t.type,
        startDate: t.startDate,
        endDate: t.endDate,
        participants: t.participants.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching tournament health:", error);
    return NextResponse.json(
      {
        summary: {
          totalTournaments: 0,
          activeTournaments: 0,
          pendingTournaments: 0,
          completedTournaments: 0,
          totalMatches: 0,
          completedMatches: 0,
          completionRate: 0,
          healthStatus: "unknown",
        },
        typeBreakdown: {},
        recentTournaments: [],
      },
      { status: 200 }
    );
  }
}