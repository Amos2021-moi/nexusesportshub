// app/api/admin/top-contributors/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedTopContributors = unstable_cache(
  async () => {
    // ✅ Get top players by wins from league entries
    const topPlayers = await prisma.leagueEntry.findMany({
      where: {
        season: {
          isActive: true,
        },
      },
      select: {
        player: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                username: true,
              },
            },
          },
        },
        wins: true,
        draws: true,
        losses: true,
        points: true,
        played: true,
      },
      orderBy: {
        wins: 'desc',
      },
      take: 10,
    });

    // Format the response
    const contributors = topPlayers.map((entry, index) => ({
      id: entry.player.id,
      name: entry.player.name || "Unknown Player",
      username: entry.player.profile?.username || "player",
      wins: entry.wins || 0,
      rank: index + 1,
      title: index === 0 ? "🏆 Champion" :
             index === 1 ? "🥈 Runner Up" :
             index === 2 ? "🥉 Third Place" :
             `Top ${index + 1}`,
      points: entry.points || 0,
      played: entry.played || 0,
      winRate: entry.played > 0 ? Math.round((entry.wins / entry.played) * 100) : 0,
    }));

    return contributors;
  },
  ["admin-top-contributors"],
  { revalidate: 60 } // Cache for 60 seconds
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getCachedTopContributors();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching top contributors:", error);
    return NextResponse.json([], { status: 200 });
  }
}