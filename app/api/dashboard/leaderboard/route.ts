// app/api/dashboard/leaderboard/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profilePicture?: string | null;
  verifiedBadge: boolean;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalDifference: number;
  isCurrentUser: boolean;
}

interface NearbyPlayer {
  userId: string;
  username: string;
  profilePicture?: string | null;
  points: number;
  rank: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const season = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true }
    });

    if (!season) {
      return NextResponse.json({
        hasLeaderboard: false,
        message: "No active season found"
      });
    }

    const topPlayers = await prisma.leagueEntry.findMany({
      where: { seasonId: season.id },
      include: {
        player: {
          include: {
            profile: {
              select: {
                username: true,
                profilePicture: true,
                verifiedBadge: true,
              }
            }
          }
        }
      },
      orderBy: [
        { points: 'desc' },
        { goalDifference: 'desc' },
        { goalsFor: 'desc' },
      ],
      take: 10,
    });

    const userEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId: season.id,
          playerId: userId,
        }
      },
      include: {
        player: {
          include: {
            profile: {
              select: {
                username: true,
                profilePicture: true,
                verifiedBadge: true,
              }
            }
          }
        }
      }
    });

    let userRank = null;
    if (userEntry) {
      const higherPlayers = await prisma.leagueEntry.count({
        where: {
          seasonId: season.id,
          OR: [
            { points: { gt: userEntry.points } },
            { 
              points: userEntry.points, 
              goalDifference: { gt: userEntry.goalDifference } 
            },
            { 
              points: userEntry.points, 
              goalDifference: userEntry.goalDifference,
              goalsFor: { gt: userEntry.goalsFor }
            }
          ]
        }
      });
      userRank = higherPlayers + 1;
    }

    const formattedLeaderboard: LeaderboardEntry[] = topPlayers.map((entry, index) => ({
      rank: index + 1,
      userId: entry.player.id,
      username: entry.player.profile?.username || entry.player.name || "Player",
      profilePicture: entry.player.profile?.profilePicture,
      verifiedBadge: entry.player.profile?.verifiedBadge || false,
      points: entry.points,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      goalsFor: entry.goalsFor,
      goalDifference: entry.goalDifference,
      isCurrentUser: entry.player.id === userId,
    }));

    let nearbyPlayers: NearbyPlayer[] = [];
    if (userRank && userRank > 3) {
      const pData = await prisma.leagueEntry.findMany({
        where: {
          seasonId: season.id,
          NOT: { playerId: userId }
        },
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
        skip: Math.max(0, userRank - 4),
        take: 7,
      });

      nearbyPlayers = await Promise.all(pData.map(async (p) => {
        const count = await prisma.leagueEntry.count({
          where: {
            seasonId: season.id,
            OR: [
              { points: { gt: p.points } },
              { points: p.points, goalDifference: { gt: p.goalDifference } },
            ]
          }
        });
        return {
          userId: p.player.id,
          username: p.player.profile?.username || p.player.name || "Player",
          profilePicture: p.player.profile?.profilePicture,
          points: p.points,
          rank: count + 1,
        };
      }));
    }

    return NextResponse.json({
      hasLeaderboard: true,
      currentUserRank: userRank,
      totalPlayers: await prisma.leagueEntry.count({ where: { seasonId: season.id } }),
      leaderboard: formattedLeaderboard,
      nearbyPlayers: nearbyPlayers,
      userStats: userEntry ? {
        points: userEntry.points,
        wins: userEntry.wins,
        draws: userEntry.draws,
        losses: userEntry.losses,
        goalsFor: userEntry.goalsFor,
        goalDifference: userEntry.goalDifference,
      } : null,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}