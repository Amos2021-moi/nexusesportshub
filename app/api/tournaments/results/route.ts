import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Only TOURNAMENT results
    const results = await prisma.result.findMany({
      where: { source: "TOURNAMENT" },
      include: {
        tournamentMatch: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
            tournament: true
          }
        },
        user: { include: { profile: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching tournament results:", error)
    return NextResponse.json([])
  }
}