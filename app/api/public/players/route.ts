import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // ✅ PUBLIC - No authentication required
    const players = await prisma.user.findMany({
      where: { role: "PLAYER" },
      include: {
        profile: true
      },
      orderBy: {
        profile: {
          trustScore: 'desc'
        }
      }
    })

    // Format response
    const formattedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      email: player.email,
      isVerified: player.isVerified,
      profile: player.profile ? {
        username: player.profile.username,
        profilePicture: player.profile.profilePicture,
        trustScore: player.profile.trustScore || 0,
        verifiedBadge: player.profile.verifiedBadge || false
      } : null
    }))

    return NextResponse.json(formattedPlayers)
  } catch (error) {
    console.error("Error fetching public players:", error)
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    )
  }
}