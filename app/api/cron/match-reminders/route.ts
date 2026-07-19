import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/services/email.service"

export async function GET() {
  try {
    // Get matches scheduled for the next 24 hours
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    const matches = await prisma.fixture.findMany({
      where: {
        scheduledDate: {
          gte: now,
          lt: tomorrow
        },
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    let sentCount = 0
    
    for (const match of matches) {
      // Get reminder preferences for both players
      const homePreference = await prisma.setting.findFirst({
        where: {
          userId: match.homePlayerId,
          category: "competition",
          key: "matchReminderTime"
        }
      })
      
      const awayPreference = await prisma.setting.findFirst({
        where: {
          userId: match.awayPlayerId,
          category: "competition",
          key: "matchReminderTime"
        }
      })

      // Send reminders based on preferences
      const results = await emailService.sendMatchReminderWithPreference(match)
      sentCount += results.length
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} match reminders`,
      matchesChecked: matches.length
    })
  } catch (error) {
    console.error("Error sending match reminders:", error)
    return NextResponse.json(
      { error: "Failed to send match reminders" },
      { status: 500 }
    )
  }
}