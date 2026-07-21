// app/api/admin/backup/schedule/route.ts
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

    let config = await prisma.backupConfig.findFirst();

    if (!config) {
      config = await prisma.backupConfig.create({
        data: {
          enabled: true,
          frequency: "DAILY",
          time: "02:00",
          keepDaily: 7,
          keepWeekly: 4,
          keepMonthly: 3,
          nextRunAt: calculateNextRun("02:00")
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching backup schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, frequency, time, keepDaily, keepWeekly, keepMonthly } = body;

    let config = await prisma.backupConfig.findFirst();

    if (config) {
      config = await prisma.backupConfig.update({
        where: { id: config.id },
        data: {
          enabled: enabled !== undefined ? enabled : config.enabled,
          frequency: frequency || config.frequency,
          time: time || config.time,
          keepDaily: keepDaily || config.keepDaily,
          keepWeekly: keepWeekly || config.keepWeekly,
          keepMonthly: keepMonthly || config.keepMonthly,
          nextRunAt: calculateNextRun(time || config.time),
          updatedAt: new Date()
        }
      });
    } else {
      config = await prisma.backupConfig.create({
        data: {
          enabled: enabled !== undefined ? enabled : true,
          frequency: frequency || "DAILY",
          time: time || "02:00",
          keepDaily: keepDaily || 7,
          keepWeekly: keepWeekly || 4,
          keepMonthly: keepMonthly || 3,
          nextRunAt: calculateNextRun(time || "02:00")
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully",
      config
    });
  } catch (error) {
    console.error("Error updating backup schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

function calculateNextRun(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= new Date()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}