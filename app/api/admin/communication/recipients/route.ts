import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Fetch players
    const players = await prisma.user.findMany({
      where: {
        role: "PLAYER",
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { profile: { username: { contains: search, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailNotificationsEnabled: true,
        isVerified: true,
        profile: {
          select: {
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    const total = await prisma.user.count({
      where: {
        role: "PLAYER",
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { profile: { username: { contains: search, mode: "insensitive" } } },
        ],
      },
    });

    return NextResponse.json({
      players,
      total,
      limit,
    });

  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipients" },
      { status: 500 }
    );
  }
}