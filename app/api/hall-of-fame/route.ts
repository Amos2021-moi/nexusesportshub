import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ Add revalidation for Hall of Fame
export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const entries = await prisma.hallOfFame.findMany({
      include: {
        player: {
          include: {
            profile: true
          }
        },
        season: true
      },
      orderBy: { inductedAt: 'desc' }
    })

    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      playerName: entry.player.name || "Unknown",
      username: entry.player.profile?.username || "Unknown",
      category: entry.category,
      reason: entry.reason,
      imageUrl: entry.imageUrl || entry.player.profile?.profilePicture || null,
      seasonName: entry.season.name,
      inductedAt: entry.inductedAt
    }))

    return NextResponse.json(formattedEntries)
  } catch (error) {
    console.error("Error fetching Hall of Fame:", error)
    return NextResponse.json({ error: "Failed to fetch Hall of Fame" }, { status: 500 })
  }
}