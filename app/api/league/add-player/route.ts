import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Please login" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { seasonId, playerId } = body

    if (!seasonId || !playerId) {
      return NextResponse.json(
        { error: "Season ID and Player ID are required" },
        { status: 400 }
      )
    }

    // ✅ Check if season exists
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
    })

    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      )
    }

    // ✅ Check if player exists
    const player = await prisma.user.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      )
    }

    // ✅ Check if player is already in this season
    const existingEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId,
          playerId,
        },
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { 
          error: "Player is already in this season",
          alreadyExists: true 
        },
        { 
          status: 409,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    // ✅ Create transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create LeagueEntry
      const leagueEntry = await tx.leagueEntry.create({
        data: {
          seasonId,
          playerId,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      })

      // 2. Create or update PlayerSeasonEntry for payment tracking
      const existingPlayerEntry = await tx.playerSeasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: playerId,
            seasonId,
          },
        },
      })

      if (!existingPlayerEntry) {
        await tx.playerSeasonEntry.create({
          data: {
            userId: playerId,
            seasonId,
            hasPaid: false,
          },
        })
      }

      // 3. Create or update SeasonEntry
      const existingSeasonEntry = await tx.seasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: playerId,
            seasonId,
          },
        },
      })

      if (!existingSeasonEntry) {
        await tx.seasonEntry.create({
          data: {
            userId: playerId,
            seasonId,
            status: "NOT_ENROLLED",
            entryFee: 0,
            currency: "KES",
          },
        })
      }

      // 4. Create Prize Pool if it doesn't exist
      const prizePool = await tx.prizePool.findUnique({
        where: { seasonId },
      })

      if (!prizePool) {
        await tx.prizePool.create({
          data: {
            seasonId,
            entryFee: 0,
            totalCollected: 0,
            registeredPlayers: 0,
            championReward: 0,
            runnerReward: 0,
            topScorerReward: 0,
            platformReserve: 0,
          },
        })
      }

      // 5. Send notification to player
      await tx.notification.create({
        data: {
          userId: playerId,
          title: "🏆 Added to Season",
          message: `You've been added to ${season.name}! Check your dashboard for fixtures.`,
          type: "NEW_FIXTURE",
          priority: 50,
          priorityLevel: "MEDIUM",
          channel: "IN_APP",
          link: "/dashboard",
          read: false,
        },
      })

      return leagueEntry
    })

    return NextResponse.json({
      success: true,
      message: "Player added to season successfully!",
      data: result,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("Error adding player to season:", error)
    
    // ✅ Handle specific Prisma errors
    if (error instanceof Error) {
      // Handle unique constraint error
      if (error.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          { 
            error: "Player is already in this season",
            alreadyExists: true 
          },
          { 
            status: 409,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    return NextResponse.json(
      { error: "Failed to add player to season" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}