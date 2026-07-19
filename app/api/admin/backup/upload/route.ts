import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Check if we're in production
const isProduction = process.env.VERCEL === '1'

export async function POST(request: Request) {
  try {
    console.log('🔵 Upload started')
    
    const session = await getServerSession(authOptions)
    console.log('🔵 Session:', session?.user?.email)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log('🔵 Getting form data...')
    const formData = await request.formData()
    const file = formData.get("backup") as File
    console.log('🔵 File:', file?.name, file?.size, file?.type)

    if (!file) {
      return NextResponse.json({ error: "No backup file provided" }, { status: 400 })
    }

    // ✅ Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: "File must be a ZIP archive" }, { status: 400 })
    }

    // ✅ Validate file size
    const MAX_SIZE = 200 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Max ${MAX_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // ✅ Read file content
    console.log('🔵 Reading file...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('🔵 Buffer size:', buffer.length)

    // ✅ Validate ZIP file signature
    if (buffer.length < 4 || buffer.toString('hex', 0, 4) !== '504b0304') {
      return NextResponse.json({ 
        error: "Invalid ZIP file - file does not appear to be a valid ZIP archive" 
      }, { status: 400 })
    }

    let filePath: string
    const fileSize = buffer.length

    // ✅ Production: Store in Vercel Blob
    if (isProduction) {
      console.log('🔵 Production mode - checking BLOB token...')
      
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('❌ BLOB_READ_WRITE_TOKEN is missing')
        return NextResponse.json(
          { error: "Blob token not configured" },
          { status: 500 }
        )
      }

      try {
        const { put } = await import('@vercel/blob')
        console.log('☁️ Uploading to Vercel Blob...')
        const blob = await put(
          `uploads/${Date.now()}_${file.name}`,
          buffer,
          {
            access: 'private',
            addRandomSuffix: false,
            contentType: 'application/zip',
          }
        )
        filePath = blob.url
        console.log(`✅ Uploaded to Vercel Blob: ${filePath}`)
      } catch (blobError) {
        console.error('❌ Vercel Blob upload failed:', blobError)
        return NextResponse.json(
          { error: `Failed to upload to cloud storage: ${blobError instanceof Error ? blobError.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    } else {
      // ✅ Local: Save to filesystem
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const backupDir = path.join(process.cwd(), 'backups', 'uploads')
        await fs.mkdir(backupDir, { recursive: true })
        const fileName = `upload_${Date.now()}_${file.name}`
        filePath = path.join(backupDir, fileName)
        await fs.writeFile(filePath, buffer)
        console.log(`✅ Uploaded to local: ${filePath}`)
      } catch (error) {
        console.error('❌ Local upload failed:', error)
        return NextResponse.json(
          { error: `Failed to save backup: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    // ✅ Save backup record to database
    console.log('🔵 Saving backup record...')
    const backup = await prisma.backup.create({
      data: {
        name: file.name.replace('.zip', ''),
        type: "UPLOADED",
        status: "COMPLETED",
        createdBy: session.user.id,
        version: "1.0",
        size: fileSize,
        filePath: filePath,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: fileSize
        }
      }
    })

    console.log(`✅ Backup uploaded successfully: ${backup.id}, Size: ${fileSize} bytes`)

    return NextResponse.json({
      success: true,
      message: "Backup uploaded successfully",
      backup: {
        id: backup.id,
        name: backup.name,
        size: fileSize,
        createdAt: backup.createdAt
      }
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload backup" },
      { status: 500 }
    )
  }
}