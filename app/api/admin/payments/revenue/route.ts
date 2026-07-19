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
    // ✅ Set to end of day to include today
    now.setHours(23, 59, 59, 999);
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    console.log(`📊 Date range: ${startDate.toISOString()} to ${now.toISOString()}`);

    // ✅ Get all payments using createdAt
    const payments = await prisma.seasonEntry.findMany({
      where: {
        OR: [
          { status: "ACTIVE" },
          { status: "NOT_ENROLLED" },
        ],
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        entryFee: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📊 Found ${payments.length} payments in date range`);

    // ✅ Group by day
    const dailyData = new Map<string, { amount: number; count: number }>();

    for (const payment of payments) {
      const dateKey = payment.createdAt.toISOString().split("T")[0];
      
      const existing = dailyData.get(dateKey);

      if (existing) {
        existing.amount += payment.entryFee || 0;
        existing.count += 1;
      } else {
        dailyData.set(dateKey, {
          amount: payment.entryFee || 0,
          count: 1,
        });
      }
    }

    // ✅ Convert to array and fill missing dates
    const result: { date: string; amount: number; count: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      const data = dailyData.get(dateKey);
      result.push({
        date: dateKey,
        amount: data?.amount || 0,
        count: data?.count || 0,
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}