// app/api/dashboard/achievements/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date | null;
  progress?: number;
  maxProgress?: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [results, profile, awards] = await Promise.all([
      prisma.result.findMany({
        where: {
          approved: true,
          OR: [
            { fixture: { homePlayerId: userId } },
            { fixture: { awayPlayerId: userId } }
          ]
        },
        include: {
          fixture: {
            include: {
              homePlayer: { select: { name: true } },
              awayPlayer: { select: { name: true } },
            }
          }
        }
      }),
      prisma.profile.findUnique({
        where: { userId },
        select: {
          totalWins: true,
          totalDraws: true,
          totalLosses: true,
          goalsFor: true,
          goalsAgainst: true,
          trustScore: true,
        }
      }),
      prisma.award.findMany({
        where: { winnerId: userId },
        include: { season: { select: { name: true } } }
      })
    ]);

    const totalMatches = results.length;
    const wins = results.filter(r => {
      if (!r.fixture) return false;
      const isHome = r.fixture.homePlayerId === userId;
      return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
    }).length;
    
    const goalsScored = results.reduce((sum, r) => {
      if (!r.fixture) return sum;
      const isHome = r.fixture.homePlayerId === userId;
      return sum + (isHome ? r.homeScore : r.awayScore);
    }, 0);

    const achievements: Achievement[] = [];

    if (wins >= 1) {
      achievements.push({
        id: 'first-win',
        icon: '🏆',
        title: 'First Win',
        description: 'Won your first match',
        unlocked: true,
        unlockedAt: results.find(r => {
          if (!r.fixture) return false;
          const isHome = r.fixture.homePlayerId === userId;
          return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
        })?.createdAt,
      });
    }

    if (wins >= 5) {
      achievements.push({
        id: 'five-wins',
        icon: '🥇',
        title: '5 Wins Club',
        description: 'Won 5 matches',
        unlocked: true,
        progress: Math.min(wins, 5),
        maxProgress: 5,
      });
    }

    if (wins >= 10) {
      achievements.push({
        id: 'ten-wins',
        icon: '👑',
        title: '10 Wins Club',
        description: 'Won 10 matches',
        unlocked: true,
        progress: Math.min(wins, 10),
        maxProgress: 10,
      });
    }

    if (goalsScored >= 1) {
      achievements.push({
        id: 'first-goal',
        icon: '⚽',
        title: 'First Goal',
        description: 'Scored your first goal',
        unlocked: true,
      });
    }

    if (goalsScored >= 10) {
      achievements.push({
        id: 'ten-goals',
        icon: '🎯',
        title: '10 Goals Club',
        description: 'Scored 10 goals',
        unlocked: true,
        progress: Math.min(goalsScored, 10),
        maxProgress: 10,
      });
    }

    if (totalMatches >= 20) {
      achievements.push({
        id: 'twenty-matches',
        icon: '🏅',
        title: '20 Matches Veteran',
        description: 'Played 20 matches',
        unlocked: true,
        progress: Math.min(totalMatches, 20),
        maxProgress: 20,
      });
    }

    if (profile?.trustScore && profile.trustScore >= 70) {
      achievements.push({
        id: 'rising-star',
        icon: '🌟',
        title: 'Rising Star',
        description: 'Achieved trust score of 70+',
        unlocked: true,
      });
    }

    if (profile?.trustScore && profile.trustScore >= 85) {
      achievements.push({
        id: 'hall-of-fame',
        icon: '🏛️',
        title: 'Hall of Fame Candidate',
        description: 'Achieved trust score of 85+',
        unlocked: true,
      });
    }

    awards.forEach(award => {
      achievements.push({
        id: `award-${award.id}`,
        icon: '🎖️',
        title: award.name,
        description: `${award.category} - ${award.season.name}`,
        unlocked: true,
        unlockedAt: award.awardedAt,
      });
    });

    const lockedAchievements: Achievement[] = [
      { id: 'fifty-goals', icon: '⚡', title: '50 Goals Club', description: 'Score 50 goals', unlocked: false, progress: Math.min(goalsScored, 50), maxProgress: 50 },
      { id: 'fifty-wins', icon: '👑', title: '50 Wins Club', description: 'Win 50 matches', unlocked: false, progress: Math.min(wins, 50), maxProgress: 50 },
      { id: 'century-matches', icon: '💎', title: '100 Matches Legend', description: 'Play 100 matches', unlocked: false, progress: Math.min(totalMatches, 100), maxProgress: 100 },
      { id: 'perfect-trust', icon: '⭐', title: 'Perfect Trust', description: 'Achieve 100 trust score', unlocked: false, progress: profile?.trustScore || 0, maxProgress: 100 },
    ];

    lockedAchievements.forEach(a => {
      if (!achievements.find(ach => ach.id === a.id)) {
        achievements.push(a);
      }
    });

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalAchievements = achievements.length;

    return NextResponse.json({
      achievements,
      unlockedCount,
      totalAchievements,
      progress: Math.round((unlockedCount / totalAchievements) * 100),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}