// app/api/dashboard/season-progress/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Milestone {
  label: string;
  status: 'completed' | 'active' | 'pending';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the active season
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            fixtures: true,
            leagueEntries: true,
          }
        }
      }
    });

    if (!season) {
      return NextResponse.json({
        hasActiveSeason: false,
        message: "No active season found"
      });
    }

    // Calculate season progress
    const now = new Date();
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

    // Define milestones with explicit type
    const milestones: Milestone[] = [
      { label: 'Registration', status: 'completed' },
      { label: 'Fixtures', status: season.status === 'FIXTURE_LOCK' || season.status === 'LIVE' ? 'completed' : 'pending' },
      { label: 'Live', status: season.status === 'LIVE' ? 'active' : 'pending' },
      { label: 'Ended', status: season.status === 'ENDED' || season.status === 'ARCHIVED' ? 'completed' : 'pending' },
    ];

    // Check if user is enrolled
    const userEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId: season.id,
          playerId: userId,
        }
      }
    });

    return NextResponse.json({
      hasActiveSeason: true,
      seasonName: season.name,
      seasonId: season.id,
      status: season.status,
      startDate: season.startDate,
      endDate: season.endDate,
      progress,
      daysElapsed,
      totalDays,
      daysRemaining: Math.max(0, totalDays - daysElapsed),
      totalFixtures: season._count.fixtures,
      totalPlayers: season._count.leagueEntries,
      isEnrolled: !!userEntry,
      milestones,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching season progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch season progress" },
      { status: 500 }
    );
  }
}