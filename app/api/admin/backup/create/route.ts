// app/api/admin/backup/create/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backupWorker } from "@/lib/services/backup.worker";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type = "MANUAL" } = await request.json();

    // ✅ Get or create admin user in this database
    let adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // ✅ If admin user doesn't exist, try to find by email or create
    if (!adminUser) {
      console.log(`⚠️ Admin user ${session.user.id} not found, looking up by email...`);
      
      // Try to find by email
      if (session.user.email) {
        adminUser = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      }
      
      // ✅ If still not found, create a fallback admin
      if (!adminUser) {
        console.log(`⚠️ Creating fallback admin user for backup...`);
        adminUser = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || `admin_${Date.now()}@nexus.local`,
            name: session.user.name || "System Admin",
            role: "ADMIN",
            isVerified: true,
          }
        });
        console.log(`✅ Created fallback admin: ${adminUser.id}`);
      }
    }

    // ✅ Create backup record with validated user ID
    const backup = await prisma.backup.create({
      data: {
        name: `backup_${new Date().toISOString().replace(/[:.]/g, '_')}`,
        type,
        status: "PROCESSING",
        createdBy: adminUser.id,
        version: "1.0",
        size: 0,
      }
    });

    // ✅ Run backup asynchronously
    backupWorker.performBackup(backup.id, adminUser.id)
      .then(() => {
        console.log(`✅ Backup ${backup.id} completed successfully`);
      })
      .catch((error) => {
        console.error(`❌ Backup ${backup.id} failed:`, error);
      });

    return NextResponse.json({
      success: true,
      message: "Backup started successfully",
      backupId: backup.id,
      status: "PROCESSING"
    });

  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create backup" },
      { status: 500 }
    );
  }
}