// app/api/admin/revenue/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get revenue data using correct model names
    const [
      totalRevenue,
      paidEntries,
      pendingEntries,
      totalSeasonEntries,
      seasonRevenue,
      recentPayments,
    ] = await Promise.all([
      // Total revenue from season entries (using entryFee)
      prisma.seasonEntry.aggregate({
        _sum: { entryFee: true },
      }),
      // Paid entries count
      prisma.seasonEntry.count({
        where: { status: "ACTIVE" },
      }),
      // Pending entries count
      prisma.seasonEntry.count({
        where: { status: "PAYMENT_PENDING" },
      }),
      // Total season entries
      prisma.seasonEntry.count(),
      // Revenue by season
      prisma.season.findMany({
        select: {
          id: true,
          name: true,
          seasonEntries: {
            select: {
              entryFee: true,
              status: true,
            },
          },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      // Recent payments
      prisma.seasonEntry.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          entryFee: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
              profile: {
                select: {
                  username: true,
                },
              },
            },
          },
          createdAt: true,
          season: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // ✅ Calculate revenue by season
    const revenueBySeason = seasonRevenue.map((season) => ({
      name: season.name,
      total: season.seasonEntries.reduce((sum, entry) => sum + (entry.entryFee || 0), 0),
      paid: season.seasonEntries.filter((e) => e.status === "ACTIVE").length,
      pending: season.seasonEntries.filter((e) => e.status === "PAYMENT_PENDING").length,
    }));

    // ✅ Calculate monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthData = await prisma.seasonEntry.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
          status: "ACTIVE",
        },
        _sum: { entryFee: true },
        _count: true,
      });

      monthlyRevenue.push({
        month: date.toLocaleString("default", { month: "short" }),
        year: date.getFullYear(),
        revenue: monthData._sum?.entryFee || 0,
        count: monthData._count || 0,
      });
    }

    const totalAmount = totalRevenue._sum?.entryFee || 0;
    const completionRate = totalSeasonEntries > 0
      ? Math.round((paidEntries / totalSeasonEntries) * 100)
      : 0;

    return NextResponse.json({
      summary: {
        totalRevenue: totalAmount,
        paidEntries,
        pendingEntries,
        totalSeasonEntries,
        completionRate,
        averagePerEntry: paidEntries > 0 ? Math.round(totalAmount / paidEntries) : 0,
      },
      revenueBySeason: revenueBySeason.reverse(),
      monthlyRevenue: monthlyRevenue.reverse(),
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        amount: payment.entryFee || 0,
        user: payment.user?.name || payment.user?.profile?.username || "Unknown",
        email: payment.user?.email,
        season: payment.season?.name || "Unknown Season",
        date: payment.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return NextResponse.json(
      {
        summary: {
          totalRevenue: 0,
          paidEntries: 0,
          pendingEntries: 0,
          totalSeasonEntries: 0,
          completionRate: 0,
          averagePerEntry: 0,
        },
        revenueBySeason: [],
        monthlyRevenue: [],
        recentPayments: [],
      },
      { status: 200 }
    );
  }
}