import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    // Admin only endpoint
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const players = await prisma.user.findMany({
      where: { role: "PLAYER" },
      include: {
        profile: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json([])
  }
}