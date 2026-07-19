import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Allow public access to view tournaments
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            player: {
              include: { profile: true }
            }
          }
        },
        matches: {
          include: {
            homePlayer: {
              include: { profile: true }
            },
            awayPlayer: {
              include: { profile: true }
            },
            winner: {
              include: { profile: true }
            },
            result: true
          },
          orderBy: { round: 'asc' }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    const formattedTournament = {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      type: tournament.type,
      status: tournament.status,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      maxPlayers: tournament.maxPlayers,
      participants: tournament.participants.map(p => ({
        id: p.id,
        playerId: p.playerId,
        seed: p.seed,
        eliminated: p.eliminated,
        player: {
          name: p.player.name,
          profile: p.player.profile
        }
      }))
    }

    const formattedMatches = tournament.matches.map(m => ({
      id: m.id,
      round: m.round,
      matchNumber: m.matchNumber,
      bracket: m.bracket,
      status: m.status,
      scheduledDate: m.scheduledDate,
      homePlayerId: m.homePlayerId,
      awayPlayerId: m.awayPlayerId,
      winnerId: m.winnerId,
      homePlayer: m.homePlayer ? {
        name: m.homePlayer.name,
        profile: m.homePlayer.profile
      } : null,
      awayPlayer: m.awayPlayer ? {
        name: m.awayPlayer.name,
        profile: m.awayPlayer.profile
      } : null,
      winner: m.winner ? {
        name: m.winner.name,
        profile: m.winner.profile
      } : null,
      result: m.result ? {
        homeScore: m.result.homeScore,
        awayScore: m.result.awayScore,
        approved: m.result.approved
      } : null
    }))

    return NextResponse.json({
      tournament: formattedTournament,
      matches: formattedMatches
    })
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    )
  }
}

// ✅ DELETE method - FIXED
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

    // ✅ Delete all related records first
    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId: id }
    })

    await prisma.tournamentMatch.deleteMany({
      where: { tournamentId: id }
    })

    await prisma.tournament.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    )
  }
}