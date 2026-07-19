// app/api/dashboard/h2h/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface LastFiveMatch {
  result: 'W' | 'L' | 'D';
  score: string;
  date: Date;
  isHome: boolean;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const opponentId = searchParams.get("opponentId");

    if (!opponentId) {
      return NextResponse.json({ error: "Opponent ID required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Get all matches between these two players
    const matches = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: userId, awayPlayerId: opponentId },
          { homePlayerId: opponentId, awayPlayerId: userId }
        ],
        status: 'COMPLETED',
        result: { isNot: null }
      },
      include: {
        result: true,
        homePlayer: { select: { name: true } },
        awayPlayer: { select: { name: true } },
      },
      orderBy: { scheduledDate: 'desc' }
    });

    const totalMatches = matches.length;

    if (totalMatches === 0) {
      return NextResponse.json({
        hasHistory: false,
        message: "No previous matches against this opponent",
        totalMatches: 0,
      });
    }

    // Calculate stats
    let userWins = 0;
    let opponentWins = 0;
    let draws = 0;
    let userGoals = 0;
    let opponentGoals = 0;

    matches.forEach((match) => {
      const isUserHome = match.homePlayerId === userId;
      const userScore = isUserHome ? match.result?.homeScore || 0 : match.result?.awayScore || 0;
      const oppScore = isUserHome ? match.result?.awayScore || 0 : match.result?.homeScore || 0;

      userGoals += userScore;
      opponentGoals += oppScore;

      if (userScore > oppScore) userWins++;
      else if (userScore < oppScore) opponentWins++;
      else draws++;
    });

    const userWinRate = totalMatches > 0 ? Math.round((userWins / totalMatches) * 100) : 0;
    const opponentWinRate = totalMatches > 0 ? Math.round((opponentWins / totalMatches) * 100) : 0;
    const drawRate = totalMatches > 0 ? Math.round((draws / totalMatches) * 100) : 0;

    // Get last 5 results with explicit type
    const lastFive: LastFiveMatch[] = matches.slice(0, 5).map((match) => {
      const isUserHome = match.homePlayerId === userId;
      const userScore = isUserHome ? match.result?.homeScore || 0 : match.result?.awayScore || 0;
      const oppScore = isUserHome ? match.result?.awayScore || 0 : match.result?.homeScore || 0;
      
      let result: 'W' | 'L' | 'D';
      if (userScore > oppScore) result = 'W';
      else if (userScore < oppScore) result = 'L';
      else result = 'D';

      return {
        result,
        score: `${userScore} - ${oppScore}`,
        date: match.scheduledDate,
        isHome: match.homePlayerId === userId,
      };
    });

    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
      select: {
        name: true,
        profile: {
          select: {
            username: true,
          }
        }
      }
    });

    const opponentName = opponent?.profile?.username || opponent?.name || "Opponent";

    return NextResponse.json({
      hasHistory: true,
      opponentName,
      opponentId,
      totalMatches,
      userWins,
      opponentWins,
      draws,
      userGoals,
      opponentGoals,
      userWinRate,
      opponentWinRate,
      drawRate,
      lastFive,
      advantage: userWins > opponentWins ? 'user' : opponentWins > userWins ? 'opponent' : 'equal',
      advantageText: userWins > opponentWins 
        ? `You lead ${userWins}-${opponentWins}` 
        : opponentWins > userWins 
        ? `${opponentName} leads ${opponentWins}-${userWins}`
        : 'Evenly matched',
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching head-to-head stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch head-to-head stats" },
      { status: 500 }
    );
  }
}