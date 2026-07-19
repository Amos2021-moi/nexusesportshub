import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, startDate, endDate } = body

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      }
    })

    return NextResponse.json(season)
  } catch (error) {
    console.error("Error creating season:", error)
    return NextResponse.json(
      { error: "Failed to create season" },
      { status: 500 }
    )
  }
}