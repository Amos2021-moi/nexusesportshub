import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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

    const { type = "MANUAL" } = await request.json()

    // ✅ Create backup record
    const backup = await prisma.backup.create({
      data: {
        name: `backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        type,
        status: "PROCESSING", // ✅ Start as PROCESSING immediately
        createdBy: session.user.id,
        version: "1.0",
        size: 0,
      }
    })

    // ✅ Run backup synchronously (not in background)
    try {
      const { backupWorker } = await import('@/lib/services/backup.worker')
      await backupWorker.performBackup(backup.id, session.user.id)
      
      return NextResponse.json({
        success: true,
        message: "Backup completed successfully",
        backupId: backup.id,
        status: "COMPLETED"
      })
    } catch (error) {
      console.error('Backup failed:', error)
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: "FAILED" }
      })
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Backup failed" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error creating backup:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create backup" },
      { status: 500 }
    )
  }
}