import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // ✅ Allow public access for viewing tournaments
    const tournaments = await prisma.tournament.findMany({
      include: {
        participants: true,
        matches: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    )
  }
}

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
    const { name, description, type, startDate, endDate, maxPlayers } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        type: type || "SINGLE_ELIM",
        status: "PENDING",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxPlayers: parseInt(maxPlayers) || 8
      }
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Tournament ID required" },
        { status: 400 }
      )
    }

    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId: id }
    })

    await prisma.tournamentMatch.deleteMany({
      where: { tournamentId: id }
    })

    await prisma.tournament.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    )
  }
}