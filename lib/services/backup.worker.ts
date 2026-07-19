import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import JSZip from "jszip"

const isProduction = process.env.VERCEL === '1'

// ✅ Only import Vercel Blob in production
let put: any = null
if (isProduction) {
  try {
    const blob = await import('@vercel/blob')
    put = blob.put
    console.log('✅ Vercel Blob loaded successfully')
  } catch (error) {
    console.warn('⚠️ Vercel Blob not available in production:', error)
  }
}

export class BackupWorker {
  private backupDir: string

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
  }

  async performBackup(backupId: string, userId: string) {
    try {
      console.log(`📦 Starting backup worker for ${backupId}`)
      console.log(`📍 Environment: ${isProduction ? 'Production (Vercel)' : 'Local'}`)

      // ✅ Update status to PROCESSING
      await prisma.backup.update({
        where: { id: backupId },
        data: { status: "PROCESSING" }
      })

      // ✅ Export database as JSON
      console.log('📊 Exporting database...')
      const dbData = await this.exportViaPrisma()
      const dbJson = JSON.stringify(dbData, null, 2)
      console.log(`📊 Database exported: ${dbJson.length} bytes`)

      // ✅ Create manifest
      const manifest = {
        version: "1.0",
        platform: "Nexus Esports League",
        createdAt: new Date().toISOString(),
        tables: ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad']
      }
      const manifestJson = JSON.stringify(manifest, null, 2)

      // ✅ Create ZIP in memory
      console.log('🗜️ Creating ZIP archive...')
      const zip = new JSZip()
      zip.file('database.json', dbJson)
      zip.file('manifest.json', manifestJson)

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
      const zipSize = zipBuffer.length
      console.log(`🗜️ ZIP created: ${zipSize} bytes`)

      let filePath: string

      // ✅ Production: Use Vercel Blob
      if (isProduction && put && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          console.log('☁️ Uploading to Vercel Blob...')
          const blob = await put(
            `backups/${backupId}.zip`,
            zipBuffer,
            {
              access: 'private',
              addRandomSuffix: false,
              contentType: 'application/zip',
            }
          )
          filePath = blob.url
          console.log(`✅ Backup stored in Vercel Blob: ${filePath}`)
        } catch (blobError) {
          console.error('❌ Vercel Blob upload failed:', blobError)
          console.log('📁 Falling back to local storage...')
          filePath = await this.saveLocal(zipBuffer, backupId)
        }
      } else {
        // ✅ Local: Save to filesystem
        console.log('📁 Saving to local filesystem...')
        filePath = await this.saveLocal(zipBuffer, backupId)
      }

      // ✅ Update backup record
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          status: "COMPLETED",
          size: zipSize,
          filePath: filePath,
        }
      })

      console.log(`✅ Backup ${backupId} completed successfully! Size: ${zipSize} bytes`)

    } catch (error) {
      console.error('❌ Backup worker failed:', error)
      await prisma.backup.update({
        where: { id: backupId },
        data: { status: "FAILED" }
      })
      throw error
    }
  }

  private async saveLocal(zipBuffer: Buffer, backupId: string): Promise<string> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
      const zipPath = path.join(this.backupDir, `${backupId}.zip`)
      await fs.writeFile(zipPath, zipBuffer)
      console.log(`✅ Backup stored locally: ${zipPath}`)
      return zipPath
    } catch (error) {
      console.error('❌ Failed to save locally:', error)
      throw error
    }
  }

  private async exportViaPrisma() {
    const tables = ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad']
    const data: Record<string, any> = {}

    for (const table of tables) {
      try {
        const modelName = table.toLowerCase()
        const model = prisma[modelName as keyof typeof prisma] as any
        if (model) {
          data[table] = await model.findMany()
        }
      } catch (error) {
        console.warn(`Failed to export table ${table}:`, error)
      }
    }

    return data
  }
}

export const backupWorker = new BackupWorker()