import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    console.log("🔵 [add-player] Starting...")
    
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("🔴 [add-player] No session")
      return NextResponse.json(
        { error: "Unauthorized: Please login" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      console.log("🔴 [add-player] Not admin")
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { seasonId, playerId } = body
    console.log(`🔵 [add-player] seasonId: ${seasonId}, playerId: ${playerId}`)

    if (!seasonId || !playerId) {
      console.log("🔴 [add-player] Missing required fields")
      return NextResponse.json(
        { error: "Season ID and Player ID are required" },
        { status: 400 }
      )
    }

    // ✅ Check if season exists
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
    })
    console.log(`🔵 [add-player] Season found: ${!!season}`)

    if (!season) {
      console.log("🔴 [add-player] Season not found")
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      )
    }

    // ✅ Check if player exists in the User table
    const player = await prisma.user.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })
    console.log(`🔵 [add-player] Player found: ${!!player}`)

    if (!player) {
      console.log("🔴 [add-player] Player not found in User table")
      return NextResponse.json(
        { error: `Player with ID ${playerId} not found` },
        { status: 404 }
      )
    }

    // ✅ Check if player is already in this season
    try {
      const existingSeasonEntry = await prisma.seasonEntry.findUnique({
        where: {
          userId_seasonId: {
            userId: playerId,
            seasonId: seasonId,
          },
        },
        include: {
          leagueEntry: true,
        },
      })
      console.log(`🔵 [add-player] Existing season entry: ${!!existingSeasonEntry}`)

      if (existingSeasonEntry) {
        console.log(`🔵 [add-player] Player already in season, checking league entry...`)
        
        if (!existingSeasonEntry.leagueEntry) {
          console.log(`🔵 [add-player] Creating missing league entry...`)
          const leagueEntry = await prisma.leagueEntry.create({
            data: {
              seasonId: seasonId,
              playerId: playerId,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              seasonEntryId: existingSeasonEntry.id,
            },
          })
          console.log(`✅ [add-player] League entry created: ${leagueEntry.id}`)
          
          return NextResponse.json({
            success: true,
            message: "Player already in season, LeagueEntry created",
            alreadyExists: true,
            data: { seasonEntry: existingSeasonEntry, leagueEntry },
          }, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        }

        console.log(`✅ [add-player] Player already fully added`)
        return NextResponse.json({
          success: true,
          message: "Player is already in this season",
          alreadyExists: true,
          data: existingSeasonEntry,
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
      }
    } catch (findError) {
      console.error("🔴 [add-player] Error finding existing entry:", findError)
      // Continue to create new entry if find fails
    }

    console.log(`🔵 [add-player] Creating new player in season...`)

    // ✅ Use transaction with upsert for new player
    const result = await prisma.$transaction(async (tx) => {
      console.log(`🔵 [add-player] Transaction started...`)
      
      // 1. Create SeasonEntry
      // ✅ FIX: Set status to NOT_ENROLLED (not ACTIVE) so payment is required
      const seasonEntry = await tx.seasonEntry.create({
        data: {
          userId: playerId,
          seasonId: seasonId,
          status: CompetitionStatus.NOT_ENROLLED, // ✅ FIXED - was ACTIVE
          entryFee: 0,
          currency: "KES",
        },
      })
      console.log(`✅ [add-player] SeasonEntry created: ${seasonEntry.id}`)

      // 2. Create LeagueEntry linked to SeasonEntry
      const leagueEntry = await tx.leagueEntry.create({
        data: {
          seasonId: seasonId,
          playerId: playerId,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          seasonEntryId: seasonEntry.id,
        },
      })
      console.log(`✅ [add-player] LeagueEntry created: ${leagueEntry.id}`)

      // 3. Use upsert for PlayerSeasonEntry
      await tx.playerSeasonEntry.upsert({
        where: {
          userId_seasonId: {
            userId: playerId,
            seasonId: seasonId,
          },
        },
        update: {
          hasPaid: false,
          seasonEntryId: seasonEntry.id,
        },
        create: {
          userId: playerId,
          seasonId: seasonId,
          hasPaid: false,
          seasonEntryId: seasonEntry.id,
        },
      })
      console.log(`✅ [add-player] PlayerSeasonEntry upserted`)

      // 4. Create Prize Pool if it doesn't exist
      const prizePool = await tx.prizePool.findUnique({
        where: { seasonId: seasonId },
      })

      if (!prizePool) {
        await tx.prizePool.create({
          data: {
            seasonId: seasonId,
            entryFee: 0,
            totalCollected: 0,
            registeredPlayers: 0,
            championReward: 0,
            runnerReward: 0,
            topScorerReward: 0,
            platformReserve: 0,
          },
        })
        console.log(`✅ [add-player] PrizePool created`)
      }

      // 5. Send notification to player
      await tx.notification.create({
        data: {
          userId: playerId,
          title: "🏆 Added to Season",
          message: `You've been added to ${season.name}! Complete payment to access fixtures.`,
          type: "SEASON_UPDATE",
          priority: 50,
          priorityLevel: "MEDIUM",
          channel: "IN_APP",
          link: "/dashboard",
          read: false,
        },
      })
      console.log(`✅ [add-player] Notification created`)

      return { seasonEntry, leagueEntry }
    })

    console.log(`✅ [add-player] Successfully added player ${playerId}`)

    return NextResponse.json({
      success: true,
      message: "Player added to season successfully! Payment is required to access fixtures.",
      alreadyExists: false,
      data: result,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error("❌ [add-player] Error:", error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to add player to season",
      },
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