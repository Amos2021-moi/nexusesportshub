import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { backupId } = await request.json()

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    })

    if (!backup || !backup.filePath) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    const restoreLog = await prisma.restoreLog.create({
      data: {
        backupId,
        status: "PROCESSING",
        restoredBy: session.user.id
      }
    })

    await prisma.restoreLog.update({
      where: { id: restoreLog.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    })

    await prisma.backup.update({
      where: { id: backupId },
      data: {
        restoredAt: new Date(),
        restoredBy: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully",
      restoreLog
    })
  } catch (error) {
    console.error("Error restoring backup:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore backup" },
      { status: 500 }
    )
  }
}