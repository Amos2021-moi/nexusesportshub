import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const seasonId = searchParams.get("seasonId");
    const filter = searchParams.get("filter") || "all";

    // ✅ Build where clause for search/filters (but NOT for status filtering)
    const where: any = {};
    
    if (search) {
      where.OR = [
        { fixture: { homePlayer: { name: { contains: search, mode: "insensitive" } } } },
        { fixture: { awayPlayer: { name: { contains: search, mode: "insensitive" } } } },
        { fixture: { homePlayer: { profile: { username: { contains: search, mode: "insensitive" } } } } },
        { fixture: { awayPlayer: { profile: { username: { contains: search, mode: "insensitive" } } } } },
        { tournamentMatch: { homePlayer: { name: { contains: search, mode: "insensitive" } } } },
        { tournamentMatch: { awayPlayer: { name: { contains: search, mode: "insensitive" } } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { profile: { username: { contains: search, mode: "insensitive" } } } },
        { source: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
    }
    if (dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };
    }

    if (seasonId && seasonId !== "all") {
      where.fixture = { seasonId };
    }

    // ✅ Get totals - NO filter applied here!
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, pending, approved, today] = await Promise.all([
      prisma.result.count({ where }),
      prisma.result.count({ where: { ...where, approved: false } }),
      prisma.result.count({ where: { ...where, approved: true } }),
      prisma.result.count({
        where: {
          ...where,
          createdAt: {
            gte: startOfDay,
          },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      pending,
      approved,
      today,
    });
  } catch (error) {
    console.error("Error fetching result stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}