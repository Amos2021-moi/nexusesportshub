import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ GET: Check maintenance status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const maintenance = await prisma.maintenance.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      isActive: maintenance?.isActive || false,
      message: maintenance?.message || null,
      scheduledEnd: maintenance?.scheduledEnd || null
    })
  } catch (error) {
    console.error("Error fetching maintenance:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

// ✅ POST: Toggle maintenance ON
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { message, scheduledEnd } = body

    // ✅ Delete any existing maintenance
    await prisma.maintenance.deleteMany()

    // ✅ Delete the old setting to avoid conflicts
    await prisma.setting.deleteMany({
      where: {
        category: "system",
        key: "maintenanceMode"
      }
    })

    // ✅ Create new maintenance with scheduled end
    const maintenance = await prisma.maintenance.create({
      data: {
        isActive: true,
        message: message || "We're currently performing scheduled maintenance.",
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null
      }
    })

    return NextResponse.json({
      success: true,
      isActive: true,
      maintenance
    })
  } catch (error) {
    console.error("Error starting maintenance:", error)
    return NextResponse.json({ error: "Failed to start maintenance" }, { status: 500 })
  }
}

// ✅ DELETE: Turn maintenance OFF
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Delete all maintenance
    await prisma.maintenance.deleteMany()

    // ✅ Update settings
    const setting = await prisma.setting.findFirst({
      where: {
        category: "system",
        key: "maintenanceMode"
      }
    })

    if (setting) {
      await prisma.setting.update({
        where: { id: setting.id },
        data: { value: "false" }
      })
    }

    return NextResponse.json({
      success: true,
      isActive: false
    })
  } catch (error) {
    console.error("Error ending maintenance:", error)
    return NextResponse.json({ error: "Failed to end maintenance" }, { status: 500 })
  }
}