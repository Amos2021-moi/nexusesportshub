// app/api/admin/backup/restore/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { backupId } = await request.json();

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 });
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId }
    });

    if (!backup || !backup.filePath) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    console.log(`🔄 Starting restore for backup ${backupId}`);

    // ✅ Create restore log
    const restoreLog = await prisma.restoreLog.create({
      data: {
        backupId,
        status: "PROCESSING",
        restoredBy: session.user.id,
        startedAt: new Date()
      }
    });

    try {
      // ✅ 1. Get backup file
      let buffer: Buffer;
      
      if (backup.filePath.startsWith('http://') || backup.filePath.startsWith('https://')) {
        // Download from Vercel Blob
        const headers: Record<string, string> = {};
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          headers['Authorization'] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
        }
        const response = await fetch(backup.filePath, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch backup: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        // Read from local file
        const fs = await import('fs/promises');
        buffer = await fs.readFile(backup.filePath);
      }

      console.log(`📦 Backup file loaded: ${buffer.length} bytes`);

      // ✅ 2. Try to decrypt if encrypted
      let decryptedBuffer: Buffer;
      try {
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || '';
        if (encryptionKey) {
          const iv = buffer.slice(0, 16);
          const data = buffer.slice(16);
          const key = crypto.scryptSync(encryptionKey, 'salt', 32);
          const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
          decryptedBuffer = Buffer.concat([decipher.update(data), decipher.final()]);
          console.log('🔓 Backup decrypted successfully');
        } else {
          decryptedBuffer = buffer;
        }
      } catch {
        // Not encrypted or encryption failed
        decryptedBuffer = buffer;
        console.log('📁 Backup loaded without encryption');
      }

      // ✅ 3. Extract ZIP
      const zip = await JSZip.loadAsync(decryptedBuffer);
      
      // ✅ 4. Validate backup
      const dbFile = zip.file('database.json');
      const manifestFile = zip.file('manifest.json');
      
      if (!dbFile || !manifestFile) {
        throw new Error('Invalid backup: missing required files');
      }

      const dbJson = await dbFile.async('string');
      const dbData = JSON.parse(dbJson);
      
      console.log(`📊 Restoring data: ${Object.keys(dbData).join(', ')}`);

      // ✅ 5. Restore data to database
      const results: Record<string, number> = {};

      for (const [table, data] of Object.entries(dbData)) {
        if (Array.isArray(data) && data.length > 0) {
          try {
            const modelName = table.toLowerCase();
            const model = prisma[modelName as keyof typeof prisma] as any;
            
            if (model) {
              // ✅ Clear existing data
              await model.deleteMany();
              console.log(`🗑️ Cleared table: ${table}`);
              
              // ✅ Insert new data
              const created = await model.createMany({
                data: data,
                skipDuplicates: true,
              });
              results[table] = created.count;
              console.log(`✅ Restored ${created.count} records to ${table}`);
            }
          } catch (error) {
            console.warn(`Failed to restore table ${table}:`, error);
            results[table] = 0;
          }
        }
      }

      // ✅ 6. Update restore log
      await prisma.restoreLog.update({
        where: { id: restoreLog.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          details: {
            restoredAt: new Date().toISOString(),
            records: results,
            tables: Object.keys(results)
          }
        }
      });

      // ✅ 7. Update backup record
      await prisma.backup.update({
        where: { id: backupId },
        data: {
          restoredAt: new Date(),
          restoredBy: session.user.id
        }
      });

      console.log(`✅ Restore completed for backup ${backupId}`);

      return NextResponse.json({
        success: true,
        message: "Backup restored successfully",
        results
      });

    } catch (error) {
      console.error('❌ Restore failed:', error);
      
      await prisma.restoreLog.update({
        where: { id: restoreLog.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to restore backup" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore backup" },
      { status: 500 }
    );
  }
}