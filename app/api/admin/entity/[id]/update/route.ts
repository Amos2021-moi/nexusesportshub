import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper to detect entity type from ID
function detectEntityType(id: string): string | null {
  // ✅ Check if it's a UUID (Prisma default IDs)
  const isUUID = /^[a-f0-9]{24}$/i.test(id)
  
  // ✅ Check by trying to find in each table
  // We'll try each table and see which one has the ID
  // This is more reliable than pattern matching
  
  return null // Will be determined by trying each table
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { data } = body

    console.log("📝 Update request:", { id, data })

    if (!data) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 })
    }

    // ✅ Try to find the entity type by checking each table
    let entityType: string | null = null
    let entityData: any = null

    // Check Season
    const season = await prisma.season.findUnique({ where: { id } })
    if (season) {
      entityType = "season"
      entityData = season
    }

    // Check Tournament
    if (!entityType) {
      const tournament = await prisma.tournament.findUnique({ where: { id } })
      if (tournament) {
        entityType = "tournament"
        entityData = tournament
      }
    }

    // Check User (Player)
    if (!entityType) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (user) {
        entityType = "player"
        entityData = user
      }
    }

    // Check Fixture
    if (!entityType) {
      const fixture = await prisma.fixture.findUnique({ where: { id } })
      if (fixture) {
        entityType = "fixture"
        entityData = fixture
      }
    }

    // Check Result
    if (!entityType) {
      const result = await prisma.result.findUnique({ where: { id } })
      if (result) {
        entityType = "result"
        entityData = result
      }
    }

    // Check News
    if (!entityType) {
      const news = await prisma.news.findUnique({ where: { id } })
      if (news) {
        entityType = "news"
        entityData = news
      }
    }

    // Check Award
    if (!entityType) {
      const award = await prisma.award.findUnique({ where: { id } })
      if (award) {
        entityType = "award"
        entityData = award
      }
    }

    // Check Squad
    if (!entityType) {
      const squad = await prisma.squad.findUnique({ where: { id } })
      if (squad) {
        entityType = "squad"
        entityData = squad
      }
    }

    // Check Hall of Fame
    if (!entityType) {
      const hof = await prisma.hallOfFame.findUnique({ where: { id } })
      if (hof) {
        entityType = "hallOfFame"
        entityData = hof
      }
    }

    // Check Payment Audit
    if (!entityType) {
      const payment = await prisma.paymentAudit.findUnique({ where: { id } })
      if (payment) {
        entityType = "payment"
        entityData = payment
      }
    }

    console.log("🔍 Detected entity type:", entityType, "for ID:", id)

    if (!entityType) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    // ✅ Update based on type
    let updated
    switch (entityType) {
      case "season":
        updated = await prisma.season.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            status: data.status,
            isActive: data.isActive,
          },
        })
        break

      case "tournament":
        updated = await prisma.tournament.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            type: data.type,
            status: data.status,
            maxPlayers: parseInt(data.maxPlayers) || 8,
          },
        })
        break

      case "player":
        updated = await prisma.user.update({
          where: { id },
          data: {
            name: data.name,
            isVerified: data.isVerified,
            profile: {
              update: {
                username: data.username,
                class: data.class,
                favoriteClub: data.favoriteClub,
                preferredFormation: data.preferredFormation,
                preferredPlaystyle: data.preferredPlaystyle,
                bio: data.bio,
                whatsappNumber: data.whatsappNumber,
              },
            },
          },
        })
        break

      case "fixture":
        updated = await prisma.fixture.update({
          where: { id },
          data: {
            status: data.status,
            homeScore: data.homeScore ? parseInt(data.homeScore) : null,
            awayScore: data.awayScore ? parseInt(data.awayScore) : null,
          },
        })
        break

      case "result":
        updated = await prisma.result.update({
          where: { id },
          data: {
            homeScore: parseInt(data.homeScore),
            awayScore: parseInt(data.awayScore),
            approved: data.approved,
          },
        })
        break

      case "news":
        updated = await prisma.news.update({
          where: { id },
          data: {
            title: data.title,
            content: data.content,
            published: data.published,
            publishedAt: data.published ? new Date() : null,
          },
        })
        break

      case "award":
        updated = await prisma.award.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            category: data.category,
            icon: data.icon,
          },
        })
        break

      case "hallOfFame":
        updated = await prisma.hallOfFame.update({
          where: { id },
          data: {
            reason: data.reason,
            category: data.category,
          },
        })
        break

      case "squad":
        updated = await prisma.squad.update({
          where: { id },
          data: {
            type: data.type,
            formation: data.formation,
            teamStrength: parseInt(data.teamStrength) || 0,
            playstyle: data.playstyle,
            description: data.description,
            isActive: data.isActive,
            status: data.status,
          },
        })
        break

      case "payment":
        updated = await prisma.paymentAudit.update({
          where: { id },
          data: {
            notes: data.notes,
          },
        })
        break

      default:
        return NextResponse.json({ error: "Entity type not updatable" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Entity updated successfully",
      entity: updated,
    })

  } catch (error) {
    console.error("Error updating entity:", error)
    return NextResponse.json(
      { error: "Failed to update entity: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    )
  }
}