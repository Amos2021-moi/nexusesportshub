import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        },
        result: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...match,
      tournamentId: match.tournamentId
    })
  } catch (error) {
    console.error("Error fetching match:", error)
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    )
  }
}