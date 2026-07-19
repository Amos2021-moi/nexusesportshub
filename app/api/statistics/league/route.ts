import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    const leagueEntries = await prisma.leagueEntry.findMany({
      include: { player: { include: { profile: true } } },
      orderBy: { points: 'desc' }
    })

    const rank = leagueEntries.findIndex(e => e.playerId === session.user.id) + 1

    const topScorerEntry = await prisma.leagueEntry.findFirst({
      orderBy: { goalsFor: 'desc' },
      include: { player: { include: { profile: true } } }
    })

    const topAssistEntry = await prisma.leagueEntry.findFirst({
      orderBy: { points: 'desc' },
      include: { player: { include: { profile: true } } }
    })

    return NextResponse.json({
      rank: rank || leagueEntries.length,
      totalPlayers: leagueEntries.length,
      topScorer: {
        name: topScorerEntry?.player.profile?.username || topScorerEntry?.player.name,
        goals: topScorerEntry?.goalsFor || 0
      },
      mostAssists: {
        name: topAssistEntry?.player.profile?.username || topAssistEntry?.player.name,
        assists: topAssistEntry?.points || 0
      }
    })
  } catch (error) {
    return NextResponse.json({})
  }
}