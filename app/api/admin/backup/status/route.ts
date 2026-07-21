// app/api/admin/backup/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get("id");

    if (!backupId) {
      return NextResponse.json({ error: "Backup ID required" }, { status: 400 });
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
      select: {
        id: true,
        status: true,
        size: true,
        createdAt: true,
        filePath: true,
        name: true,
        type: true,
        createdBy: true,
        metadata: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    return NextResponse.json(backup);
  } catch (error) {
    console.error("Error checking backup status:", error);
    return NextResponse.json(
      { error: "Failed to check backup status" },
      { status: 500 }
    );
  }
}