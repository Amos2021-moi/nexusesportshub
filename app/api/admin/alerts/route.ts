// app/api/admin/alerts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts: Array<{
      id: string;
      type: "critical" | "warning" | "info";
      title: string;
      message: string;
      action: string;
      actionLabel: string;
      timestamp: string;
      priority: "high" | "medium" | "low";
    }> = [];

    // 1. Check pending results
    const pendingResults = await prisma.result.count({
      where: { approved: false },
    });
    if (pendingResults > 0) {
      alerts.push({
        id: "pending-results",
        type: pendingResults > 10 ? "critical" : "warning",
        title: `${pendingResults} pending ${pendingResults === 1 ? 'result' : 'results'}`,
        message: `${pendingResults} ${pendingResults === 1 ? 'result is' : 'results are'} waiting for approval.`,
        action: "/admin/results",
        actionLabel: "Review Results",
        timestamp: new Date().toISOString(),
        priority: pendingResults > 10 ? "high" : "medium",
      });
    }

    // 2. Check pending payments
    const pendingPayments = await prisma.seasonEntry.count({
      where: { status: "PAYMENT_PENDING" },
    });
    if (pendingPayments > 0) {
      alerts.push({
        id: "pending-payments",
        type: pendingPayments > 5 ? "warning" : "info",
        title: `${pendingPayments} pending ${pendingPayments === 1 ? 'payment' : 'payments'}`,
        message: `${pendingPayments} ${pendingPayments === 1 ? 'payment is' : 'payments are'} waiting for verification.`,
        action: "/admin/payments",
        actionLabel: "Verify Payments",
        timestamp: new Date().toISOString(),
        priority: pendingPayments > 5 ? "medium" : "low",
      });
    }

    // 3. Check unscheduled fixtures
    const unscheduledFixtures = await prisma.fixture.count({
      where: {
        scheduledDate: undefined,
        status: "SCHEDULED",
      },
    });
    if (unscheduledFixtures > 0) {
      alerts.push({
        id: "unscheduled-fixtures",
        type: "info",
        title: `${unscheduledFixtures} unscheduled ${unscheduledFixtures === 1 ? 'fixture' : 'fixtures'}`,
        message: `${unscheduledFixtures} ${unscheduledFixtures === 1 ? 'fixture needs' : 'fixtures need'} to be scheduled.`,
        action: "/admin/fixtures",
        actionLabel: "Schedule Fixtures",
        timestamp: new Date().toISOString(),
        priority: "low",
      });
    }

    // 4. Check inactive seasons
    const inactiveSeasons = await prisma.season.count({
      where: {
        isActive: false,
        endDate: { lt: new Date() },
      },
    });
    if (inactiveSeasons > 1) {
      alerts.push({
        id: "inactive-seasons",
        type: "info",
        title: `${inactiveSeasons} inactive ${inactiveSeasons === 1 ? 'season' : 'seasons'}`,
        message: `${inactiveSeasons} completed ${inactiveSeasons === 1 ? 'season needs' : 'seasons need'} archiving.`,
        action: "/admin/seasons",
        actionLabel: "Manage Seasons",
        timestamp: new Date().toISOString(),
        priority: "low",
      });
    }

    // 5. Check backup status
    try {
      const lastBackup = await prisma.backup.findFirst({
        orderBy: { createdAt: "desc" },
      });
      if (lastBackup) {
        const hoursSinceBackup = (Date.now() - new Date(lastBackup.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceBackup > 48) {
          alerts.push({
            id: "backup-old",
            type: "critical",
            title: "Backup is outdated",
            message: `Last backup was ${Math.round(hoursSinceBackup)} hours ago. Please run a backup.`,
            action: "/admin/settings/backup",
            actionLabel: "Run Backup",
            timestamp: new Date().toISOString(),
            priority: "high",
          });
        }
      } else {
        alerts.push({
          id: "no-backup",
          type: "critical",
          title: "No backup found",
          message: "No backup has been created yet. Please create a backup immediately.",
          action: "/admin/settings/backup",
          actionLabel: "Create Backup",
          timestamp: new Date().toISOString(),
          priority: "high",
        });
      }
    } catch (error) {
      // Backup table might not exist yet
    }

    // 6. Check pending reports
    try {
      const pendingReportsCount = await prisma.report.count({
        where: { status: "PENDING" },
      });
      if (pendingReportsCount > 0) {
        alerts.push({
          id: "pending-reports",
          type: pendingReportsCount > 3 ? "critical" : "warning",
          title: `${pendingReportsCount} pending ${pendingReportsCount === 1 ? 'report' : 'reports'}`,
          message: `${pendingReportsCount} user ${pendingReportsCount === 1 ? 'report needs' : 'reports need'} attention.`,
          action: "/admin/moderation",
          actionLabel: "View Reports",
          timestamp: new Date().toISOString(),
          priority: pendingReportsCount > 3 ? "high" : "medium",
        });
      }
    } catch (error) {
      // Report table might not exist
    }

    // 7. Check no active season
    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
    });
    if (!activeSeason) {
      alerts.push({
        id: "no-active-season",
        type: "warning",
        title: "No active season",
        message: "There is currently no active season. Players cannot compete.",
        action: "/admin/seasons",
        actionLabel: "Create Season",
        timestamp: new Date().toISOString(),
        priority: "high",
      });
    }

    // Sort alerts by priority
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] ?? 2;
      const bPriority = priorityOrder[b.priority] ?? 2;
      return aPriority - bPriority;
    });

    // Count by type
    const criticalCount = alerts.filter((a) => a.type === "critical").length;
    const warningCount = alerts.filter((a) => a.type === "warning").length;
    const infoCount = alerts.filter((a) => a.type === "info").length;

    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: criticalCount,
        warning: warningCount,
        info: infoCount,
        hasCritical: criticalCount > 0,
        hasWarning: warningCount > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      {
        alerts: [],
        summary: {
          total: 0,
          critical: 0,
          warning: 0,
          info: 0,
          hasCritical: false,
          hasWarning: false,
        },
      },
      { status: 200 }
    );
  }
}