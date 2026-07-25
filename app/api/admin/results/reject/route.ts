import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notificationWithEmailService } from "@/lib/services/notificationWithEmail.service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { resultId } = await request.json()

    if (!resultId) {
      return NextResponse.json({ error: "Result ID required" }, { status: 400 })
    }

    // ✅ Get the result with related data
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        fixture: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
            season: true
          }
        },
        tournamentMatch: {
          include: {
            homePlayer: { include: { profile: true } },
            awayPlayer: { include: { profile: true } },
            tournament: true
          }
        },
        user: { include: { profile: true } }
      }
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    if (result.approved) {
      return NextResponse.json({ error: "Result already approved" }, { status: 400 })
    }

    // ✅ Handle Tournament Match Rejection
    if (result.tournamentMatch) {
      const match = result.tournamentMatch

      // Reset tournament match status
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: {
          status: "PENDING",
          winnerId: null
        }
      })

      // Delete the result
      await prisma.result.delete({
        where: { id: resultId }
      })

      // ✅ Send rejection notifications
      const homeName = match.homePlayer?.profile?.username || match.homePlayer?.name || "Home Player"
      const awayName = match.awayPlayer?.profile?.username || match.awayPlayer?.name || "Away Player"

      // Notify home player
      if (match.homePlayerId) {
        await notificationWithEmailService.sendResultNotification(match.homePlayerId, {
          homePlayer: homeName,
          awayPlayer: awayName,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "rejected"
        })
      }

      // Notify away player
      if (match.awayPlayerId) {
        await notificationWithEmailService.sendResultNotification(match.awayPlayerId, {
          homePlayer: homeName,
          awayPlayer: awayName,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "rejected"
        })
      }

      // ✅ Log to audit
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "REJECT_RESULT",
          targetType: "RESULT",
          targetId: resultId,
          details: {
            tournamentMatchId: match.id,
            tournamentId: match.tournamentId,
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            submittedBy: result.submittedBy,
            reason: "Tournament result rejected"
          }
        }
      })

      return NextResponse.json({ 
        success: true, 
        message: "Tournament result rejected successfully"
      })
    }

    // ✅ Handle League Fixture Rejection
    if (!result.fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    const fixture = result.fixture

    // Reset fixture status
    await prisma.fixture.update({
      where: { id: fixture.id },
      data: {
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null,
        submittedBy: null,
        submittedAt: null
      }
    })

    // Delete the result
    await prisma.result.delete({
      where: { id: resultId }
    })

    // ✅ Send rejection notifications
    const homeName = fixture.homePlayer?.profile?.username || fixture.homePlayer?.name || "Home Player"
    const awayName = fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name || "Away Player"

    // In-app notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: fixture.homePlayerId,
          title: "❌ Result Rejected",
          message: `Your result vs ${awayName} (${result.homeScore}-${result.awayScore}) was rejected by an admin. Please resubmit if needed.`,
          type: "RESULT_REJECTED",
          link: `/matches/${result.fixtureId}`,
          read: false,
          priority: 70,
          priorityLevel: "HIGH",
          channel: "IN_APP"
        },
        {
          userId: fixture.awayPlayerId,
          title: "❌ Result Rejected",
          message: `Your result vs ${homeName} (${result.homeScore}-${result.awayScore}) was rejected by an admin. Please resubmit if needed.`,
          type: "RESULT_REJECTED",
          link: `/matches/${result.fixtureId}`,
          read: false,
          priority: 70,
          priorityLevel: "HIGH",
          channel: "IN_APP"
        },
        {
          userId: result.submittedBy,
          title: "❌ Your Submission Was Rejected",
          message: `Your result submission for ${homeName} vs ${awayName} (${result.homeScore}-${result.awayScore}) was rejected by an admin.`,
          type: "RESULT_REJECTED",
          link: `/matches/${result.fixtureId}`,
          read: false,
          priority: 80,
          priorityLevel: "HIGH",
          channel: "IN_APP"
        }
      ]
    })

    // ✅ Email notifications
    await notificationWithEmailService.sendResultNotification(fixture.homePlayerId, {
      homePlayer: homeName,
      awayPlayer: awayName,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: "rejected"
    })

    await notificationWithEmailService.sendResultNotification(fixture.awayPlayerId, {
      homePlayer: homeName,
      awayPlayer: awayName,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: "rejected"
    })

    // Notify the submitter if different
    if (result.submittedBy !== fixture.homePlayerId && result.submittedBy !== fixture.awayPlayerId) {
      await notificationWithEmailService.sendResultNotification(result.submittedBy, {
        homePlayer: homeName,
        awayPlayer: awayName,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        status: "rejected"
      })
    }

    // ✅ Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REJECT_RESULT",
        targetType: "RESULT",
        targetId: resultId,
        details: {
          fixtureId: result.fixtureId,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          homePlayerId: fixture.homePlayerId,
          awayPlayerId: fixture.awayPlayerId,
          seasonId: fixture.seasonId,
          submittedBy: result.submittedBy,
          reason: "League result rejected"
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "League result rejected successfully!"
    })

  } catch (error) {
    console.error("Error rejecting result:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject result" },
      { status: 500 }
    )
  }
}