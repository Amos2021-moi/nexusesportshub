import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ Get user's email preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ✅ Get or create preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          emailDigest: "DAILY",
          pushEnabled: true,
          minPriorityPush: 70,
          minPriorityInApp: 30,
          matchReminders: true,
          resultApproved: true,
          tournamentUpdates: true,
          newsAlerts: true,
          communityAlerts: true,
          systemAlerts: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error) {
    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// ✅ Update email preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // ✅ Allowed fields
    const allowedFields = [
      "emailEnabled",
      "emailDigest",
      "pushEnabled",
      "pushQuietHours",
      "minPriorityPush",
      "minPriorityInApp",
      "matchReminders",
      "resultApproved",
      "tournamentUpdates",
      "newsAlerts",
      "communityAlerts",
      "systemAlerts",
    ];

    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // ✅ Update or create preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        emailEnabled: body.emailEnabled ?? true,
        emailDigest: body.emailDigest ?? "DAILY",
        pushEnabled: body.pushEnabled ?? true,
        minPriorityPush: body.minPriorityPush ?? 70,
        minPriorityInApp: body.minPriorityInApp ?? 30,
        matchReminders: body.matchReminders ?? true,
        resultApproved: body.resultApproved ?? true,
        tournamentUpdates: body.tournamentUpdates ?? true,
        newsAlerts: body.newsAlerts ?? true,
        communityAlerts: body.communityAlerts ?? true,
        systemAlerts: body.systemAlerts ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email preferences updated",
      preferences,
    });

  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}