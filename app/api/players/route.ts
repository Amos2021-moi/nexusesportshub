import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma, clearQueryCache } from "@/lib/prisma"

// ============================================ //
// ✅ GET: Fetch players with pagination        //
// ============================================ //

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Please login" },
        { status: 401 }
      )
    }

    // Admin only endpoint
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // ✅ Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const verified = searchParams.get("verified")

    // ✅ Validate pagination
    const take = Math.min(Math.max(limit, 1), 50) // Max 50 per page
    const skip = (Math.max(page, 1) - 1) * take

    // ✅ Build where clause
    const where: any = { role: "PLAYER" }

    // ✅ Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { profile: { username: { contains: search, mode: "insensitive" } } },
      ]
    }

    // ✅ Verified filter - using verifiedBadge from Profile model
    if (verified === "true") {
      where.profile = { verifiedBadge: true }
    } else if (verified === "false") {
      where.profile = { verifiedBadge: false }
    }

    // ✅ Use Promise.all for parallel queries
    const [players, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              bio: true,
              verifiedBadge: true, // ✅ Fixed: matches schema
              trustScore: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          _count: {
  select: {
    homeFixtures: true,
    awayFixtures: true,
    homeTournamentMatches: true, // ✅ CORRECT
    awayTournamentMatches: true, // ✅ CORRECT
    winnerTournamentMatches: true, // ✅ CORRECT
  },
},
        },
        orderBy: {
          [sortBy === "username" ? "profile" : sortBy]: 
            sortBy === "username" ? { username: sortOrder } : sortOrder,
        },
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ])

    // ✅ Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / take)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // ✅ Response with pagination metadata
    return NextResponse.json({
      data: players,
      pagination: {
        page,
        limit: take,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      cachedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    )
  }
}

// ============================================ //
// ✅ POST: Create a new player (Admin only)    //
// ============================================ //

export async function POST(request: NextRequest) {
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
    const { name, email, username, password } = body

    // ✅ Validate required fields
    if (!name || !email || !username) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, username" },
        { status: 400 }
      )
    }

    // ✅ Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { profile: { username } }],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 409 }
      )
    }

    // ✅ Create user with profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          role: "PLAYER",
          emailVerified: false,
          isVerified: false,
          ...(password && {
            password: await import("bcryptjs").then((bcrypt) =>
              bcrypt.hashSync(password, 10)
            ),
          }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })

      // Create profile
      await tx.profile.create({
        data: {
          userId: newUser.id,
          username,
          trustScore: 0,
          verifiedBadge: false,
        },
      })

      return newUser
    })

    // ✅ Clear cache after new user created
    clearQueryCache()

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating player:", error)
    return NextResponse.json(
      { error: "Failed to create player" },
      { status: 500 }
    )
  }
}

// ============================================ //
// ✅ DELETE: Bulk delete players (Admin only)  //
// ============================================ //

export async function DELETE(request: NextRequest) {
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
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid player IDs" },
        { status: 400 }
      )
    }

    // ✅ Limit bulk delete
    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Cannot delete more than 100 players at once" },
        { status: 400 }
      )
    }

    // ✅ Delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete profiles first
      await tx.profile.deleteMany({
        where: { userId: { in: ids } },
      })

      // Delete users
      return await tx.user.deleteMany({
        where: {
          id: { in: ids },
          role: "PLAYER",
        },
      })
    })

    // ✅ Clear cache after deletion
    clearQueryCache()

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    })
  } catch (error) {
    console.error("Error deleting players:", error)
    return NextResponse.json(
      { error: "Failed to delete players" },
      { status: 500 }
    )
  }
}

// ============================================ //
// ✅ PUT: Bulk update players (Admin only)     //
// ============================================ //

export async function PUT(request: NextRequest) {
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
    const { ids, data } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid player IDs" },
        { status: 400 }
      )
    }

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Missing update data" },
        { status: 400 }
      )
    }

    // ✅ Update players
    const result = await prisma.user.updateMany({
      where: {
        id: { in: ids },
        role: "PLAYER",
      },
      data,
    })

    // ✅ Clear cache after update
    clearQueryCache()

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    })
  } catch (error) {
    console.error("Error updating players:", error)
    return NextResponse.json(
      { error: "Failed to update players" },
      { status: 500 }
    )
  }
}

// ============================================ //
// ✅ OPTIONS: CORS headers                     //
// ============================================ //

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}