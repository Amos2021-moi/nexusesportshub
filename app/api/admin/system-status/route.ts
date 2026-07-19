import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import os from "os";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 1. Check Database Connection & Latency
    let databaseStatus = "connected";
    let databaseLatency = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - start;
    } catch (error) {
      databaseStatus = "disconnected";
    }

    // ✅ 2. API Status (self-check)
    const apiStatus = "operational";

    // ✅ 3. Get Last Backup
    const lastBackup = await prisma.backup.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true },
    });

    // ✅ 4. Get Server Uptime
    let uptime = "N/A";
    try {
      const uptimeSeconds = os.uptime();
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      uptime = `${hours}h ${minutes}m ${seconds}s`;
    } catch (error) {
      uptime = "N/A";
    }

    // ✅ 5. Get Memory Usage
    let memoryUsage = "N/A";
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedPercent = totalMemory > 0
        ? ((totalMemory - freeMemory) / totalMemory) * 100
        : 0;
      memoryUsage = `${usedPercent.toFixed(1)}%`;
    } catch (error) {
      memoryUsage = "N/A";
    }

    // ✅ 6. Get CPU Load
    let cpuLoad = "N/A";
    try {
      const loadAvg = os.loadavg()[0];
      const cpuCount = os.cpus().length || 1;
      const loadPercent = (loadAvg / cpuCount) * 100;
      cpuLoad = `${loadPercent.toFixed(1)}%`;
    } catch (error) {
      cpuLoad = "N/A";
    }

    // ✅ 7. Get Database Size
    let databaseSize = "N/A";
    try {
      const result = await prisma.$queryRaw`
        SELECT pg_database_size(current_database()) as size
      `;
      const sizeBytes = parseInt((result as any)?.[0]?.size || "0");
      databaseSize = sizeBytes > 0
        ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
        : "N/A";
    } catch (error) {
      databaseSize = "N/A";
    }

    // ✅ 8. Get Total Users & New Users (24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalUsers, newUsers24h] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: twentyFourHoursAgo } },
      }),
    ]);

    // ✅ 9. Get Pending Items
    const [pendingResults, pendingReports, pendingFixtures] = await Promise.all([
      prisma.result.count({ where: { approved: false } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.fixture.count({ where: { status: "SCHEDULED" } }),
    ]);

    // ✅ 10. Determine System Health
    const issues = [];
    if (databaseStatus === "disconnected") issues.push("Database disconnected");
    if (pendingResults > 50) issues.push("High pending results");
    if (pendingReports > 20) issues.push("High pending reports");

    if (cpuLoad !== "N/A") {
      const cpuValue = parseFloat(cpuLoad);
      if (cpuValue > 80) issues.push("High CPU usage");
    }
    if (memoryUsage !== "N/A") {
      const memValue = parseFloat(memoryUsage);
      if (memValue > 85) issues.push("High memory usage");
    }

    const healthStatus = issues.length === 0 ? "healthy"
      : issues.length <= 2 ? "warning"
      : "critical";

    // ✅ 11. Return Response
    return NextResponse.json({
      database: {
        status: databaseStatus,
        latency: databaseLatency,
        size: databaseSize,
      },
      api: {
        status: apiStatus,
      },
      backup: {
        lastBackup: lastBackup?.createdAt || null,
        status: lastBackup?.status || "N/A",
      },
      server: {
        uptime: uptime,
        memory: memoryUsage,
        cpu: cpuLoad,
      },
      users: {
        total: totalUsers,
        new24h: newUsers24h,
      },
      pending: {
        results: pendingResults,
        reports: pendingReports,
        fixtures: pendingFixtures,
      },
      health: {
        status: healthStatus,
        issues: issues,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching system status:", error);
    return NextResponse.json({
      error: "Failed to fetch system status",
      health: {
        status: "error",
        issues: ["Failed to fetch status"],
      },
    }, { status: 500 });
  }
}