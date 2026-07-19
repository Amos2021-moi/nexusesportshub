import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get("id");

    if (!logId) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      );
    }

    // Check if log exists and belongs to this admin or any admin
    const log = await prisma.communicationLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return NextResponse.json(
        { error: "Log not found" },
        { status: 404 }
      );
    }

    // Delete the log (cascade will delete receipts)
    await prisma.communicationLog.delete({
      where: { id: logId },
    });

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting communication log:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}