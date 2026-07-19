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
    const days = parseInt(searchParams.get("days") || "30");

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // ✅ Get daily user activity
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        createdAt: true,
        lastActive: true,
      },
    });

    // ✅ Get daily matches
    const matches = await prisma.fixture.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // ✅ Get daily payments
    const payments = await prisma.seasonEntry.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // ✅ Group by day
    const dailyActivity = new Map<
      string,
      { users: number; matches: number; payments: number; pageViews: number }
    >();

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dailyActivity.set(dateKey, { users: 0, matches: 0, payments: 0, pageViews: 0 });
    }

    // Count users
    for (const user of users) {
      const dateKey = user.createdAt.toISOString().split("T")[0];
      const data = dailyActivity.get(dateKey);
      if (data) data.users += 1;
    }

    // Count matches
    for (const match of matches) {
      const dateKey = match.createdAt.toISOString().split("T")[0];
      const data = dailyActivity.get(dateKey);
      if (data) data.matches += 1;
    }

    // Count payments
    for (const payment of payments) {
      const dateKey = payment.createdAt.toISOString().split("T")[0];
      const data = dailyActivity.get(dateKey);
      if (data) data.payments += 1;
    }

    // ✅ Page views (simulated for now)
    const result = Array.from(dailyActivity.entries()).map(([date, data]) => ({
      date,
      users: data.users,
      matches: data.matches,
      payments: data.payments,
      pageViews: Math.floor(Math.random() * 100) + 20,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching activity analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity data" },
      { status: 500 }
    );
  }
}