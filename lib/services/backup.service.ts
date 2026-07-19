import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import JSZip from "jszip"
import { put } from "@vercel/blob"

export class BackupService {
  private backupDir: string

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
  }

  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create backup directory:', error)
    }
  }

  async createBackup(userId: string, type: string = "MANUAL"): Promise<any> {
    try {
      console.log(`📦 Starting ${type} backup for user ${userId}`)

      const backup = await prisma.backup.create({
        data: {
          name: `backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
          type,
          status: "PROCESSING",
          createdBy: userId,
          version: "1.0",
          size: 0,
        }
      })

      console.log(`✅ Backup record created: ${backup.id}`)

      const tempDir = path.join(this.backupDir, backup.id)
      await fs.mkdir(tempDir, { recursive: true })
      console.log(`📁 Temp directory created: ${tempDir}`)

      // 1. Export database as JSON
      const dbData = await this.exportViaPrisma()
      const dbPath = path.join(tempDir, 'database.json')
      await fs.writeFile(dbPath, JSON.stringify(dbData, null, 2))
      console.log(`💾 Database exported: ${dbPath}`)

      // 2. Collect media references
      const mediaIndex = await this.collectMedia()
      const mediaPath = path.join(tempDir, 'media-index.json')
      await fs.writeFile(mediaPath, JSON.stringify(mediaIndex, null, 2))
      console.log(`🖼️ Media indexed: ${mediaIndex.count} items`)

      // 3. Create manifest
      const manifest = {
        version: "1.0",
        platform: "Nexus Esports League",
        createdAt: new Date().toISOString(),
        tables: ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad']
      }
      const manifestPath = path.join(tempDir, 'manifest.json')
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
      console.log(`📄 Manifest created`)

      // 4. Create ZIP archive
      const zipPath = path.join(this.backupDir, `${backup.id}.zip`)
      await this.createZipArchive(tempDir, zipPath)
      console.log(`🗜️ ZIP archive created: ${zipPath}`)

      // 5. Upload to Vercel Blob if available
      let fileUrl = zipPath
      let fileSize = 0
      const stats = await fs.stat(zipPath)
      fileSize = stats.size

      // 6. Update backup record
      await prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: "COMPLETED",
          size: fileSize,
          filePath: fileUrl,
          metadata: {
            databaseSize: fileSize,
            mediaCount: mediaIndex.count,
            tables: manifest.tables
          }
        }
      })

      // 7. Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true })
      console.log(`🧹 Temp directory cleaned up`)

      console.log(`✅ Backup ${backup.id} completed successfully! Size: ${fileSize} bytes`)

      await this.cleanOldBackups()

      return backup
    } catch (error) {
      console.error('❌ Backup creation failed:', error)
      throw error
    }
  }

  private async createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
    try {
      const zip = new JSZip()
      const files = await fs.readdir(sourceDir)
      
      for (const file of files) {
        const filePath = path.join(sourceDir, file)
        const content = await fs.readFile(filePath)
        zip.file(file, content)
      }
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
      await fs.writeFile(outputPath, zipBuffer)
      
      console.log(`✅ ZIP archive created: ${outputPath}`)
    } catch (error) {
      console.error('Failed to create ZIP archive:', error)
      throw error
    }
  }

  private async exportViaPrisma() {
    const tables = ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad']
    const data: Record<string, any> = {}

    for (const table of tables) {
      try {
        const modelName = table.toLowerCase()
        // @ts-ignore - dynamic model access
        const model = prisma[modelName]
        if (model) {
          data[table] = await model.findMany()
        }
      } catch (error) {
        console.warn(`Failed to export table ${table}:`, error)
      }
    }

    return data
  }

  private async collectMedia() {
    const [squads, evidence, profiles] = await Promise.all([
      prisma.squad.findMany({ select: { screenshot: true } }),
      prisma.result.findMany({ select: { evidenceImage: true } }),
      prisma.profile.findMany({ select: { profilePicture: true, bannerImage: true } })
    ])

    const mediaItems = [
      ...squads.map(s => s.screenshot).filter(Boolean),
      ...evidence.map(e => e.evidenceImage).filter(Boolean),
      ...profiles.map(p => p.profilePicture).filter(Boolean),
      ...profiles.map(p => p.bannerImage).filter(Boolean)
    ]

    return {
      count: mediaItems.length,
      items: mediaItems,
      timestamp: new Date().toISOString()
    }
  }

  private async cleanOldBackups() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const oldBackups = await prisma.backup.findMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          type: "MANUAL"
        }
      })

      for (const backup of oldBackups) {
        if (backup.filePath) {
          try {
            await fs.unlink(backup.filePath)
            console.log(`🧹 Cleaned old backup: ${backup.id}`)
          } catch (error) {
            console.error(`Failed to delete backup ${backup.id}:`, error)
          }
        }
      }

      await prisma.backup.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          type: "MANUAL"
        }
      })
    } catch (error) {
      console.error('Error cleaning old backups:', error)
    }
  }

  async getBackupHistory() {
    return await prisma.backup.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getBackupStats() {
    const [count, latest] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.findFirst({
        orderBy: { createdAt: 'desc' }
      })
    ])

    const totalSize = await prisma.backup.aggregate({
      _sum: { size: true }
    })

    return {
      totalBackups: count,
      totalSize: totalSize._sum.size || 0,
      latestBackup: latest
    }
  }
}

export const backupService = new BackupService()