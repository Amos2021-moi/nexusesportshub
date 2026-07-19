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

    // ✅ Get all payments
    const payments = await prisma.seasonEntry.findMany({
      where: {
        OR: [
          { status: "ACTIVE" },
          { status: "PAYMENT_PENDING" },
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

    // ✅ Generate forecast (simple moving average)
    const result: { date: string; amount: number; count: number; forecast?: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      const data = dailyData.get(dateKey);
      const amount = data?.amount || 0;
      const count = data?.count || 0;

      // ✅ Simple forecast - average of last 3 days
      let forecast: number | undefined;
      if (i >= 3) {
        const last3 = result.slice(-3);
        const avgAmount = last3.reduce((sum, d) => sum + d.amount, 0) / 3;
        const avgCount = last3.reduce((sum, d) => sum + d.count, 0) / 3;
        forecast = Math.round((avgAmount / Math.max(avgCount, 1)) * 1.05);
      }

      result.push({ date: dateKey, amount, count, forecast });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 }
    );
  }
}