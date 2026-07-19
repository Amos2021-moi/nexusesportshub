import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ GET: Get all admin users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Get all users with ADMIN role
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      },
      include: {
        profile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // ✅ Get super admin emails from env
    const superAdminEmails = process.env.ADMIN_EMAILS?.split(',')?.map(e => e.trim()) || []

    // ✅ Format response
    const formattedAdmins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      username: admin.profile?.username || null,
      createdAt: admin.createdAt,
      isSuperAdmin: superAdminEmails.includes(admin.email)
    }))

    return NextResponse.json(formattedAdmins)
  } catch (error) {
    console.error("Error fetching admins:", error)
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    )
  }
}

// ✅ POST: Add new admin
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // ✅ Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ✅ Check if already admin
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "User is already an admin" }, { status: 400 })
    }

    // ✅ Promote to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" }
    })

    console.log(`👑 User promoted to ADMIN: ${email}`)

    return NextResponse.json({
      success: true,
      message: `${email} is now an admin`
    })
  } catch (error) {
    console.error("Error promoting user:", error)
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    )
  }
}

// ✅ DELETE: Remove admin
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // ✅ Get super admin emails
    const superAdminEmails = process.env.ADMIN_EMAILS?.split(',')?.map(e => e.trim()) || []

    // ✅ Get user to check if they're super admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ✅ Prevent removing super admin
    if (superAdminEmails.includes(user.email)) {
      return NextResponse.json({ 
        error: "Cannot remove a super admin from the env list" 
      }, { status: 403 })
    }

    // ✅ Prevent removing yourself
    if (user.id === session.user.id) {
      return NextResponse.json({ 
        error: "You cannot remove yourself as an admin" 
      }, { status: 403 })
    }

    // ✅ Demote to player
    await prisma.user.update({
      where: { id: userId },
      data: { role: "PLAYER" }
    })

    console.log(`👑 User demoted from ADMIN: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `${user.email} is no longer an admin`
    })
  } catch (error) {
    console.error("Error removing admin:", error)
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 }
    )
  }
}