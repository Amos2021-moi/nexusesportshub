import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notificationWithEmailService } from "@/lib/services/notificationWithEmail.service";
import { prisma } from "@/lib/prisma";

// ✅ Send digests (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type = "DAILY" } = body;

    if (type !== "DAILY" && type !== "WEEKLY") {
      return NextResponse.json(
        { error: "Invalid digest type. Use 'DAILY' or 'WEEKLY'" },
        { status: 400 }
      );
    }

    const result = await notificationWithEmailService.sendDigestToAllUsers(type);

    return NextResponse.json({
      success: true,
      message: `${type} digest sent successfully`,
      stats: result,
    });

  } catch (error) {
    console.error("Error sending digest:", error);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}

// ✅ Get digest preview (admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const typeParam = searchParams.get("type") || "DAILY";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // ✅ Get user's digest preview
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Validate and cast type
    const digestType = typeParam === "WEEKLY" ? "WEEKLY" : "DAILY";

    const digest = await notificationWithEmailService.sendDigest(userId, digestType);

    return NextResponse.json({
      success: true,
      user: {
        name: user.profile?.username || user.name,
        email: user.email,
      },
      digest: digest.count > 0 ? `${digest.count} notifications` : "No notifications",
    });

  } catch (error) {
    console.error("Error getting digest preview:", error);
    return NextResponse.json(
      { error: "Failed to get digest preview" },
      { status: 500 }
    );
  }
}