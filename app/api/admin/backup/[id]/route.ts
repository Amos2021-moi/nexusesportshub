import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id },
      include: { restoreLogs: true }
    })

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    // ✅ Delete restore logs first
    if (backup.restoreLogs && backup.restoreLogs.length > 0) {
      await prisma.restoreLog.deleteMany({
        where: { backupId: id }
      })
    }

    // ✅ Delete file if it exists
    if (backup.filePath) {
      try {
        // Check if it's a Vercel Blob URL
        if (backup.filePath.startsWith('http://') || backup.filePath.startsWith('https://')) {
          // Vercel Blob - delete via fetch
          const deleteResponse = await fetch(backup.filePath, {
            method: 'DELETE',
          })
          if (!deleteResponse.ok) {
            console.warn(`Failed to delete blob: ${backup.filePath}`)
          }
        } else {
          // Local file
          await fs.unlink(backup.filePath)
        }
        console.log(`🗑️ Deleted backup file: ${backup.filePath}`)
      } catch (error) {
        console.error(`Failed to delete backup file:`, error)
      }
    }

    // ✅ Delete backup record
    await prisma.backup.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting backup:", error)
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    )
  }
}