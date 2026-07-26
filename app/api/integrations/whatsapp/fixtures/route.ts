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

    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    if (!activeSeason) {
      return NextResponse.json({ fixtures: [], season: null })
    }

    const fixtures = await prisma.fixture.findMany({
      where: { seasonId: activeSeason.id },
      orderBy: { scheduledDate: "asc" },
      take: 50,
      include: {
        homePlayer: {
          select: {
            id: true,
            name: true,
            profile: { select: { username: true } },
          },
        },
        awayPlayer: {
          select: {
            id: true,
            name: true,
            profile: { select: { username: true } },
          },
        },
        result: {
          select: { homeScore: true, awayScore: true, approved: true },
        },
      },
    })

    return NextResponse.json({
      fixtures,
      season: { id: activeSeason.id, name: activeSeason.name },
    })
  } catch (error) {
    console.error("WhatsApp fixtures API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
