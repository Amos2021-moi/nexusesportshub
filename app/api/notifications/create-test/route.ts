import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, message, type } = await request.json()

    // Use the exact model name from your schema (Notification or notification)
    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        title,
        message,
        type,
      }
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error("Error creating test notification:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}