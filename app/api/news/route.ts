import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get("count") === "true"

    if (countOnly) {
      // ✅ Return only the count for the homepage notification
      const count = await prisma.news.count({
        where: { published: true }
      })
      return NextResponse.json({ count })
    }

    // Return full news list
    const news = await prisma.news.findMany({
      where: { published: true },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            profile: {
              select: { username: true }
            }
          }
        }
      },
      orderBy: { publishedAt: 'desc' }
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("Error fetching news:", error)
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, image, published } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        image: image || null,
        published: published || false,
        publishedAt: published ? new Date() : null,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                username: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error("Error creating news:", error)
    return NextResponse.json(
      { error: "Failed to create news" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, content, image, published } = body

    if (!id) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      )
    }

    const news = await prisma.news.update({
      where: { id },
      data: {
        title,
        content,
        image: image || null,
        published,
        publishedAt: published ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                username: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("Error updating news:", error)
    return NextResponse.json(
      { error: "Failed to update news" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      )
    }

    await prisma.news.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting news:", error)
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 }
    )
  }
}