import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ GET league settings
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

    // ✅ Get or create league settings
    let settings = await prisma.leagueSettings.findUnique({
      where: { seasonId },
    })

    if (!settings) {
      settings = await prisma.leagueSettings.create({
        data: {
          seasonId,
          paymentRequired: false,
          entryFee: 0,
          currency: "KES",
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching league settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch league settings" },
      { status: 500 }
    )
  }
}

// ✅ POST update league settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { seasonId, paymentRequired, entryFee, currency } = body

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    // ✅ Update or create settings
    const settings = await prisma.leagueSettings.upsert({
      where: { seasonId },
      update: {
        paymentRequired: paymentRequired || false,
        entryFee: entryFee || 0,
        currency: currency || "KES",
      },
      create: {
        seasonId,
        paymentRequired: paymentRequired || false,
        entryFee: entryFee || 0,
        currency: currency || "KES",
      },
    })

    return NextResponse.json({
      success: true,
      settings,
      message: "League settings updated successfully",
    })
  } catch (error) {
    console.error("Error updating league settings:", error)
    return NextResponse.json(
      { error: "Failed to update league settings" },
      { status: 500 }
    )
  }
}