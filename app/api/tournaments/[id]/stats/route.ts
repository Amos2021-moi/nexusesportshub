import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
            homePlayer: true,
            awayPlayer: true,
            winner: true,
            result: true
          }
        }
      }
    })
    
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }
    
    // Calculate statistics
    const totalMatches = tournament.matches.length
    const completedMatches = tournament.matches.filter(m => m.status === "COMPLETED").length
    const pendingMatches = tournament.matches.filter(m => m.status === "PENDING" && m.homePlayerId && m.awayPlayerId).length
    
    // Player statistics
    const playerStats = tournament.participants.map(participant => {
      const playerMatches = tournament.matches.filter(m => 
        m.homePlayerId === participant.playerId || m.awayPlayerId === participant.playerId
      )
      const wins = tournament.matches.filter(m => m.winnerId === participant.playerId).length
      const losses = playerMatches.length - wins
      
      return {
        playerId: participant.playerId,
        name: participant.player.profile?.username || participant.player.name,
        profilePicture: participant.player.profile?.profilePicture,
        matches: playerMatches.length,
        wins,
        losses,
        winRate: playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0,
        isActive: !participant.eliminated
      }
    }).sort((a, b) => b.wins - a.wins)
    
    return NextResponse.json({
      tournament: {
        name: tournament.name,
        type: tournament.type,
        status: tournament.status,
        startDate: tournament.startDate,
        endDate: tournament.endDate
      },
      stats: {
        totalPlayers: tournament.participants.length,
        totalMatches,
        completedMatches,
        pendingMatches,
        completionRate: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0
      },
      leaderboard: playerStats,
      topScorer: playerStats[0] || null
    })
  } catch (error) {
    console.error("Error fetching tournament stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}