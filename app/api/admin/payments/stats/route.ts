import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompetitionStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get ALL season entries (not just ACTIVE)
    const allEntries = await prisma.seasonEntry.findMany();

    // ✅ Count by status using the correct enum
    const activeEntries = allEntries.filter(e => e.status === CompetitionStatus.ACTIVE);
    const pendingEntries = allEntries.filter(e => e.status === CompetitionStatus.PAYMENT_PENDING);
    const suspendedEntries = allEntries.filter(e => e.status === CompetitionStatus.SUSPENDED);
    const refundedEntries = allEntries.filter(e => e.status === CompetitionStatus.REFUNDED);
    const notEnrolledEntries = allEntries.filter(e => e.status === CompetitionStatus.NOT_ENROLLED);

    // ✅ Calculate stats
    const totalPayments = allEntries.length;
    const successfulCount = activeEntries.length;
    const pendingCount = pendingEntries.length;
    const failedCount = suspendedEntries.length;
    const refundedCount = refundedEntries.length;

    // ✅ Total Revenue - from ACTIVE entries only
    let totalRevenue = 0;
    const uniquePayers = new Set();

    for (const entry of activeEntries) {
      const amount = entry.entryFee || 0;
      totalRevenue += amount;
      if (entry.userId) {
        uniquePayers.add(entry.userId);
      }
    }

    // ✅ Average Amount
    const averageAmount = successfulCount > 0 ? totalRevenue / successfulCount : 0;

    // ✅ Calculate success rate (ACTIVE / TOTAL * 100)
    const completionRate = totalPayments > 0 ? (successfulCount / totalPayments) * 100 : 0;

    // ✅ Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = allEntries.filter(e => {
      const createdAt = new Date(e.createdAt);
      return createdAt >= today && createdAt < tomorrow && e.status === CompetitionStatus.ACTIVE;
    });

    const todayRevenue = todayEntries.reduce((sum, e) => sum + (e.entryFee || 0), 0);

    // ✅ This week's revenue
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekEntries = allEntries.filter(e => {
      const createdAt = new Date(e.createdAt);
      return createdAt >= weekStart && createdAt < weekEnd && e.status === CompetitionStatus.ACTIVE;
    });

    const weekRevenue = weekEntries.reduce((sum, e) => sum + (e.entryFee || 0), 0);

    // ✅ This month's revenue
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthEntries = allEntries.filter(e => {
      const createdAt = new Date(e.createdAt);
      return createdAt >= monthStart && createdAt < monthEnd && e.status === CompetitionStatus.ACTIVE;
    });

    const monthRevenue = monthEntries.reduce((sum, e) => sum + (e.entryFee || 0), 0);

    // ✅ Calculate growth rate (compare this month vs last month)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);

    const lastMonthEntries = allEntries.filter(e => {
      const createdAt = new Date(e.createdAt);
      return createdAt >= lastMonthStart && createdAt < lastMonthEnd && e.status === CompetitionStatus.ACTIVE;
    });

    const lastMonthRevenue = lastMonthEntries.reduce((sum, e) => sum + (e.entryFee || 0), 0);
    const growthRate = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthRevenue > 0 ? 100 : 0;

    // ✅ Calculate payment change (compare this month vs last month)
    const currentMonthCount = monthEntries.length;
    const lastMonthCount = lastMonthEntries.length;
    const paymentChange = lastMonthCount > 0 
      ? ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100 
      : currentMonthCount > 0 ? 100 : 0;

    // ✅ Return stats in the format the frontend expects
    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      totalPayments: totalPayments,
      successRate: Math.round(completionRate * 10) / 10,
      averageFee: Math.round(averageAmount),
      activePayers: uniquePayers.size,
      pendingCount: pendingCount,
      failedCount: failedCount,
      refundedCount: refundedCount,
      revenueChange: Math.round(growthRate * 10) / 10,
      paymentChange: Math.round(paymentChange * 10) / 10,
    });

  } catch (error) {
    console.error("Error fetching payment stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment stats" },
      { status: 500 }
    );
  }
}