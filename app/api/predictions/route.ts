import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { predictionService } from "@/lib/services/prediction.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const seasonId = searchParams.get("seasonId");

    // ✅ Build where clause for fixtures
    const where: any = {
      status: "SCHEDULED",
      scheduledDate: {
        gt: new Date()
      }
    };

    if (seasonId) {
      where.seasonId = seasonId;
    }

    // ✅ Get upcoming fixtures
    const fixtures = await prisma.fixture.findMany({
      where,
      include: {
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        },
        season: {
          select: { name: true }
        }
      },
      orderBy: { scheduledDate: "asc" },
      take: limit
    });

    if (fixtures.length === 0) {
      return NextResponse.json({
        success: true,
        predictions: [],
        message: "No upcoming fixtures found"
      });
    }

    // ✅ Calculate predictions for all fixtures
    const predictions = await Promise.all(
      fixtures.map(async (fixture) => {
        try {
          const prediction = await predictionService.calculatePrediction(fixture.id);
          return {
            fixture: {
              id: fixture.id,
              homePlayer: fixture.homePlayer.name,
              awayPlayer: fixture.awayPlayer.name,
              scheduledDate: fixture.scheduledDate,
              season: fixture.season?.name
            },
            prediction
          };
        } catch (error) {
          console.error(`Error predicting fixture ${fixture.id}:`, error);
          return null;
        }
      })
    );

    // ✅ Filter out failed predictions
    const validPredictions = predictions.filter(p => p !== null);

    return NextResponse.json({
      success: true,
      predictions: validPredictions,
      total: validPredictions.length
    });

  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}

// ✅ Update ELO after match completion (run when result is approved)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID required" },
        { status: 400 }
      );
    }

    // ✅ Check if match is completed and has a result
    const match = await prisma.fixture.findUnique({
      where: { id: matchId },
      include: { result: true }
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    if (match.status !== "COMPLETED" || !match.result) {
      return NextResponse.json(
        { error: "Match not completed or no result found" },
        { status: 400 }
      );
    }

    // ✅ Update ELO ratings
    await predictionService.updateELOAfterMatch(matchId);

    // ✅ Record prediction accuracy
    await recordPredictionAccuracy(matchId);

    return NextResponse.json({
      success: true,
      message: "ELO ratings updated successfully"
    });

  } catch (error) {
    console.error("Error updating ELO:", error);
    return NextResponse.json(
      { error: "Failed to update ELO" },
      { status: 500 }
    );
  }
}

// ✅ Helper function to record prediction accuracy
async function recordPredictionAccuracy(matchId: string) {
  try {
    const match = await prisma.fixture.findUnique({
      where: { id: matchId },
      include: { result: true }
    });

    if (!match || !match.result) return;

    // Get the prediction
    const prediction = await predictionService.calculatePrediction(matchId);
    
    // Determine actual winner
    let actualWinner = null;
    if (match.result.homeScore > match.result.awayScore) {
      actualWinner = match.homePlayerId;
    } else if (match.result.awayScore > match.result.homeScore) {
      actualWinner = match.awayPlayerId;
    }

    // Check if prediction was correct
    const isCorrect = prediction.predictedWinner.id === actualWinner;

    // Save to database (if you have a Prediction model)
    // You can add this later

  } catch (error) {
    console.error("Error recording prediction accuracy:", error);
  }
}