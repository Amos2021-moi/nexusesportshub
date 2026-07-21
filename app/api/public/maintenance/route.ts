// app/api/public/maintenance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ✅ Try to get maintenance record
    const maintenance = await prisma.maintenance.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        isActive: true,
        message: true,
        scheduledEnd: true,
      },
    });

    // ✅ If no maintenance record found, return inactive
    if (!maintenance) {
      return NextResponse.json(
        { isActive: false, message: null, scheduledEnd: null },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    }

    // ✅ Check if maintenance is currently active
    const now = new Date();
    const isActive = maintenance.isActive &&
      (!maintenance.scheduledEnd || new Date(maintenance.scheduledEnd) >= now);

    return NextResponse.json(
      {
        isActive: isActive || false,
        message: maintenance.message || null,
        scheduledEnd: maintenance.scheduledEnd || null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    // ✅ Return safe fallback
    return NextResponse.json(
      { isActive: false, message: null, scheduledEnd: null },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
}