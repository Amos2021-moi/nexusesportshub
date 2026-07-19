import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  try {
    const { fixtureId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        homePlayer: { include: { profile: true } },
        awayPlayer: { include: { profile: true } },
        season: true
      }
    })

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    const homeName = fixture.homePlayer?.profile?.username || fixture.homePlayer?.name || "Home Player"
    const awayName = fixture.awayPlayer?.profile?.username || fixture.awayPlayer?.name || "Away Player"

    // Generate ICS file
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Nexus Esports//Match//EN
BEGIN:VEVENT
UID:${fixture.id}@nexus-esports
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(fixture.scheduledDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(new Date(fixture.scheduledDate).getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:⚽ Nexus Esports: ${homeName} vs ${awayName}
DESCRIPTION:Match between ${homeName} and ${awayName} in Nexus Esports League.\\nSeason: ${fixture.season?.name || "Current Season"}
LOCATION:Nexus Esports League
URL:${process.env.NEXTAUTH_URL}/dashboard/fixtures
END:VEVENT
END:VCALENDAR`

    return NextResponse.json({ ics })
  } catch (error) {
    console.error("Error generating calendar:", error)
    return NextResponse.json(
      { error: "Failed to generate calendar" },
      { status: 500 }
    )
  }
}