import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const award = await prisma.award.findUnique({
      where: { id },
      include: {
        winner: {
          include: { profile: true }
        },
        season: true
      }
    })

    if (!award) {
      return NextResponse.json({ error: "Award not found" }, { status: 404 })
    }

    return NextResponse.json(award)
  } catch (error) {
    console.error("Error fetching award:", error)
    return NextResponse.json(
      { error: "Failed to fetch award" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, category, icon, winnerId, description } = body

    const award = await prisma.award.update({
      where: { id },
      data: {
        name,
        category: category || "CUSTOM",
        icon: icon || "Award",
        winnerId,
        description: description || ""
      }
    })

    return NextResponse.json(award)
  } catch (error) {
    console.error("Error updating award:", error)
    return NextResponse.json(
      { error: "Failed to update award" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.award.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting award:", error)
    return NextResponse.json(
      { error: "Failed to delete award" },
      { status: 500 }
    )
  }
}