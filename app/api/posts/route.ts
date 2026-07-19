import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    const posts = await prisma.post.findMany({
      include: {
        user: {
          include: { profile: true }
        },
        comments: {
          include: {
            user: {
              include: { profile: true }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 3
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    const { content, image, type } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        content: content.trim(),
        image: image || null,
        type: type || "GENERAL"
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}