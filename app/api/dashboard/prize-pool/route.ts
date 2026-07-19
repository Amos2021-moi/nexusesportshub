// app/api/dashboard/prize-pool/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TopPlayer {
  rank: number;
  name: string;
  points: number;
  profilePicture?: string | null;
  prize: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get active season
    const season = await prisma.season.findFirst({
      where: { isActive: true },
      include: {
        prizePool: true,
        leagueSettings: true,
      }
    });

    if (!season) {
      return NextResponse.json({
        hasPrizePool: false,
        message: "No active season found"
      });
    }

    // Check if user has paid
    const playerEntry = await prisma.playerSeasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId: season.id,
        },
      },
    });

    const hasPaid = playerEntry?.hasPaid || false;

    // Get top players for prize distribution
    const topPlayers = await prisma.leagueEntry.findMany({
      where: { seasonId: season.id },
      include: {
        player: {
          include: {
            profile: {
              select: {
                username: true,
                profilePicture: true,
              }
            }
          }
        }
      },
      orderBy: { points: 'desc' },
      take: 3,
    });

    const formattedTopPlayers: TopPlayer[] = topPlayers.map((entry, index) => ({
      rank: index + 1,
      name: entry.player.profile?.username || entry.player.name || "Player",
      points: entry.points,
      profilePicture: entry.player.profile?.profilePicture,
      prize: index === 0 ? (season.prizePool?.championReward || 0) : 
             index === 1 ? (season.prizePool?.runnerReward || 0) : 
             (season.prizePool?.topScorerReward || 0),
    }));

    return NextResponse.json({
      hasPrizePool: true,
      seasonName: season.name,
      totalCollected: season.prizePool?.totalCollected || 0,
      registeredPlayers: season.prizePool?.registeredPlayers || 0,
      entryFee: season.prizePool?.entryFee || 0,
      championReward: season.prizePool?.championReward || 0,
      runnerReward: season.prizePool?.runnerReward || 0,
      topScorerReward: season.prizePool?.topScorerReward || 0,
      platformReserve: season.prizePool?.platformReserve || 0,
      hasPaid,
      topPlayers: formattedTopPlayers,
      paymentRequired: season.leagueSettings?.paymentRequired || false,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching prize pool:", error);
    return NextResponse.json(
      { error: "Failed to fetch prize pool" },
      { status: 500 }
    );
  }
}