import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date range (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get today's date for comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel
    const [
      totalSent,
      totalRecipients,
      statusCounts,
      channelCounts,
      todaySent,
      readCount,
      recentLogs,
    ]: [
      number,
      { _sum: { recipientCount: number | null } },
      { status: string; _count: number }[],
      { channel: string; _count: number }[],
      number,
      number,
      any[],
    ] = await Promise.all([
      // Total messages sent
      prisma.communicationLog.count(),
      
      // Total recipients reached
      prisma.communicationLog.aggregate({
        _sum: { recipientCount: true },
      }),
      
      // Status breakdown
      prisma.communicationLog.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      // Channel breakdown
      prisma.communicationLog.groupBy({
        by: ["channel"],
        _count: true,
      }),
      
      // Messages sent today
      prisma.communicationLog.count({
        where: {
          sentAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      
      // Total read receipts
      prisma.communicationReceipt.count({
        where: {
          status: "READ",
        },
      }),
      
      // Recent 5 logs for quick view
      prisma.communicationLog.findMany({
        orderBy: { sentAt: "desc" },
        take: 5,
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Format status breakdown
    const statusBreakdown: Record<string, number> = {};
    statusCounts.forEach((item: { status: string; _count: number }) => {
      statusBreakdown[item.status] = item._count;
    });

    // Format channel breakdown
    const channelBreakdown: Record<string, number> = {};
    channelCounts.forEach((item: { channel: string; _count: number }) => {
      channelBreakdown[item.channel] = item._count;
    });

    // Get read rate
    const totalReceipts = await prisma.communicationReceipt.count();
    const readRate = totalReceipts > 0 ? Math.round((readCount / totalReceipts) * 100) : 0;

    return NextResponse.json({
      stats: {
        totalSent,
        totalRecipients: totalRecipients._sum.recipientCount || 0,
        todaySent,
        readCount,
        readRate,
        statusBreakdown,
        channelBreakdown,
      },
      recentLogs,
    });

  } catch (error) {
    console.error("Error fetching communication stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}