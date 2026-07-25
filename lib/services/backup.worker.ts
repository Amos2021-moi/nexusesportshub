import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import crypto from "crypto";

const isProduction = process.env.VERCEL === '1';

// ✅ Import Vercel Blob dynamically with turbopack ignore
let put: any = null;
let del: any = null;

// ✅ Wrap dynamic import in a function to avoid top-level await issues
async function loadVercelBlob() {
  if (isProduction) {
    try {
      // ✅ Add turbopack ignore comment to prevent tracing issues
      const blob = await import(/* webpackIgnore: true */ '@vercel/blob');
      put = blob.put;
      del = blob.del;
      console.log('✅ Vercel Blob loaded successfully');
    } catch (error) {
      console.warn('⚠️ Vercel Blob not available:', error);
    }
  }
}

export class BackupWorker {
  private backupDir: string;
  private encryptionKey: string;
  private isEncryptionEnabled: boolean;
  private isBlobLoaded: boolean = false;

  constructor() {
    // ✅ Use a relative path instead of process.cwd() for better tracing
    this.backupDir = path.join(process.cwd(), 'backups');
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || '';
    this.isEncryptionEnabled = !!this.encryptionKey;
    
    if (this.isEncryptionEnabled) {
      console.log('🔐 Backup encryption is ENABLED');
    } else {
      console.log('🔓 Backup encryption is DISABLED (no key found)');
    }
  }

  async performBackup(backupId: string, userId: string) {
    try {
      console.log(`📦 Starting backup worker for ${backupId}`);
      console.log(`📍 Environment: ${isProduction ? 'Production (Vercel)' : 'Local'}`);
      console.log(`🔐 Encryption: ${this.isEncryptionEnabled ? 'Enabled' : 'Disabled'}`);

      // ✅ Load Vercel Blob if needed
      if (isProduction && !this.isBlobLoaded) {
        await loadVercelBlob();
        this.isBlobLoaded = true;
      }

      // ✅ Update status to PROCESSING
      await this.updateBackupStatus(backupId, 'PROCESSING', 5, 'Initializing backup...');

      // ✅ Ensure backup directory exists (for local fallback)
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
          encryption: this.isEncryptionEnabled ? 'AES-256-CBC' : 'None',
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

      let finalBuffer = zipBuffer;
      let fileExtension = 'zip';
      let isEncrypted = false;

      // ✅ Step 5: Encrypt the backup (if key is set)
      if (this.isEncryptionEnabled) {
        await this.updateBackupStatus(backupId, 'PROCESSING', 60, 'Encrypting backup...');
        finalBuffer = this.encryptBuffer(zipBuffer);
        fileExtension = 'encrypted';
        isEncrypted = true;
        console.log(`🔐 Backup encrypted: ${finalBuffer.length} bytes`);
      }

      // ✅ Step 6: Upload or save
      await this.updateBackupStatus(backupId, 'PROCESSING', 70, 'Uploading backup...');
      let filePath: string;
      const fileName = `backup_${backupId}.${fileExtension}`;

      if (isProduction && put && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          console.log('☁️ Uploading to Vercel Blob...');
          const blob = await put(
            `backups/${fileName}`,
            finalBuffer,
            {
              access: 'private',
              addRandomSuffix: false,
              contentType: isEncrypted ? 'application/octet-stream' : 'application/zip',
            }
          );
          filePath = blob.url;
          console.log(`✅ Backup stored in Vercel Blob: ${filePath}`);
        } catch (blobError) {
          console.error('❌ Vercel Blob upload failed:', blobError);
          console.log('📁 Falling back to local storage...');
          filePath = await this.saveLocal(finalBuffer, backupId, fileExtension);
        }
      } else {
        console.log('📁 Saving to local filesystem...');
        filePath = await this.saveLocal(finalBuffer, backupId, fileExtension);
      }

      // ✅ Step 7: Verify backup integrity
      await this.updateBackupStatus(backupId, 'PROCESSING', 90, 'Verifying backup...');
      const verified = await this.verifyBackup(filePath, isEncrypted);
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
          size: finalBuffer.length,
          filePath: filePath,
          metadata: {
            ...manifest.metadata,
            encrypted: isEncrypted,
            verified: true,
            completedAt: new Date().toISOString(),
            environment: isProduction ? 'production' : 'development',
          }
        }
      });

      console.log(`✅ Backup ${backupId} completed successfully! Size: ${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // ✅ Step 9: Send notification
      await this.sendNotification(backupId, true);

      // ✅ Step 10: Cleanup old backups
      await this.cleanupOldBackups();

    } catch (error) {
      console.error('❌ Backup worker failed:', error);
      
      await prisma.backup.update({
        where: { id: backupId },
        data: { 
          status: "FAILED",
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString()
          }
        }
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

  private async saveLocal(buffer: Buffer, backupId: string, extension: string): Promise<string> {
    try {
      const zipPath = path.join(this.backupDir, `${backupId}.${extension}`);
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
      return buffer;
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

  private async verifyBackup(filePath: string, isEncrypted: boolean): Promise<boolean> {
    try {
      let buffer: Buffer;
      
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Download from URL
        const headers: Record<string, string> = {};
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          headers['Authorization'] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
        }
        const response = await fetch(filePath, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        buffer = await fs.readFile(filePath);
      }

      // ✅ If encrypted, decrypt first
      let decryptedBuffer = buffer;
      if (isEncrypted) {
        try {
          decryptedBuffer = this.decryptBuffer(buffer);
        } catch {
          // If decryption fails, maybe it's not encrypted
          decryptedBuffer = buffer;
        }
      }

      const zip = await JSZip.loadAsync(decryptedBuffer);
      
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
      
      // Validate manifest
      const manifestFile = zip.file('manifest.json');
      if (manifestFile) {
        const manifestJson = await manifestFile.async('string');
        JSON.parse(manifestJson);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      return false;
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
        items: mediaItems.slice(0, 100),
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

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true }
      });

      const subject = success ? '✅ Backup Completed Successfully' : '❌ Backup Failed';
      const message = success
        ? `Backup ${backupId} completed at ${new Date().toISOString()}. Size: ${(backup?.size || 0) / 1024 / 1024} MB`
        : `Backup ${backupId} failed. Please check the logs.`;

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
          type: { in: ["MANUAL", "AUTO"] }
        }
      });

      for (const backup of oldBackups) {
        if (backup.filePath) {
          try {
            if (backup.filePath.startsWith('http://') || backup.filePath.startsWith('https://')) {
              // Delete from Vercel Blob
              if (del) {
                await del(backup.filePath);
              } else {
                await fetch(backup.filePath, { method: 'DELETE' });
              }
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
          type: { in: ["MANUAL", "AUTO"] }
        }
      });
    } catch (error) {
      console.warn('Error cleaning old backups:', error);
    }
  }
}

// ✅ Export a function to create worker instance
export function createBackupWorker() {
  return new BackupWorker();
}

// ✅ Export singleton with lazy initialization
export const backupWorker = new BackupWorker();