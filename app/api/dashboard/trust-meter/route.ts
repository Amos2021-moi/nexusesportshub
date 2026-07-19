// app/api/dashboard/trust-meter/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Tier {
  label: string;
  min: number;
  max: number;
  color: string;
  bg: string;
}

interface Component {
  label: string;
  value: number;
  weight: string;
  icon: string;
  color: string;
  bg: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        trustScore: true,
        totalWins: true,
        totalDraws: true,
        totalLosses: true,
        verifiedBadge: true,
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const fixtures = await prisma.fixture.findMany({
      where: {
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId }
        ]
      },
      select: {
        status: true,
        result: {
          select: { approved: true }
        }
      }
    });

    const totalFixtures = fixtures.length;
    const completedFixtures = fixtures.filter(f => f.status === 'COMPLETED').length;
    const approvedResults = fixtures.filter(f => f.result?.approved === true).length;

    const matchCompletionRate = totalFixtures > 0 ? Math.round((completedFixtures / totalFixtures) * 100) : 0;
    const resultConsistencyRate = totalFixtures > 0 ? Math.round((approvedResults / totalFixtures) * 100) : 0;
    const reportAccuracyRate = 85; 
    const activityLevel = Math.min(100, Math.round((totalFixtures / 20) * 100));
    const sportsmanshipScore = 75; 

    const weightedScore = Math.round(
      (matchCompletionRate * 0.30) +
      (resultConsistencyRate * 0.25) +
      (reportAccuracyRate * 0.20) +
      (activityLevel * 0.15) +
      (sportsmanshipScore * 0.10)
    );

    const tiers: Tier[] = [
      { label: 'Beginner', min: 0, max: 30, color: 'text-gray-400', bg: 'bg-gray-500/20' },
      { label: 'Rising', min: 31, max: 50, color: 'text-blue-400', bg: 'bg-blue-500/20' },
      { label: 'Trusted', min: 51, max: 70, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
      { label: 'Verified', min: 71, max: 85, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
      { label: 'Elite', min: 86, max: 100, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    ];

    const currentTier = tiers.find(t => weightedScore >= t.min && weightedScore <= t.max) || tiers[0];
    const nextTier = tiers.find(t => t.min > weightedScore);

    let nextTierProgress = 100;
    let nextTierName = 'Max Level';
    if (nextTier) {
      const currentMin = currentTier.min;
      const nextMin = nextTier.min;
      nextTierProgress = Math.round(((weightedScore - currentMin) / (nextMin - currentMin)) * 100);
      nextTierName = nextTier.label;
    }

    const totalPlayers = await prisma.user.count({ where: { role: 'PLAYER' } });
    const rank = await prisma.profile.count({
      where: { trustScore: { gt: profile.trustScore || 0 } }
    }) + 1;

    const components: Component[] = [
      { label: 'Match Completion', value: matchCompletionRate, weight: '30%', icon: '✅', color: matchCompletionRate > 70 ? 'text-emerald-400' : 'text-yellow-400', bg: matchCompletionRate > 70 ? 'bg-emerald-500/20' : 'bg-yellow-500/20' },
      { label: 'Result Consistency', value: resultConsistencyRate, weight: '25%', icon: '📊', color: resultConsistencyRate > 70 ? 'text-emerald-400' : 'text-yellow-400', bg: resultConsistencyRate > 70 ? 'bg-emerald-500/20' : 'bg-yellow-500/20' },
      { label: 'Report Accuracy', value: reportAccuracyRate, weight: '20%', icon: '📋', color: reportAccuracyRate > 70 ? 'text-emerald-400' : 'text-yellow-400', bg: reportAccuracyRate > 70 ? 'bg-emerald-500/20' : 'bg-yellow-500/20' },
      { label: 'Activity Level', value: activityLevel, weight: '15%', icon: '⚡', color: activityLevel > 50 ? 'text-emerald-400' : 'text-yellow-400', bg: activityLevel > 50 ? 'bg-emerald-500/20' : 'bg-yellow-500/20' },
      { label: 'Sportsmanship', value: sportsmanshipScore, weight: '10%', icon: '🤝', color: sportsmanshipScore > 70 ? 'text-emerald-400' : 'text-yellow-400', bg: sportsmanshipScore > 70 ? 'bg-emerald-500/20' : 'bg-yellow-500/20' },
    ];

    return NextResponse.json({
      trustScore: profile.trustScore || 0,
      weightedScore,
      rank: Math.min(rank, totalPlayers),
      totalPlayers,
      tier: currentTier.label,
      tierColor: currentTier.color,
      tierBg: currentTier.bg,
      nextTier: nextTierName,
      nextTierProgress,
      components,
      verifiedBadge: profile.verifiedBadge || false,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching trust meter:", error);
    return NextResponse.json({ error: "Failed to fetch trust meter" }, { status: 500 });
  }
}