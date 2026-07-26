import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function verifyApiKey(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  const apiKey = process.env.NEXUS_API_SECRET
  if (!apiKey || !authHeader) return false
  const [scheme, token] = authHeader.split(" ")
  return scheme === "Bearer" && token === apiKey
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(request: Request) {
  try {
    if (!verifyApiKey(request)) return unauthorized()

    // Get active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    if (!activeSeason) {
      return NextResponse.json([])
    }

    // Get league entries for active season
    const entries = await prisma.leagueEntry.findMany({
      where: { seasonId: activeSeason.id },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { username: true, profilePicture: true } },
          },
        },
      },
      orderBy: [
        { points: "desc" },
        { goalDifference: "desc" },
        { goalsFor: "desc" },
      ],
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("WhatsApp standings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
