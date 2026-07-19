// app/api/dashboard/next-match/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
  formatted: string;
  urgencyLabel: string;
  urgencyColor: string;
  urgencyBg: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const startTime = performance.now();

    // ✅ OPTIMIZED: Single query with all needed data
    const result = await prisma.$queryRaw<{
      id: string;
      scheduledDate: Date;
      isHome: boolean;
      opponentId: string;
      opponentName: string;
      seasonName: string;
      status: string;
      hasResult: boolean;
      days: number;
      hours: number;
      minutes: number;
    }[]>`
      SELECT 
        f.id,
        f."scheduledDate",
        f."homePlayerId" = ${userId} as "isHome",
        CASE 
          WHEN f."homePlayerId" = ${userId} THEN f."awayPlayerId"
          ELSE f."homePlayerId"
        END as "opponentId",
        CASE 
          WHEN f."homePlayerId" = ${userId} 
          THEN COALESCE(away_profile.username, away_user.name)
          ELSE COALESCE(home_profile.username, home_user.name)
        END as "opponentName",
        s.name as "seasonName",
        f.status,
        CASE 
          WHEN r.id IS NOT NULL THEN true
          ELSE false
        END as "hasResult",
        EXTRACT(DAY FROM (f."scheduledDate" - NOW()))::int as days,
        EXTRACT(HOUR FROM (f."scheduledDate" - NOW()))::int % 24 as hours,
        EXTRACT(MINUTE FROM (f."scheduledDate" - NOW()))::int % 60 as minutes
      FROM "Fixture" f
      LEFT JOIN "User" home_user ON f."homePlayerId" = home_user.id
      LEFT JOIN "Profile" home_profile ON home_user.id = home_profile."userId"
      LEFT JOIN "User" away_user ON f."awayPlayerId" = away_user.id
      LEFT JOIN "Profile" away_profile ON away_user.id = away_profile."userId"
      LEFT JOIN "Season" s ON f."seasonId" = s.id
      LEFT JOIN "Result" r ON r."fixtureId" = f.id AND r."submittedBy" = ${userId}
      WHERE (f."homePlayerId" = ${userId} OR f."awayPlayerId" = ${userId})
        AND f.status IN ('SCHEDULED', 'LOCKED')
        AND f."scheduledDate" >= NOW()
      ORDER BY f."scheduledDate" ASC
      LIMIT 1
    `;

    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.log(`📊 Next match fetched in ${duration.toFixed(0)}ms`);
    }

    if (!result || result.length === 0) {
      return NextResponse.json({
        hasNextMatch: false,
        message: "No upcoming matches scheduled"
      });
    }

    const data = result[0];
    const diffDays = data.days || 0;
    const diffHours = data.hours || 0;
    const diffMinutes = data.minutes || 0;

    // ✅ Determine urgency label
    let urgencyLabel = 'Upcoming';
    let urgencyColor = 'text-blue-400';
    let urgencyBg = 'bg-blue-500/20';
    
    if (diffDays === 0 && diffHours < 24) {
      urgencyLabel = '🟢 Today!';
      urgencyColor = 'text-green-400';
      urgencyBg = 'bg-green-500/20';
    } else if (diffDays === 1) {
      urgencyLabel = '🟡 Tomorrow';
      urgencyColor = 'text-yellow-400';
      urgencyBg = 'bg-yellow-500/20';
    } else if (diffDays <= 3) {
      urgencyLabel = `🔵 In ${diffDays} days`;
      urgencyColor = 'text-blue-400';
      urgencyBg = 'bg-blue-500/20';
    }

    const totalSeconds = diffDays * 86400 + diffHours * 3600 + diffMinutes * 60;

    const countdown: Countdown = {
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
      totalSeconds,
      formatted: `${diffDays}d ${diffHours}h ${diffMinutes}m`,
      urgencyLabel,
      urgencyColor,
      urgencyBg,
    };

    return NextResponse.json({
      hasNextMatch: true,
      fixtureId: data.id,
      opponentName: data.opponentName || "Opponent",
      opponentId: data.opponentId,
      isHome: data.isHome,
      scheduledDate: data.scheduledDate,
      seasonName: data.seasonName,
      countdown,
      hasSubmittedResult: data.hasResult,
      status: data.status,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching next match:", error);
    return NextResponse.json(
      { error: "Failed to fetch next match" },
      { status: 500 }
    );
  }
}