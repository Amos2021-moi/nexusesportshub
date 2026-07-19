import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id }
    })

    if (!backup || !backup.filePath) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 })
    }

    let fileBuffer: Buffer
    const fileName = `${backup.name}.zip`

    // ✅ Check if it's a Vercel Blob URL or local path
    if (backup.filePath.startsWith('http://') || backup.filePath.startsWith('https://')) {
      // ✅ Download from Vercel Blob
      try {
        const headers: Record<string, string> = {}
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          headers['Authorization'] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
        }

        const response = await fetch(backup.filePath, { headers })
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        fileBuffer = Buffer.from(arrayBuffer)
        console.log(`✅ Downloaded from Blob: ${fileBuffer.length} bytes`)
      } catch (error) {
        console.error('❌ Error downloading from Blob:', error)
        return NextResponse.json(
          { error: "Failed to download backup file" },
          { status: 500 }
        )
      }
    } else {
      // ✅ Read from local file system
      try {
        await fs.access(backup.filePath)
        fileBuffer = await fs.readFile(backup.filePath)
        console.log(`✅ Read from local file: ${fileBuffer.length} bytes`)
      } catch (error) {
        console.error('❌ Error reading local file:', error)
        return NextResponse.json({ error: "Backup file not found" }, { status: 404 })
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Backup file is empty" }, { status: 500 })
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  } catch (error) {
    console.error("❌ Error downloading backup:", error)
    return NextResponse.json(
      { error: "Failed to download backup" },
      { status: 500 }
    )
  }
}