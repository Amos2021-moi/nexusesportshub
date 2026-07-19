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

    const body = await request.json()
    const { targetUrl, apiKey, seasonId, tournamentIds } = body

    if (!targetUrl) {
      return NextResponse.json({ error: "Target URL required" }, { status: 400 })
    }

    console.log(`🔄 Starting backup transfer to: ${targetUrl}`)

    // ✅ Generate backup in memory
    const dbData = await exportViaPrisma(seasonId, tournamentIds)
    const dbJson = JSON.stringify(dbData, null, 2)

    const manifest = {
      version: "1.0",
      platform: "Nexus Esports League",
      createdAt: new Date().toISOString(),
      tables: ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad']
    }
    const manifestJson = JSON.stringify(manifest, null, 2)

    const zip = new JSZip()
    zip.file('database.json', dbJson)
    zip.file('manifest.json', manifestJson)

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // ✅ Send directly to target system - convert Buffer to Uint8Array
    const headers: Record<string, string> = {
      'Content-Type': 'application/zip',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${targetUrl}/api/admin/backup/restore-direct`, {
      method: 'POST',
      headers,
      body: new Uint8Array(zipBuffer), // ✅ Convert Buffer to Uint8Array
    })

    if (!response.ok) {
      throw new Error(`Target system returned: ${response.status}`)
    }

    const result = await response.json()

    // ✅ Create backup record locally
    const backup = await prisma.backup.create({
      data: {
        name: `transfer_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        type: "TRANSFER",
        status: "COMPLETED",
        createdBy: session.user.id,
        version: "1.0",
        size: zipBuffer.length,
        filePath: `transferred_to_${targetUrl}`,
        metadata: {
          targetUrl,
          transferredAt: new Date().toISOString(),
          result
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Backup transferred successfully",
      backup,
      targetResponse: result
    })
  } catch (error) {
    console.error('❌ Transfer failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transfer failed" },
      { status: 500 }
    )
  }
}

async function exportViaPrisma(seasonId?: string, tournamentIds?: string[]) {
  const { prisma } = await import('@/lib/prisma')
  const tables = ['User', 'Profile', 'Fixture', 'Result', 'Tournament', 'Season', 'Award', 'News', 'LeagueEntry', 'Squad']
  const data: Record<string, any> = {}

  for (const table of tables) {
    try {
      const modelName = table.toLowerCase()
      const model = prisma[modelName as keyof typeof prisma] as any
      if (model) {
        const where: any = {}
        if (table === 'Season' && seasonId) {
          where.id = seasonId
        }
        if (table === 'Tournament' && tournamentIds?.length) {
          where.id = { in: tournamentIds }
        }
        data[table] = await model.findMany({ where })
      }
    } catch (error) {
      console.warn(`Failed to export table ${table}:`, error)
    }
  }

  return data
}