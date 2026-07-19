import { prisma } from "@/lib/prisma"
import { backupService } from "./backup.service"
import { unlink } from "fs/promises"

export class BackupScheduler {
  private checkInterval: NodeJS.Timeout | null = null

  async initialize() {
    // Check every minute for scheduled backups
    this.checkInterval = setInterval(() => {
      this.checkScheduledBackups()
    }, 60000) // 1 minute

    console.log('✅ Backup scheduler initialized')
  }

  async checkScheduledBackups() {
    try {
      const config = await prisma.backupConfig.findFirst()
      
      if (!config || !config.enabled) {
        return
      }

      // Check if we should run a backup
      const shouldRun = await this.shouldRunBackup(config)
      
      if (shouldRun) {
        console.log('🔄 Running scheduled backup...')
        await this.runBackup()
      }
    } catch (error) {
      console.error('Error checking scheduled backups:', error)
    }
  }

  private async shouldRunBackup(config: any): Promise<boolean> {
    const now = new Date()
    
    // If never run, should run
    if (!config.lastRunAt) {
      return true
    }

    const lastRun = new Date(config.lastRunAt)
    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60)

    switch (config.frequency) {
      case "HOURLY":
        return hoursSinceLastRun >= 1
      case "DAILY":
        // Check if we've passed the scheduled time
        const [hours, minutes] = config.time.split(':').map(Number)
        const scheduledTime = new Date(now)
        scheduledTime.setHours(hours, minutes, 0, 0)
        
        // If scheduled time is in the future today, check if lastRun was before it
        if (scheduledTime > now) {
          return lastRun < scheduledTime
        }
        
        // If scheduled time passed today, check if lastRun was before today's scheduled time
        const todayScheduled = new Date(now)
        todayScheduled.setHours(hours, minutes, 0, 0)
        return lastRun < todayScheduled
      case "WEEKLY":
        return hoursSinceLastRun >= 168 // 7 days
      case "MONTHLY":
        return hoursSinceLastRun >= 720 // 30 days
      default:
        return false
    }
  }

  private async runBackup() {
    try {
      // Get first admin user
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      })

      if (!admin) {
        console.error('No admin found to create backup')
        return
      }

      // Create backup
      const backup = await backupService.createBackup(admin.id, "AUTO")

      // Update config
      await prisma.backupConfig.updateMany({
        data: {
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun()
        }
      })

      // Clean old auto backups
      await this.cleanOldAutoBackups()

      console.log(`✅ Auto backup completed: ${backup.id}`)

    } catch (error) {
      console.error('❌ Auto backup failed:', error)
    }
  }

  private async cleanOldAutoBackups() {
    try {
      const config = await prisma.backupConfig.findFirst()
      if (!config) return

      // Get all auto backups sorted by date
      const autoBackups = await prisma.backup.findMany({
        where: { type: "AUTO" },
        orderBy: { createdAt: 'desc' }
      })

      // Calculate how many to keep
      const totalToKeep = config.keepDaily + config.keepWeekly + config.keepMonthly

      if (autoBackups.length <= totalToKeep) {
        return
      }

      // Delete oldest backups
      const toDelete = autoBackups.slice(totalToKeep)
      
      for (const backup of toDelete) {
        if (backup.filePath) {
          try {
            await unlink(backup.filePath)
          } catch (e) {}
        }
        await prisma.backup.delete({
          where: { id: backup.id }
        })
      }

      console.log(`🧹 Cleaned ${toDelete.length} old auto backups`)

    } catch (error) {
      console.error('Error cleaning old auto backups:', error)
    }
  }

  private calculateNextRun(): Date {
    const now = new Date()
    // Default: next day at 2:00 AM
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(2, 0, 0, 0)
    return next
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('🛑 Backup scheduler stopped')
    }
  }
}

export const backupScheduler = new BackupScheduler()