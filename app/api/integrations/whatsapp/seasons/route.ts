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

    const seasons = await prisma.season.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { seasonEntries: true, fixtures: true },
        },
        leagueSettings: true,
        prizePool: true,
      },
    })

    return NextResponse.json(seasons)
  } catch (error) {
    console.error("WhatsApp seasons API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
