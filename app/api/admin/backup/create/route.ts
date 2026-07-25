import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ✅ Lazy load the backup worker to avoid tracing issues
async function getBackupWorker() {
  // ✅ Dynamic import with webpack ignore to prevent tracing
  const { backupWorker } = await import(/* webpackIgnore: true */ '@/lib/services/backup.worker');
  return backupWorker;
}

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

    // ✅ Load the backup worker lazily and run backup asynchronously
    (async () => {
      try {
        const worker = await getBackupWorker();
        await worker.performBackup(backup.id, adminUser.id);
        console.log(`✅ Backup ${backup.id} completed successfully`);
      } catch (error) {
        console.error(`❌ Backup ${backup.id} failed:`, error);
        
        // ✅ Update backup status to failed
        await prisma.backup.update({
          where: { id: backup.id },
          data: { 
            status: "FAILED",
            metadata: {
              error: error instanceof Error ? error.message : 'Unknown error',
              failedAt: new Date().toISOString()
            }
          }
        });
      }
    })();

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