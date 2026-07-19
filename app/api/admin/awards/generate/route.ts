import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateSeasonAwards, deleteSeasonAwards } from "@/lib/services/award.service"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { seasonId, action } = await request.json()

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    if (action === "delete") {
      const result = await deleteSeasonAwards(seasonId)
      return NextResponse.json(result)
    }

    const result = await generateSeasonAwards(seasonId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error managing awards:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage awards" },
      { status: 500 }
    )
  }
}

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

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    const awards = await prisma.award.findMany({
      where: { seasonId },
      include: {
        winner: {
          include: { profile: true }
        },
        season: true
      }
    })

    return NextResponse.json(awards)
  } catch (error) {
    console.error("Error fetching awards:", error)
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 })
  }
}