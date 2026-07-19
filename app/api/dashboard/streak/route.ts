// app/api/dashboard/streak/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ResultType = 'win' | 'loss' | 'draw';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const results = await prisma.result.findMany({
      where: {
        approved: true,
        OR: [
          { fixture: { homePlayerId: userId } },
          { fixture: { awayPlayerId: userId } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fixture: {
          include: {
            homePlayer: { select: { name: true } },
            awayPlayer: { select: { name: true } },
          }
        }
      },
      take: 20,
    });

    let currentStreak = 0;
    let streakType: ResultType | null = null;
    let bestStreak = 0;
    let bestStreakType: ResultType = 'win';

    results.forEach((result, index) => {
      // Null check for fixture
      if (!result.fixture) return;

      const isHome = result.fixture.homePlayerId === userId;
      const isWin = isHome 
        ? result.homeScore > result.awayScore
        : result.awayScore > result.homeScore;
      const isDraw = result.homeScore === result.awayScore;
      
      let resultType: ResultType;
      if (isWin) resultType = 'win';
      else if (isDraw) resultType = 'draw';
      else resultType = 'loss';

      if (index === 0) {
        currentStreak = 1;
        streakType = resultType;
      } else if (resultType === streakType) {
        currentStreak++;
      } else {
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
          bestStreakType = streakType!;
        }
        currentStreak = 1;
        streakType = resultType;
      }

      if (index === results.length - 1) {
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
          bestStreakType = streakType!;
        }
      }
    });

    const totalWins = results.filter(r => {
      if (!r.fixture) return false;
      const isHome = r.fixture.homePlayerId === userId;
      return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
    }).length;

    const totalLosses = results.filter(r => {
      if (!r.fixture) return false;
      const isHome = r.fixture.homePlayerId === userId;
      return isHome ? r.homeScore < r.awayScore : r.awayScore < r.homeScore;
    }).length;

    const totalDraws = results.filter(r => r.homeScore === r.awayScore).length;

    const streakEmojis: Record<ResultType, string> = {
      win: '🔥',
      loss: '❄️',
      draw: '🤝',
    };

    const streakLabels: Record<ResultType, string> = {
      win: 'Hot Streak!',
      loss: 'Cold Streak',
      draw: 'Drawing Streak',
    };

    const streakColors: Record<ResultType, string> = {
      win: 'text-green-400',
      loss: 'text-red-400',
      draw: 'text-yellow-400',
    };

    const activeType: ResultType = streakType || 'win';

    return NextResponse.json({
      currentStreak,
      streakType: activeType,
      streakEmoji: streakEmojis[activeType],
      streakLabel: streakLabels[activeType],
      streakColor: streakColors[activeType],
      bestStreak,
      bestStreakType,
      bestStreakEmoji: streakEmojis[bestStreakType],
      totalWins,
      totalLosses,
      totalDraws,
      totalMatches: results.length,
      hasResults: results.length > 0,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    return NextResponse.json(
      { error: "Failed to fetch streak" },
      { status: 500 }
    );
  }
}