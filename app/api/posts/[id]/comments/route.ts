import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId: session.user.id,
        content: content.trim()
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: {
        user: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json([])
  }
}