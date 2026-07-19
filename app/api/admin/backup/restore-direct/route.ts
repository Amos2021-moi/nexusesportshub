import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zipBuffer = await request.arrayBuffer()
    const zip = await JSZip.loadAsync(zipBuffer)

    // ✅ Validate backup
    const requiredFiles = ['database.json', 'manifest.json']
    for (const required of requiredFiles) {
      if (!zip.file(required)) {
        return NextResponse.json({ 
          error: `Invalid backup: missing ${required}` 
        }, { status: 400 })
      }
    }

    const dbJson = await zip.file('database.json')?.async('string')
    if (!dbJson) {
      return NextResponse.json({ error: "Database data missing" }, { status: 400 })
    }

    const dbData = JSON.parse(dbJson)

    // ✅ Restore data to database
    const results: Record<string, number> = {}

    for (const [table, data] of Object.entries(dbData)) {
      if (Array.isArray(data) && data.length > 0) {
        const modelName = table.toLowerCase()
        const model = prisma[modelName as keyof typeof prisma] as any
        
        if (model) {
          // ✅ Delete existing data (optional, depending on restore strategy)
          // await model.deleteMany()
          
          // ✅ Insert new data
          const created = await model.createMany({
            data: data,
            skipDuplicates: true,
          })
          results[table] = created.count
        }
      }
    }

    // ✅ Create restore log
    await prisma.restoreLog.create({
      data: {
        backupId: "direct_restore",
        status: "COMPLETED",
        restoredBy: session.user.id,
        details: {
          restoredAt: new Date().toISOString(),
          records: results
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully",
      results
    })
  } catch (error) {
    console.error('❌ Direct restore failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restore failed" },
      { status: 500 }
    )
  }
}