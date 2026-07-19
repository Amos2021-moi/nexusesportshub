import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get all payments from SeasonEntry
    const payments = await prisma.seasonEntry.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        season: {
          select: {
            name: true,
          },
        },
      },
    });

    // ✅ Get all payment attempts (including pending/failed)
    const allPaymentAttempts = await prisma.seasonEntry.findMany();

    // ✅ Get refunded payments
    const refundedPayments = await prisma.seasonEntry.findMany({
      where: {
        status: "REFUNDED",
      },
    });

    // ✅ Calculate stats
    const successfulPayments = payments;
    const totalPayments = allPaymentAttempts.length;
    const successfulCount = successfulPayments.length;
    const refundedCount = refundedPayments.length;
    const failedCount = totalPayments - successfulCount - refundedCount;
    const pendingCount = await prisma.seasonEntry.count({
      where: {
        status: "PAYMENT_PENDING",
      },
    });

    // ✅ Total Revenue
    let totalRevenue = 0;
    let totalFees = 0;
    const uniquePayers = new Set();

    for (const payment of successfulPayments) {
      const amount = payment.entryFee || 0;
      totalRevenue += amount;
      totalFees += amount;
      uniquePayers.add(payment.userId);
    }

    // ✅ Average Fee
    const averageFee = successfulCount > 0 ? totalFees / successfulCount : 0;

    // ✅ Calculate success rate
    const successRate = totalPayments > 0 ? (successfulCount / totalPayments) * 100 : 0;

    // ✅ Calculate revenue change (compare with previous period)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentRevenue = await prisma.seasonEntry.aggregate({
      where: {
        status: "ACTIVE",
        paidAt: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
      _sum: {
        entryFee: true,
      },
    });

    const previousRevenue = await prisma.seasonEntry.aggregate({
      where: {
        status: "ACTIVE",
        paidAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      _sum: {
        entryFee: true,
      },
    });

    const recentTotal = recentRevenue._sum.entryFee || 0;
    const previousTotal = previousRevenue._sum.entryFee || 0;
    const revenueChange = previousTotal > 0
      ? ((recentTotal - previousTotal) / previousTotal) * 100
      : recentTotal > 0 ? 100 : 0;

    // ✅ Payment count change
    const recentPayments = await prisma.seasonEntry.count({
      where: {
        status: "ACTIVE",
        paidAt: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
    });

    const previousPayments = await prisma.seasonEntry.count({
      where: {
        status: "ACTIVE",
        paidAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const paymentChange = previousPayments > 0
      ? ((recentPayments - previousPayments) / previousPayments) * 100
      : recentPayments > 0 ? 100 : 0;

    return NextResponse.json({
      totalRevenue,
      totalPayments: successfulCount,
      successRate: Math.round(successRate * 10) / 10,
      averageFee: Math.round(averageFee),
      activePayers: uniquePayers.size,
      pendingCount,
      failedCount,
      refundedCount,
      revenueChange: Math.round(revenueChange * 10) / 10,
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