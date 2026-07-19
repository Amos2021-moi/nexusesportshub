import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser, isPushAvailable } from "@/lib/push/send";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Check if push is available
    if (!isPushAvailable()) {
      return NextResponse.json({
        success: false,
        error: "VAPID keys not configured. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to environment variables.",
        status: "VAPID_MISSING"
      }, { status: 500 });
    }

    const body = await request.json();
    const { userId = session.user.id } = body;

    const result = await sendPushToUser(userId, {
      title: "🧪 Test Push Notification",
      body: "Your push notifications are working!",
      icon: "/icons/icon-192.png",
      data: {
        url: "/dashboard",
        type: "TEST",
      },
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Error sending test push:", error);
    return NextResponse.json(
      { error: "Failed to send test push", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}