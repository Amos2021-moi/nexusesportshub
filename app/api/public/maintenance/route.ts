// app/api/public/maintenance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ In-memory cache for 30 seconds
let cache: {
  data: { isActive: boolean; message: string | null; scheduledEnd: string | null };
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30; // seconds

export async function GET() {
  try {
    // ✅ Check cache first
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION * 1000) {
      return NextResponse.json(cache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // ✅ Use a simpler query with a timeout
    // ✅ Only select what we need (no full object)
    const maintenance = await prisma.maintenance.findFirst({
      where: { isActive: true },
      select: {
        isActive: true,
        message: true,
        scheduledEnd: true,
      },
      // ✅ Limit to 1 record
      take: 1,
    });

    // ✅ If no maintenance record found, return inactive
    if (!maintenance) {
      const result = { isActive: false, message: null, scheduledEnd: null };
      
      // ✅ Cache the result
      cache = {
        data: result,
        timestamp: now,
      };

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // ✅ Check if maintenance is currently active
    const isActive = maintenance.isActive &&
      (!maintenance.scheduledEnd || new Date(maintenance.scheduledEnd) >= new Date());

    const result = {
      isActive: isActive || false,
      message: maintenance.message || null,
      scheduledEnd: maintenance.scheduledEnd ? new Date(maintenance.scheduledEnd).toISOString() : null,
    };

    // ✅ Cache the result
    cache = {
      data: result,
      timestamp: now,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error("Error fetching maintenance:", error);
    
    // ✅ Return cached data if available (graceful degradation)
    if (cache) {
      return NextResponse.json(cache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30',
        },
      });
    }

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

// ✅ Optional: Clear cache when maintenance is updated (for admin routes)
export async function POST(request: Request) {
  // ✅ Clear cache when maintenance is updated
  cache = null;
  
  // ✅ Handle the update
  try {
    const body = await request.json();
    const { isActive, message, scheduledEnd } = body;
    
    // ✅ Update maintenance record
    const maintenance = await prisma.maintenance.upsert({
      where: { id: 'single' },
      update: {
        isActive,
        message,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      },
      create: {
        id: 'single',
        isActive,
        message,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      },
    });
    
    return NextResponse.json({ success: true, maintenance });
  } catch (error) {
    console.error("Error updating maintenance:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance" },
      { status: 500 }
    );
  }
}