import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { logId, userId, channel } = body;

    if (!logId || !userId) {
      return NextResponse.json(
        { error: "logId and userId are required" },
        { status: 400 }
      );
    }

    // Mark the receipt as read
    await prisma.communicationReceipt.updateMany({
      where: {
        logId,
        userId,
        channel: channel || "IN_APP",
        status: { in: ["SENT", "DELIVERED"] },
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });

    // Check if all receipts for this log are read
    const allReceipts = await prisma.communicationReceipt.groupBy({
      by: ["logId", "status"],
      where: { logId },
      _count: true,
    });

    const totalReceipts = allReceipts.reduce((sum, r) => sum + r._count, 0);
    const readCount = allReceipts.find(r => r.status === "READ")?._count || 0;

    // If all are read, update the log status
    if (totalReceipts > 0 && totalReceipts === readCount) {
      await prisma.communicationLog.update({
        where: { id: logId },
        data: {
          status: "READ",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Message marked as read",
    });

  } catch (error) {
    console.error("Error marking as read:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}