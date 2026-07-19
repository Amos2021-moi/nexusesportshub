import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { smartNotificationService } from "@/lib/services/smartNotification.service";
import { notificationAgent } from "@/lib/agents/notificationAgent";
import { prisma } from "@/lib/prisma";

// ✅ Get user's notifications
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const priority = searchParams.get("priority") as any;
    const type = searchParams.get("type");

    const userId = session.user.id;

    // ✅ Get notifications
    const result = await smartNotificationService.getUserNotifications(
      userId,
      limit,
      priority
    );

    // ✅ Filter by type if specified
    let notifications = result.notifications;
    if (type) {
      notifications = notifications.filter((n: any) => n.type === type);
    }

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: result.unreadCount,
      counts: result.counts,
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// ✅ Create a notification (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, link, channel, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Create notification
    const notification = await smartNotificationService.createNotification(
      userId,
      type,
      title,
      message,
      data || {},
      link || null,
      channel || "IN_APP"
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
    });

  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// ✅ Mark notification as read
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    const userId = session.user.id;

    if (markAll) {
      await smartNotificationService.markAllAsRead(userId);
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    await smartNotificationService.markAsRead(notificationId, userId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });

  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// ✅ Delete notification
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });

  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}