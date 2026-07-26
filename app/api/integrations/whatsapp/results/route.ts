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

    const results = await prisma.result.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        fixture: {
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
            scheduledDate: true,
            homePlayer: {
              select: { id: true, name: true, profile: { select: { username: true } } },
            },
            awayPlayer: {
              select: { id: true, name: true, profile: { select: { username: true } } },
            },
          },
        },
        tournamentMatch: {
          select: {
            id: true,
            tournament: { select: { id: true, name: true } },
            homePlayer: { select: { id: true, name: true } },
            awayPlayer: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("WhatsApp results API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
