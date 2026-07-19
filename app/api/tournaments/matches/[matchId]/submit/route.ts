import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    // Get the match
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        homePlayer: {
          include: { profile: true }
        },
        awayPlayer: {
          include: { profile: true }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Check if user is part of this match
    if (match.homePlayerId !== session.user.id && match.awayPlayerId !== session.user.id) {
      return NextResponse.json({ error: "You are not part of this match" }, { status: 403 })
    }

    // Check if match already has a result
    if (match.resultId) {
      return NextResponse.json({ 
        error: "This match already has a result submitted. Waiting for admin approval." 
      }, { status: 400 })
    }

    if (match.status === "PENDING") {
      return NextResponse.json({ 
        error: "This match already has a pending result. Please wait for admin approval." 
      }, { status: 400 })
    }

    if (match.status === "COMPLETED") {
      return NextResponse.json({ 
        error: "This match has already been completed." 
      }, { status: 400 })
    }

    const formData = await request.formData()
    const homeScore = parseInt(formData.get("homeScore") as string)
    const awayScore = parseInt(formData.get("awayScore") as string)
    const evidenceFile = formData.get("evidence") as File

    if (isNaN(homeScore) || isNaN(awayScore)) {
      return NextResponse.json({ error: "Invalid scores" }, { status: 400 })
    }

    if (!evidenceFile) {
      return NextResponse.json({ error: "Evidence screenshot is required" }, { status: 400 })
    }

    let evidenceImage = null
    if (evidenceFile && evidenceFile.size > 0) {
      const bytes = await evidenceFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      evidenceImage = buffer.toString("base64")
    }

    // Create result
    const result = await prisma.result.create({
      data: {
        homeScore,
        awayScore,
        evidenceImage: evidenceImage || null,
        submittedBy: session.user.id,
        approved: false,
        source: "TOURNAMENT",
        tournamentMatchId: matchId
      }
    })

    // Update match status to PENDING
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        resultId: result.id,
        status: "PENDING"
      }
    })

    // Notify the other player
    const otherPlayerId = match.homePlayerId === session.user.id 
      ? match.awayPlayerId 
      : match.homePlayerId

    if (otherPlayerId) {
      await prisma.notification.create({
        data: {
          userId: otherPlayerId,
          title: "📋 Tournament Result Submitted",
          message: `${session.user.name || "A player"} has submitted a result for your tournament match. Waiting for admin approval.`,
          type: "RESULT_APPROVED",
          link: `/tournaments/${match.tournamentId}`
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Result submitted! Waiting for admin approval.",
      result 
    })
  } catch (error) {
    console.error("Error submitting tournament result:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit result" },
      { status: 500 }
    )
  }
}