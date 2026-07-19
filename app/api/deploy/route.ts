import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentVersion, saveVersionToDatabase, isVersionInDatabase } from "@/lib/version";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Allow anonymous for Vercel deployment hooks, or require admin
    const body = await request.json().catch(() => ({}));
    const { secret, changelog } = body;

    // Verify secret if provided
    const deploySecret = process.env.DEPLOY_SECRET;
    if (deploySecret && secret !== deploySecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current = getCurrentVersion();

    // Check if already in database
    const exists = await isVersionInDatabase();

    if (exists) {
      return NextResponse.json({
        success: true,
        message: "Version already exists in database",
        version: current.version,
        exists: true,
      });
    }

    // Find an admin user to associate with this version
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "No admin found to associate version" },
        { status: 500 }
      );
    }

    // Save version to database
    const entry = await saveVersionToDatabase(
      admin.id,
      changelog || `Deployed version ${current.version}`,
      current.environment
    );

    return NextResponse.json({
      success: true,
      message: `Version ${current.version} saved to database`,
      version: current.version,
      entry,
      environment: current.environment,
    });

  } catch (error) {
    console.error("Error in deploy hook:", error);
    return NextResponse.json(
      { error: "Failed to save version" },
      { status: 500 }
    );
  }
}