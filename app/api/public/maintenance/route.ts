import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
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
    return NextResponse.json({ isActive: false, message: null, scheduledEnd: null })
  }
}