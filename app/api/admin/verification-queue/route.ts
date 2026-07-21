// app/api/admin/verification-queue/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedVerificationQueue = unstable_cache(
  async () => {
    // ✅ Get players awaiting verification
    // Check users who are not verified but have been active
    const pendingVerifications = await prisma.user.findMany({
      where: {
        isVerified: false,
        role: "PLAYER",
        // Users who have logged in recently
        lastActive: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lastActive: true,
        profile: {
          select: {
            username: true,
            profilePicture: true,
          },
        },
        // Get their match history to verify activity
        homeFixtures: {
          select: {
            id: true,
          },
          take: 1,
        },
        awayFixtures: {
          select: {
            id: true,
          },
          take: 1,
        },
        // Check if they have any results submitted
        submittedResults: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Format the response
    const queue = pendingVerifications.map((user) => {
      const hasPlayedMatches = user.homeFixtures.length > 0 || user.awayFixtures.length > 0;
      const hasSubmittedResults = user.submittedResults.length > 0;
      
      let status = "PENDING";
      if (hasPlayedMatches && hasSubmittedResults) {
        status = "ACTIVE";
      } else if (hasPlayedMatches) {
        status = "NEEDS_RESULTS";
      } else if (user.lastActive) {
        status = "NEW";
      }

      return {
        id: user.id,
        name: user.name || "Unnamed Player",
        username: user.profile?.username || "player",
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        lastActive: user.lastActive?.toISOString() || null,
        hasPlayedMatches,
        hasSubmittedResults,
        status,
        profilePicture: user.profile?.profilePicture || null,
      };
    });

    return queue;
  },
  ["admin-verification-queue"],
  { revalidate: 30 }
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getCachedVerificationQueue();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching verification queue:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// ✅ POST endpoint to verify a player
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // ✅ Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
      },
    });

    // ✅ Also update profile badge
    await prisma.profile.update({
      where: { userId },
      data: {
        verifiedBadge: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error verifying player:", error);
    return NextResponse.json(
      { error: "Failed to verify player" },
      { status: 500 }
    );
  }
}