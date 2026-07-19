import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getCurrentVersion, 
  saveVersionToDatabase, 
  getVersionHistory,
  getVersionStats,
  isVersionInDatabase 
} from "@/lib/version";

// GET: Get version history and stats
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const environment = searchParams.get("environment") || undefined;

    const [history, stats, currentInDb] = await Promise.all([
      getVersionHistory(limit, environment),
      getVersionStats(),
      isVersionInDatabase(),
    ]);

    const current = getCurrentVersion();

    return NextResponse.json({
      success: true,
      current,
      inDatabase: currentInDb,
      history,
      stats,
    });

  } catch (error) {
    console.error("Error fetching version history:", error);
    return NextResponse.json(
      { error: "Failed to fetch version history" },
      { status: 500 }
    );
  }
}

// POST: Save current version to database
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { changelog, environment } = body;

    const current = getCurrentVersion();

    // Check if already in database
    const exists = await isVersionInDatabase();

    if (exists) {
      return NextResponse.json({
        success: true,
        message: "Version already exists in database",
        version: current.full,
        exists: true,
      });
    }

    // Save to database
    const entry = await saveVersionToDatabase(
      session.user.id,
      changelog || `Version ${current.version} deployed`,
      environment || current.environment
    );

    return NextResponse.json({
      success: true,
      message: `Version ${current.version} saved to database`,
      version: current.full,
      entry,
    });

  } catch (error) {
    console.error("Error saving version:", error);
    return NextResponse.json(
      { error: "Failed to save version" },
      { status: 500 }
    );
  }
}