import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")
    const status = searchParams.get("status")

    if (!seasonId) {
      return NextResponse.json([])
    }

    try {
      // ✅ Get all league entries for the season
      const where: any = { seasonId }

      // ✅ Filter by status if provided
      if (status && status !== "all") {
        where.seasonEntry = {
          status: status,
        }
      }

      const entries = await prisma.leagueEntry.findMany({
        where,
        include: {
          player: {
            include: {
              profile: true,
            },
          },
          season: {
            select: {
              id: true,
              name: true,
            },
          },
          seasonEntry: true,
        },
        orderBy: { points: 'desc' },
      })

      return NextResponse.json(entries)
    } catch (dbError) {
      console.error("Database error fetching entries:", dbError)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching competition entries:", error)
    return NextResponse.json([])
  }
}