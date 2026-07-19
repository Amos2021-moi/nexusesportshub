import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(seasons)
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return NextResponse.json(
      { error: "Failed to fetch seasons" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Debug logging
    console.log("Session in POST /api/seasons:", session?.user?.email)
    console.log("Session role:", session?.user?.role)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, startDate, endDate, isActive } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: name, startDate, endDate" },
        { status: 400 }
      )
    }

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive || false,
        status: "PRESEASON",
      },
    })

    return NextResponse.json(season, { status: 201 })
  } catch (error) {
    console.error("Error creating season:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create season" },
      { status: 500 }
    )
  }
}