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

    const [count, latest, totalSize] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          size: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.backup.aggregate({
        _sum: { size: true }
      })
    ])

    return NextResponse.json({
      totalBackups: count,
      totalSize: totalSize._sum.size || 0,
      latestBackup: latest
    })
  } catch (error) {
    console.error("Error fetching backup stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch backup stats" },
      { status: 500 }
    )
  }
}