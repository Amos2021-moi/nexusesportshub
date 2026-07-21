// lib/services/backup.scheduler.ts
import { prisma } from "@/lib/prisma";
import { backupWorker } from "./backup.worker";

export class BackupScheduler {
  private checkInterval: NodeJS.Timeout | null = null;

  async initialize() {
    // ✅ Check every minute for scheduled backups
    this.checkInterval = setInterval(() => {
      this.checkScheduledBackups();
    }, 60000);

    console.log('✅ Backup scheduler initialized');
  }

  async checkScheduledBackups() {
    try {
      const config = await prisma.backupConfig.findFirst();
      
      if (!config || !config.enabled) {
        return;
      }

      const shouldRun = await this.shouldRunBackup(config);
      
      if (shouldRun) {
        console.log('🔄 Running scheduled backup...');
        await this.runBackup();
      }
    } catch (error) {
      console.error('Error checking scheduled backups:', error);
    }
  }

  private async shouldRunBackup(config: any): Promise<boolean> {
    const now = new Date();
    
    if (!config.lastRunAt) {
      return true;
    }

    const lastRun = new Date(config.lastRunAt);
    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);

    switch (config.frequency) {
      case "HOURLY":
        return hoursSinceLastRun >= 1;
      case "DAILY": {
        const [hours, minutes] = config.time.split(':').map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        if (scheduledTime > now) {
          return lastRun < scheduledTime;
        }
        
        const todayScheduled = new Date(now);
        todayScheduled.setHours(hours, minutes, 0, 0);
        return lastRun < todayScheduled;
      }
      case "WEEKLY":
        return hoursSinceLastRun >= 168;
      case "MONTHLY":
        return hoursSinceLastRun >= 720;
      default:
        return false;
    }
  }

  private async runBackup() {
    try {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" }
      });

      if (!admin) {
        console.error('No admin found to create backup');
        return;
      }

      // ✅ Create backup record
      const backup = await prisma.backup.create({
        data: {
          name: `auto_backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
          type: "AUTO",
          status: "PENDING",
          createdBy: admin.id,
          version: "1.0",
          size: 0,
        }
      });

      // ✅ Execute backup using backupWorker
      await backupWorker.performBackup(backup.id, admin.id);

      // ✅ Update config
      await prisma.backupConfig.updateMany({
        data: {
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun()
        }
      });

      // ✅ Clean old auto backups
      await this.cleanOldAutoBackups();

      console.log(`✅ Auto backup completed: ${backup.id}`);

    } catch (error) {
      console.error('❌ Auto backup failed:', error);
    }
  }

  private async cleanOldAutoBackups() {
    try {
      const config = await prisma.backupConfig.findFirst();
      if (!config) return;

      const autoBackups = await prisma.backup.findMany({
        where: { type: "AUTO" },
        orderBy: { createdAt: 'desc' }
      });

      const totalToKeep = config.keepDaily + config.keepWeekly + config.keepMonthly;

      if (autoBackups.length <= totalToKeep) {
        return;
      }

      const toDelete = autoBackups.slice(totalToKeep);
      
      for (const backup of toDelete) {
        if (backup.filePath) {
          try {
            if (backup.filePath.startsWith('http://') || backup.filePath.startsWith('https://')) {
              await fetch(backup.filePath, { method: 'DELETE' });
            } else {
              const fs = await import('fs/promises');
              await fs.unlink(backup.filePath);
            }
          } catch (e) {
            console.warn('Failed to delete backup file:', e);
          }
        }
        await prisma.backup.delete({
          where: { id: backup.id }
        });
      }

      console.log(`🧹 Cleaned ${toDelete.length} old auto backups`);

    } catch (error) {
      console.error('Error cleaning old auto backups:', error);
    }
  }

  private calculateNextRun(): Date {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
    return next;
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Backup scheduler stopped');
    }
  }
}

export const backupScheduler = new BackupScheduler();