import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper to check if uploads are enabled
async function checkUploadsEnabled() {
  const uploadsSetting = await prisma.setting.findFirst({
    where: {
      category: "system",
      key: "uploadsEnabled"
    }
  })

  if (uploadsSetting) {
    const isEnabled = JSON.parse(uploadsSetting.value)
    if (!isEnabled) {
      throw new Error("Uploads are currently disabled by the admin")
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    // ✅ Check if uploads are enabled
    await checkUploadsEnabled()

    // Check content type
    const contentType = request.headers.get("content-type") || ""

    let imageData: string
    let type: string

    if (contentType.includes("multipart/form-data")) {
      // Handle form data (file upload)
      const formData = await request.formData()
      const file = formData.get("file") as File
      type = formData.get("type") as string || "profile"

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString("base64")
      const mimeType = file.type
      imageData = `data:${mimeType};base64,${base64}`
    } else if (contentType.includes("application/json")) {
      // Handle JSON (base64 string)
      const body = await request.json()
      imageData = body.image
      type = body.type || "profile"

      if (!imageData) {
        return NextResponse.json({ error: "No image data provided" }, { status: 400 })
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use multipart/form-data or application/json" },
        { status: 400 }
      )
    }

    // Check if profile exists
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    })

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          username: session.user.email?.split('@')[0] || "player_" + Math.random().toString(36).substr(2, 8),
        },
      })
    }

    // Update the image
    if (type === "profile") {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { profilePicture: imageData },
      })
    } else if (type === "banner") {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { bannerImage: imageData },
      })
    }

    return NextResponse.json({ url: imageData })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("disabled") ? 403 : 500 }
    )
  }
}