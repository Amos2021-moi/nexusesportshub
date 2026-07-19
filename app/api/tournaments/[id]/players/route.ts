import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: id },
      include: {
        player: {
          include: { profile: true }
        }
      },
      orderBy: { seed: 'asc' }
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error("Error fetching participants:", error)
    return NextResponse.json([])
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { playerIds } = await request.json()

    if (!playerIds || playerIds.length === 0) {
      return NextResponse.json({ error: "Player IDs required" }, { status: 400 })
    }

    // Get current participants count for seeding
    const currentParticipants = await prisma.tournamentParticipant.count({
      where: { tournamentId: id }
    })

    // Create participants
    const participants = await Promise.all(
      playerIds.map((playerId: string, index: number) =>
        prisma.tournamentParticipant.create({
          data: {
            tournamentId: id,
            playerId,
            seed: currentParticipants + index + 1
          }
        })
      )
    )

    return NextResponse.json(participants)
  } catch (error) {
    console.error("Error adding participants:", error)
    return NextResponse.json(
      { error: "Failed to add participants" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { participantId } = await request.json()

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 })
    }

    // Check if tournament has matches already
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          where: {
            OR: [
              { homePlayerId: { not: null } },
              { awayPlayerId: { not: null } }
            ]
          }
        }
      }
    })

    if (tournament?.matches && tournament.matches.length > 0) {
      return NextResponse.json(
        { error: "Cannot remove player. Tournament has already started." },
        { status: 400 }
      )
    }

    // Delete the participant
    await prisma.tournamentParticipant.delete({
      where: { id: participantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing player:", error)
    return NextResponse.json(
      { error: "Failed to remove player" },
      { status: 500 }
    )
  }
}