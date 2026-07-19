import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ CRON JOB - Runs automatically at scheduled time
export async function GET() {
  try {
    console.log("🔄 Cron job triggered: Auto backup at", new Date().toISOString())

    // Get backup config
    const config = await prisma.backupConfig.findFirst()

    if (!config) {
      console.log("⚠️ No backup config found, creating default...")
      await prisma.backupConfig.create({
        data: {
          enabled: true,
          frequency: "DAILY",
          time: "02:00",
          keepDaily: 7,
          keepWeekly: 4,
          keepMonthly: 3,
        }
      })
      return NextResponse.json({ message: "Backup config created" })
    }

    if (!config.enabled) {
      console.log("⏭️ Auto backup is disabled")
      return NextResponse.json({ message: "Auto backup disabled" })
    }

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })

    if (!admin) {
      console.log("❌ No admin found")
      return NextResponse.json({ error: "No admin found" }, { status: 404 })
    }

    // ✅ Create backup record
    const backup = await prisma.backup.create({
      data: {
        name: `auto_backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        type: "AUTO",
        status: "PROCESSING",
        createdBy: admin.id,
        version: "1.0",
        size: 0,
      }
    })

    console.log(`✅ Auto backup created: ${backup.id}`)

    // ✅ Trigger backup in background (don't await - let it run)
    try {
      const { backupWorker } = await import('@/lib/services/backup.worker')
      // Run in background without blocking the response
      backupWorker.performBackup(backup.id, admin.id)
        .then(() => {
          console.log(`✅ Auto backup ${backup.id} completed successfully`)
        })
        .catch((error) => {
          console.error(`❌ Auto backup ${backup.id} failed:`, error)
          prisma.backup.update({
            where: { id: backup.id },
            data: { status: "FAILED" }
          }).catch(e => console.error('Failed to update backup status:', e))
        })
    } catch (error) {
      console.error('❌ Failed to start backup worker:', error)
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: "FAILED" }
      })
    }

    // ✅ Update config last run time
    await prisma.backupConfig.update({
      where: { id: config.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: calculateNextRun(config.time),
      }
    })

    return NextResponse.json({
      success: true,
      message: "Auto backup triggered",
      backupId: backup.id
    })
  } catch (error) {
    console.error("❌ Cron job failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron job failed" },
      { status: 500 }
    )
  }
}

function calculateNextRun(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date()
  next.setHours(hours, minutes, 0, 0)
  if (next <= new Date()) {
    next.setDate(next.getDate() + 1)
  }
  return next
}