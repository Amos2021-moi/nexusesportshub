// app/api/admin/backup-status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedBackupStatus = unstable_cache(
  async () => {
    // ✅ Get latest backup
    const latestBackup = await prisma.backup.findFirst({
      where: {
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        size: true,
        status: true,
        createdAt: true,
        createdBy: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get backup statistics
    const [
      totalBackups,
      successfulBackups,
      failedBackups,
      lastFailedBackup,
    ] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.count({ where: { status: "COMPLETED" } }),
      prisma.backup.count({ where: { status: "FAILED" } }),
      prisma.backup.findFirst({
        where: { status: "FAILED" },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Get backup schedule config
    const backupConfig = await prisma.backupConfig.findFirst();

    // Format size
    const formatSize = (bytes: number) => {
      if (!bytes || bytes === 0) return "0 MB";
      const mb = bytes / (1024 * 1024);
      if (mb < 1024) return `${Math.round(mb)} MB`;
      return `${(mb / 1024).toFixed(1)} GB`;
    };

    const successRate = totalBackups > 0
      ? Math.round((successfulBackups / totalBackups) * 100)
      : 0;

    return {
      lastBackup: latestBackup?.createdAt?.toISOString() || null,
      size: latestBackup?.size ? formatSize(latestBackup.size) : "0 MB",
      status: latestBackup?.status === "COMPLETED" ? "success" : "pending",
      backupName: latestBackup?.name || "No backup",
      createdBy: latestBackup?.user?.name || "System",
      stats: {
        total: totalBackups,
        successful: successfulBackups,
        failed: failedBackups,
        successRate,
      },
      schedule: {
        enabled: backupConfig?.enabled ?? true,
        frequency: backupConfig?.frequency || "DAILY",
        time: backupConfig?.time || "02:00",
        nextRunAt: backupConfig?.nextRunAt || null,
      },
      lastFailed: lastFailedBackup?.createdAt?.toISOString() || null,
    };
  },
  ["admin-backup-status"],
  { revalidate: 60 }
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getCachedBackupStatus();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching backup status:", error);
    return NextResponse.json(
      {
        lastBackup: null,
        size: "0 MB",
        status: "pending",
        backupName: "No backup",
        createdBy: "System",
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
        },
        schedule: {
          enabled: true,
          frequency: "DAILY",
          time: "02:00",
          nextRunAt: null,
        },
        lastFailed: null,
      },
      { status: 200 }
    );
  }
}