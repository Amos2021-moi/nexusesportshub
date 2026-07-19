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

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      })
      await prisma.post.update({
        where: { id },
        data: { likes: { decrement: 1 } }
      })
      return NextResponse.json({ liked: false, likes: await getLikeCount(id) })
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId: id,
          userId: session.user.id
        }
      })
      await prisma.post.update({
        where: { id },
        data: { likes: { increment: 1 } }
      })
      return NextResponse.json({ liked: true, likes: await getLikeCount(id) })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to process like" }, { status: 500 })
  }
}

async function getLikeCount(postId: string): Promise<number> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { likes: true }
  })
  return post?.likes || 0
}