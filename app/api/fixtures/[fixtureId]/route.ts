import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ✅ Helper to check if fixture modifications are allowed
async function checkFixtureLock(seasonId: string) {
  // Check if fixture lock is enabled
  const lockSetting = await prisma.setting.findFirst({
    where: {
      category: "league",
      key: "fixtureLock"
    }
  })

  if (lockSetting) {
    const isLocked = JSON.parse(lockSetting.value)
    if (isLocked) {
      throw new Error("Fixtures are locked. No modifications allowed.")
    }
  }

  // Check if season is frozen
  const freezeSetting = await prisma.setting.findFirst({
    where: {
      category: "league",
      key: "seasonFreeze"
    }
  })

  if (freezeSetting) {
    const isFrozen = JSON.parse(freezeSetting.value)
    if (isFrozen) {
      throw new Error("Season is frozen. No changes can be made.")
    }
  }
}

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
        homePlayer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true
          }
        },
        awayPlayer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true
          }
        },
        season: true,
        result: true
      }
    })

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    return NextResponse.json(fixture)
  } catch (error) {
    console.error("Error fetching fixture:", error)
    return NextResponse.json(
      { error: "Failed to fetch fixture" },
      { status: 500 }
    )
  }
}

// ✅ PUT: Update fixture with lock/freeze checks
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  try {
    const { fixtureId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { season: true }
    })

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    // ✅ Check if fixture modifications are allowed
    await checkFixtureLock(fixture.seasonId)

    const body = await request.json()
    const { homePlayerId, awayPlayerId, scheduledDate, status } = body

    const updatedFixture = await prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        ...(homePlayerId !== undefined && { homePlayerId }),
        ...(awayPlayerId !== undefined && { awayPlayerId }),
        ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
        ...(status !== undefined && { status })
      }
    })

    return NextResponse.json(updatedFixture)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update fixture"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ✅ DELETE: Delete fixture with lock/freeze checks
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  try {
    const { fixtureId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        season: true,
        result: true
      }
    })

    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }

    await checkFixtureLock(fixture.seasonId)

    if (fixture.result) {
      await prisma.result.delete({
        where: { id: fixture.result.id }
      })
    }

    await prisma.fixture.delete({
      where: { id: fixtureId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete fixture"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}