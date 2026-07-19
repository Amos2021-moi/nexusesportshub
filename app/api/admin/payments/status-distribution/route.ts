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

    // ✅ Get counts for each status
    const [activeCount, pendingCount, notEnrolledCount, refundedCount] = await Promise.all([
      prisma.seasonEntry.count({
        where: { status: "ACTIVE" },
      }),
      prisma.seasonEntry.count({
        where: { status: "PAYMENT_PENDING" },
      }),
      prisma.seasonEntry.count({
        where: { status: "NOT_ENROLLED" },
      }),
      prisma.seasonEntry.count({
        where: { status: "REFUNDED" },
      }),
    ]);

    // ✅ Also check PlayerSeasonEntry for additional payment data
    const playerPaidCount = await prisma.playerSeasonEntry.count({
      where: { hasPaid: true },
    });

    // ✅ Combine counts (prefer SeasonEntry status)
    const total = activeCount + pendingCount + notEnrolledCount + refundedCount + playerPaidCount;

    // ✅ Build distribution
    const distribution = [];

    // Active/Paid
    const paidTotal = activeCount + playerPaidCount;
    distribution.push({
      status: "Paid",
      count: paidTotal,
      percentage: total > 0 ? Math.round((paidTotal / total) * 100) : 0,
      color: "emerald",
    });

    // Pending
    distribution.push({
      status: "Pending",
      count: pendingCount,
      percentage: total > 0 ? Math.round((pendingCount / total) * 100) : 0,
      color: "yellow",
    });

    // Failed/Not Enrolled
    distribution.push({
      status: "Failed",
      count: notEnrolledCount,
      percentage: total > 0 ? Math.round((notEnrolledCount / total) * 100) : 0,
      color: "red",
    });

    // Refunded
    distribution.push({
      status: "Refunded",
      count: refundedCount,
      percentage: total > 0 ? Math.round((refundedCount / total) * 100) : 0,
      color: "gray",
    });

    // ✅ If no data, return placeholder
    if (total === 0) {
      return NextResponse.json([
        { status: "Paid", count: 0, percentage: 0, color: "emerald" },
        { status: "Pending", count: 0, percentage: 0, color: "yellow" },
        { status: "Failed", count: 0, percentage: 0, color: "red" },
        { status: "Refunded", count: 0, percentage: 0, color: "gray" },
      ]);
    }

    // ✅ Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    return NextResponse.json(distribution);

  } catch (error) {
    console.error("Error fetching payment status distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch status distribution" },
      { status: 500 }
    );
  }
}