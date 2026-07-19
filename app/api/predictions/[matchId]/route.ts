import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { predictionService } from "@/lib/services/prediction.service";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }  // ✅ Added Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    // ✅ Allow both authenticated users and public access
    if (!session) {
      // Still allow public access to predictions
    }

    const { matchId } = await params;  // ✅ Already correct

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID required" },
        { status: 400 }
      );
    }

    // ✅ Check if match exists
    const match = await prisma.fixture.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // ✅ Check if match is already completed
    if (match.status === "COMPLETED") {
      return NextResponse.json({
        error: "Match already completed",
        matchStatus: "COMPLETED"
      });
    }

    // ✅ Calculate prediction
    const prediction = await predictionService.calculatePrediction(matchId);

    return NextResponse.json({
      success: true,
      prediction,
      match: {
        id: match.id,
        homePlayer: {
          name: match.homePlayer.name,
          username: match.homePlayer.profile?.username
        },
        awayPlayer: {
          name: match.awayPlayer.name,
          username: match.awayPlayer.profile?.username
        },
        scheduledDate: match.scheduledDate,
        status: match.status
      }
    });

  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json(
      { error: "Failed to fetch prediction" },
      { status: 500 }
    );
  }
}