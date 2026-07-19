import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ✅ Minimal query - only what's needed
    const backups = await prisma.backup.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        size: true,
        createdAt: true,
        createdBy: true,
        filePath: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(backups)
  } catch (error) {
    console.error("Error fetching backup history:", error)
    return NextResponse.json(
      { error: "Failed to fetch backup history" },
      { status: 500 }
    )
  }
}