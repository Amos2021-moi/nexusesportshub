// app/api/public/maintenance/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // ✅ Add timeout to prevent hanging on mobile
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Maintenance check timeout")), 3000)
    })

    const maintenancePromise = prisma.maintenance.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        isActive: true,
        message: true,
        startAt: true,
        endAt: true,
        scheduledEnd: true,
      },
    })

    const maintenance = await Promise.race([maintenancePromise, timeoutPromise]) as any

    // ✅ If no maintenance or timeout, return inactive
    if (!maintenance) {
      return NextResponse.json(
        { isActive: false, message: null, scheduledEnd: null },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      )
    }

    // ✅ Check if maintenance is currently active
    const now = new Date()
    const isActive = maintenance.isActive &&
      (!maintenance.startAt || new Date(maintenance.startAt) <= now) &&
      (!maintenance.endAt || new Date(maintenance.endAt) >= now)

    return NextResponse.json(
      {
        isActive: isActive || false,
        message: maintenance.message || null,
        scheduledEnd: maintenance.scheduledEnd || maintenance.endAt || null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error("Error fetching maintenance:", error)
    // ✅ Return safe fallback
    return NextResponse.json(
      { isActive: false, message: null, scheduledEnd: null },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  }
}