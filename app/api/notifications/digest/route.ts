import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { smartNotificationService } from "@/lib/services/smartNotification.service";

// ✅ Get daily digest
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily";

    const userId = session.user.id;

    if (type === "daily") {
      const digest = await smartNotificationService.generateDigest(userId);

      return NextResponse.json({
        success: true,
        digest: {
          date: new Date().toISOString(),
          total: digest.total,
          critical: digest.critical,
          high: digest.high,
          medium: digest.medium,
          low: digest.low,
          hasNotifications: digest.total > 0,
        },
      });
    }

    // ✅ Weekly digest (last 7 days)
    if (type === "weekly") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { priority: "desc" },
      });

      const grouped = {
        critical: notifications.filter((n: any) => n.priorityLevel === "CRITICAL"),
        high: notifications.filter((n: any) => n.priorityLevel === "HIGH"),
        medium: notifications.filter((n: any) => n.priorityLevel === "MEDIUM"),
        low: notifications.filter((n: any) => n.priorityLevel === "LOW"),
        total: notifications.length,
        date: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        digest: grouped,
      });
    }

    return NextResponse.json(
      { error: "Invalid digest type" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error fetching digest:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest" },
      { status: 500 }
    );
  }
}