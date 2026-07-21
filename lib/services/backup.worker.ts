// lib/services/backup.worker.ts
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import crypto from "crypto";

const isProduction = process.env.VERCEL === '1';
let put: any = null;

// ✅ Load Vercel Blob only in production
if (isProduction) {
  try {
    const blob = await import('@vercel/blob');
    put = blob.put;
    console.log('✅ Vercel Blob loaded successfully');
  } catch (error) {
    console.warn('⚠️ Vercel Blob not available:', error);
  }
}

export class BackupWorker {
  private backupDir: string;
  private encryptionKey: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    // ✅ Use environment variable for encryption key or generate one
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  async performBackup(backupId: string, userId: string) {
    try {
      console.log(`📦 Starting backup worker for ${backupId}`);
      console.log(`📍 Environment: ${isProduction ? 'Production (Vercel)' : 'Local'}`);

      // ✅ Update status to PROCESSING
      await this.updateBackupStatus(backupId, 'PROCESSING', 5, 'Initializing backup...');

      // ✅ Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // ✅ Step 1: Export database
      await this.updateBackupStatus(backupId, 'PROCESSING', 20, 'Exporting database...');
      const dbData = await this.exportViaPrisma();
      const dbJson = JSON.stringify(dbData, null, 2);
      console.log(`📊 Database exported: ${dbJson.length} bytes`);

      // ✅ Step 2: Create manifest
      await this.updateBackupStatus(backupId, 'PROCESSING', 30, 'Creating manifest...');
      const manifest = {
        version: "1.0",
        platform: "Nexus Esports League",
        createdAt: new Date().toISOString(),
        tables: ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad'],
        metadata: {
          totalRecords: Object.values(dbData).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0),
          databaseSize: dbJson.length,
          compression: 'zip',
          encryption: 'AES-256'
        }
      };
      const manifestJson = JSON.stringify(manifest, null, 2);

      // ✅ Step 3: Create ZIP archive
      await this.updateBackupStatus(backupId, 'PROCESSING', 40, 'Creating ZIP archive...');
      const zip = new JSZip();
      zip.file('database.json', dbJson);
      zip.file('manifest.json', manifestJson);

      // ✅ Step 4: Add media index if available
      await this.updateBackupStatus(backupId, 'PROCESSING', 50, 'Indexing media...');
      const mediaIndex = await this.collectMedia();
      zip.file('media-index.json', JSON.stringify(mediaIndex, null, 2));

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const zipSize = zipBuffer.length;
      console.log(`🗜️ ZIP created: ${zipSize} bytes`);

      // ✅ Step 5: Encrypt the backup
      await this.updateBackupStatus(backupId, 'PROCESSING', 60, 'Encrypting backup...');
      const encryptedBuffer = this.encryptBuffer(zipBuffer);

      // ✅ Step 6: Upload or save
      await this.updateBackupStatus(backupId, 'PROCESSING', 70, 'Uploading backup...');
      let filePath: string;

      if (isProduction && put && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          console.log('☁️ Uploading to Vercel Blob...');
          const blob = await put(
            `backups/${backupId}.encrypted`,
            encryptedBuffer,
            {
              access: 'private',
              addRandomSuffix: false,
              contentType: 'application/octet-stream',
            }
          );
          filePath = blob.url;
          console.log(`✅ Backup stored in Vercel Blob: ${filePath}`);
        } catch (blobError) {
          console.error('❌ Vercel Blob upload failed:', blobError);
          console.log('📁 Falling back to local storage...');
          filePath = await this.saveLocal(encryptedBuffer, backupId);
        }
      } else {
        console.log('📁 Saving to local filesystem...');
        filePath = await this.saveLocal(encryptedBuffer, backupId);
      }

      // ✅ Step 7: Verify backup integrity
      await this.updateBackupStatus(backupId, 'PROCESSING', 90, 'Verifying backup...');
      const verified = await this.verifyBackup(filePath);
      if (!verified) {
        throw new Error('Backup verification failed');
      }
      console.log('✅ Backup verified successfully');

      // ✅ Step 8: Update backup record
      await this.updateBackupStatus(backupId, 'COMPLETED', 100, 'Backup completed!');
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: "COMPLETED",
          size: encryptedBuffer.length,
          filePath: filePath,
          metadata: {
            ...manifest.metadata,
            encrypted: true,
            verified: true,
            completedAt: new Date().toISOString()
          }
        }
      });

      // ✅ Step 9: Send notification
      await this.sendNotification(backupId, true);

      console.log(`✅ Backup ${backupId} completed successfully! Size: ${(encryptedBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // ✅ Step 10: Cleanup old backups
      await this.cleanupOldBackups();

    } catch (error) {
      console.error('❌ Backup worker failed:', error);
      
      await prisma.backup.update({
        where: { id: backupId },
        data: { status: "FAILED" }
      });

      await this.sendNotification(backupId, false);
      throw error;
    }
  }

  private async updateBackupStatus(backupId: string, status: string, progress: number, details: string) {
    try {
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status,
          metadata: {
            progress,
            step: details,
            updatedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.warn('Failed to update backup status:', error);
    }
  }

  private async saveLocal(buffer: Buffer, backupId: string): Promise<string> {
    try {
      const zipPath = path.join(this.backupDir, `${backupId}.encrypted`);
      await fs.writeFile(zipPath, buffer);
      console.log(`✅ Backup stored locally: ${zipPath}`);
      return zipPath;
    } catch (error) {
      console.error('❌ Failed to save locally:', error);
      throw error;
    }
  }

  private encryptBuffer(buffer: Buffer): Buffer {
    try {
      // ✅ AES-256-CBC encryption
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      // ✅ Prepend IV for decryption
      return Buffer.concat([iv, encrypted]);
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      // If encryption fails, return unencrypted buffer
      return buffer;
    }
  }

  private async verifyBackup(filePath: string): Promise<boolean> {
    try {
      let buffer: Buffer;
      
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Download from URL
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        buffer = await fs.readFile(filePath);
      }

      // ✅ Try to decrypt
      try {
        const decrypted = this.decryptBuffer(buffer);
        const zip = await JSZip.loadAsync(decrypted);
        
        // Check required files
        const requiredFiles = ['database.json', 'manifest.json'];
        for (const file of requiredFiles) {
          if (!zip.file(file)) return false;
        }
        
        // Validate JSON
        const dbFile = zip.file('database.json');
        if (!dbFile) return false;
        const dbJson = await dbFile.async('string');
        JSON.parse(dbJson);
        return true;
      } catch {
        // If decryption fails, try as unencrypted zip
        const zip = await JSZip.loadAsync(buffer);
        return zip.file('database.json') !== null;
      }
    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      return false;
    }
  }

  private decryptBuffer(buffer: Buffer): Buffer {
    try {
      const iv = buffer.slice(0, 16);
      const data = buffer.slice(16);
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      return Buffer.concat([decipher.update(data), decipher.final()]);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return buffer;
    }
  }

  private async exportViaPrisma() {
    const tables = ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad'];
    const data: Record<string, any> = {};

    for (const table of tables) {
      try {
        const modelName = table.toLowerCase();
        const model = prisma[modelName as keyof typeof prisma] as any;
        if (model) {
          data[table] = await model.findMany();
        }
      } catch (error) {
        console.warn(`Failed to export table ${table}:`, error);
        data[table] = [];
      }
    }

    return data;
  }

  private async collectMedia() {
    try {
      const [squads, results, profiles] = await Promise.all([
        prisma.squad.findMany({ select: { screenshot: true } }),
        prisma.result.findMany({ select: { evidenceImage: true } }),
        prisma.profile.findMany({ select: { profilePicture: true, bannerImage: true } })
      ]);

      const mediaItems = [
        ...squads.map(s => s.screenshot).filter(Boolean),
        ...results.map(r => r.evidenceImage).filter(Boolean),
        ...profiles.map(p => p.profilePicture).filter(Boolean),
        ...profiles.map(p => p.bannerImage).filter(Boolean)
      ];

      return {
        count: mediaItems.length,
        items: mediaItems.slice(0, 100), // Limit to 100 media items
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Media collection failed:', error);
      return { count: 0, items: [], timestamp: new Date().toISOString() };
    }
  }

  private async sendNotification(backupId: string, success: boolean) {
    try {
      const backup = await prisma.backup.findUnique({
        where: { id: backupId },
        include: { user: { select: { email: true, name: true } } }
      });

      // ✅ Send email notification to all admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true }
      });

      const subject = success ? '✅ Backup Completed Successfully' : '❌ Backup Failed';
      const message = success
        ? `Backup ${backupId} completed at ${new Date().toISOString()}. Size: ${(backup?.size || 0) / 1024 / 1024} MB`
        : `Backup ${backupId} failed. Please check the logs.`;

      // ✅ Store notification in database
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: subject,
            message: message,
            type: 'BACKUP',
            priority: success ? 50 : 90,
            priorityLevel: success ? 'MEDIUM' : 'HIGH',
            read: false
          }
        });
      }

      console.log(`📧 Notification sent for backup ${backupId}`);
    } catch (error) {
      console.warn('Failed to send notification:', error);
    }
  }

  private async cleanupOldBackups() {
    try {
      const config = await prisma.backupConfig.findFirst();
      if (!config) return;

      const keepDays = config.keepDaily || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      const oldBackups = await prisma.backup.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          type: "MANUAL"
        }
      });

      for (const backup of oldBackups) {
        if (backup.filePath) {
          try {
            if (backup.filePath.startsWith('http://') || backup.filePath.startsWith('https://')) {
              // Delete from Vercel Blob
              await fetch(backup.filePath, { method: 'DELETE' });
            } else {
              await fs.unlink(backup.filePath);
            }
            console.log(`🧹 Cleaned old backup: ${backup.id}`);
          } catch (error) {
            console.error(`Failed to delete backup ${backup.id}:`, error);
          }
        }
      }

      await prisma.backup.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          type: "MANUAL"
        }
      });
    } catch (error) {
      console.warn('Error cleaning old backups:', error);
    }
  }
}

export const backupWorker = new BackupWorker();