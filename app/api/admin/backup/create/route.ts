import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { backupWorker } from "@/lib/services/backup.worker"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { type = "MANUAL" } = await request.json()

    // ✅ Create and run backup immediately
    const { prisma } = await import('@/lib/prisma')
    
    const backup = await prisma.backup.create({
      data: {
        name: `backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        type,
        status: "PROCESSING",
        createdBy: session.user.id,
        version: "1.0",
        size: 0,
      }
    })

    // ✅ Run backup synchronously
    await backupWorker.performBackup(backup.id, session.user.id)

    return NextResponse.json({
      success: true,
      message: "Backup completed successfully",
      backup
    })
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create backup" },
      { status: 500 }
    )
  }
}