// app/api/dashboard/upcoming-fixtures/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface WeeklyDistribution {
  week: number;
  startDate: Date;
  endDate: Date;
  count: number;
  label: string;
}

interface NextFixture {
  id: string;
  opponentName: string;
  isHome: boolean;
  scheduledDate: Date;
  status: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Get all upcoming fixtures for the user
    const upcomingFixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ],
        status: {
          in: ['SCHEDULED', 'LOCKED']
        },
        scheduledDate: {
          gte: now
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      include: {
        homePlayer: {
          select: {
            name: true,
            profile: {
              select: {
                username: true,
              }
            }
          }
        },
        awayPlayer: {
          select: {
            name: true,
            profile: {
              select: {
                username: true,
              }
            }
          }
        }
      }
    });

    // Count fixtures this week
    const thisWeekCount = upcomingFixtures.filter(f => 
      new Date(f.scheduledDate) <= weekFromNow
    ).length;

    // Group by week
    const weeklyDistribution: WeeklyDistribution[] = [];
    for (let i = 0; i < 6; i++) {
      const start = new Date(now);
      start.setDate(start.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const weekFixtures = upcomingFixtures.filter(f => {
        const date = new Date(f.scheduledDate);
        return date >= start && date < end;
      });

      weeklyDistribution.push({
        week: i + 1,
        startDate: start,
        endDate: end,
        count: weekFixtures.length,
        label: i === 0 ? 'This Week' : i === 1 ? 'Next Week' : `Week ${i + 1}`,
      });
    }

    // Get the next 3 fixtures
    const nextThree: NextFixture[] = upcomingFixtures.slice(0, 3).map(f => {
      const isHome = f.homePlayerId === userId;
      const opponent = isHome ? f.awayPlayer : f.homePlayer;
      const opponentName = opponent?.profile?.username || opponent?.name || "Opponent";

      return {
        id: f.id,
        opponentName,
        isHome,
        scheduledDate: f.scheduledDate,
        status: f.status,
      };
    });

    return NextResponse.json({
      totalUpcoming: upcomingFixtures.length,
      thisWeekCount,
      nextThree,
      weeklyDistribution,
      hasUpcoming: upcomingFixtures.length > 0,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching upcoming fixtures:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming fixtures" },
      { status: 500 }
    );
  }
}