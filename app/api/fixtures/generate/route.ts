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

    const { seasonId } = await request.json()

    const season = await prisma.season.findUnique({
      where: { id: seasonId }
    })

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 })
    }

    // Prevent fixture generation if season is locked
    const lockedStatuses = ["FIXTURE_LOCK", "LIVE", "ENDED", "ARCHIVED"]
    if (lockedStatuses.includes(season.status)) {
      return NextResponse.json({ 
        error: `Cannot generate fixtures when season status is ${season.status}` 
      }, { status: 403 })
    }

    // ✅ Get league settings for this season
    const leagueSettings = await prisma.leagueSettings.findUnique({
      where: { seasonId },
    })

    // ✅ Get players based on payment setting
    let players: string[] = []
    let playerSource = ""

    if (leagueSettings?.paymentRequired) {
      // ✅ Only include paid players
      const paidEntries = await prisma.playerSeasonEntry.findMany({
        where: {
          seasonId,
          hasPaid: true,
        },
        select: { userId: true },
      })
      players = paidEntries.map(e => e.userId)
      playerSource = "paid"
    } else {
      // ✅ Include all players in the season
      const allEntries = await prisma.leagueEntry.findMany({
        where: { seasonId },
        select: { playerId: true },
      })
      players = allEntries.map(e => e.playerId)
      playerSource = "all"
    }
    
    if (players.length < 2) {
      const message = leagueSettings?.paymentRequired 
        ? `Need at least 2 PAID players to generate fixtures. Currently: ${players.length} paid players. 
           ${players.length === 0 ? 'No players have paid yet. Wait for players to pay or turn off payment requirement in League Settings.' : ''}`
        : `Need at least 2 players in the season to generate fixtures. Currently: ${players.length} players.`
      
      return NextResponse.json({ 
        error: message 
      }, { status: 400 })
    }

    // Delete existing fixtures
    const existingFixtures = await prisma.fixture.findMany({
      where: { seasonId },
      select: { id: true }
    })
    
    const fixtureIds = existingFixtures.map(f => f.id)
    
    if (fixtureIds.length > 0) {
      await prisma.result.deleteMany({
        where: { fixtureId: { in: fixtureIds } }
      })
    }
    
    await prisma.fixture.deleteMany({ where: { seasonId } })

    // Generate fixtures
    const fixtures = []
    const today = new Date()
    
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        fixtures.push({ 
          seasonId, 
          homePlayerId: players[i], 
          awayPlayerId: players[j], 
          scheduledDate: new Date(today.getTime() + fixtures.length * 24 * 60 * 60 * 1000) 
        })
        fixtures.push({ 
          seasonId, 
          homePlayerId: players[j], 
          awayPlayerId: players[i], 
          scheduledDate: new Date(today.getTime() + fixtures.length * 24 * 60 * 60 * 1000) 
        })
      }
    }

    const created = await prisma.fixture.createMany({ 
      data: fixtures 
    })

    // ✅ Get created fixtures with player details
    const createdFixtures = await prisma.fixture.findMany({
      where: { seasonId },
      include: {
        homePlayer: {
          select: { id: true, name: true, email: true, emailVerified: true, emailNotificationsEnabled: true }
        },
        awayPlayer: {
          select: { id: true, name: true, email: true, emailVerified: true, emailNotificationsEnabled: true }
        }
      }
    })

    // ✅ SEND EMAIL NOTIFICATIONS using notificationWithEmailService
    const emailPromises = []
    const notifiedPlayers = new Set()

    for (const fixture of createdFixtures) {
      const homeName = fixture.homePlayer?.name || "Home Player"
      const awayName = fixture.awayPlayer?.name || "Away Player"
      const seasonName = season.name || "Current Season"

      // Send to home player
      if (fixture.homePlayer && fixture.homePlayer.email && 
          fixture.homePlayer.emailVerified && fixture.homePlayer.emailNotificationsEnabled &&
          !notifiedPlayers.has(fixture.homePlayer.id)) {
        
        emailPromises.push(
          notificationWithEmailService.sendFixtureNotification(fixture.homePlayer.id, {
            homePlayer: homeName,
            awayPlayer: awayName,
            date: fixture.scheduledDate.toISOString(),
            seasonName: seasonName
          })
        )
        notifiedPlayers.add(fixture.homePlayer.id)
      }

      // Send to away player
      if (fixture.awayPlayer && fixture.awayPlayer.email && 
          fixture.awayPlayer.emailVerified && fixture.awayPlayer.emailNotificationsEnabled &&
          !notifiedPlayers.has(fixture.awayPlayer.id)) {
        
        emailPromises.push(
          notificationWithEmailService.sendFixtureNotification(fixture.awayPlayer.id, {
            homePlayer: homeName,
            awayPlayer: awayName,
            date: fixture.scheduledDate.toISOString(),
            seasonName: seasonName
          })
        )
        notifiedPlayers.add(fixture.awayPlayer.id)
      }
    }

    // Send all emails in parallel
    if (emailPromises.length > 0) {
      await Promise.all(emailPromises)
      console.log(`📧 Sent ${emailPromises.length} fixture notification emails`)
    }

    // ✅ Generate calendar events for players who want sync
    await generateCalendarEvents(createdFixtures)

    return NextResponse.json({ 
      success: true, 
      count: created.count,
      playersUsed: players.length,
      playerSource: playerSource,
      emailsSent: emailPromises.length,
      playersNotified: notifiedPlayers.size,
      message: leagueSettings?.paymentRequired 
        ? `Generated ${created.count} fixtures for ${players.length} paid players`
        : `Generated ${created.count} fixtures for ${players.length} players (free league)`
    })
  } catch (error) {
    console.error("Error generating fixtures:", error)
    return NextResponse.json({ error: "Failed to generate fixtures" }, { status: 500 })
  }
}

// ✅ Generate calendar events for users who opted in
async function generateCalendarEvents(fixtures: any[]) {
  for (const fixture of fixtures) {
    // Check if home player wants calendar sync
    const homeSettings = await prisma.setting.findFirst({
      where: {
        userId: fixture.homePlayerId,
        category: "competition",
        key: "fixtureCalendarSync"
      }
    })
    
    const homeSync = homeSettings ? JSON.parse(homeSettings.value) : false
    
    // Check if away player wants calendar sync
    const awaySettings = await prisma.setting.findFirst({
      where: {
        userId: fixture.awayPlayerId,
        category: "competition",
        key: "fixtureCalendarSync"
      }
    })
    
    const awaySync = awaySettings ? JSON.parse(awaySettings.value) : false

    // If either player wants sync, generate .ics file
    if (homeSync || awaySync) {
      await generateICSFile(fixture)
    }
  }
}

// ✅ Generate ICS calendar file
async function generateICSFile(fixture: any) {
  // Get player names
  const homePlayer = await prisma.user.findUnique({
    where: { id: fixture.homePlayerId },
    include: { profile: true }
  })
  const awayPlayer = await prisma.user.findUnique({
    where: { id: fixture.awayPlayerId },
    include: { profile: true }
  })

  const homeName = homePlayer?.profile?.username || homePlayer?.name || "Home Player"
  const awayName = awayPlayer?.profile?.username || awayPlayer?.name || "Away Player"

  // Create ICS file content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nexus Esports//Match//EN
BEGIN:VEVENT
UID:${fixture.id}@nexus-esports
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(fixture.scheduledDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(new Date(fixture.scheduledDate).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Nexus Esports Match: ${homeName} vs ${awayName}
DESCRIPTION:Match between ${homeName} and ${awayName} in Nexus Esports League.
URL:${process.env.NEXTAUTH_URL}/dashboard/fixtures
END:VEVENT
END:VCALENDAR`

  console.log(`📅 Calendar event generated for match ${fixture.id}`)
}