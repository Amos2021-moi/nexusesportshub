import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Get preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotificationsEnabled: true,
        notificationPreferences: true,
        emailVerified: true,
        emailVerifiedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching email preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

// ✅ Update preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { emailNotificationsEnabled, notificationPreferences } = body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Don't allow enabling if email not verified
    if (emailNotificationsEnabled === true && !user.emailVerified) {
      return NextResponse.json({
        error: "Please verify your email first"
      }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotificationsEnabled: emailNotificationsEnabled !== undefined 
          ? emailNotificationsEnabled 
          : user.emailNotificationsEnabled,
        notificationPreferences: notificationPreferences || user.notificationPreferences || {}
      }
    })

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully"
    })

  } catch (error) {
    console.error("Error updating email preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}