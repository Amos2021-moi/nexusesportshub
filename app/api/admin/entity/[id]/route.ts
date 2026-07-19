import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { entityService } from "@/lib/services/entity.service"

export async function GET(
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
    
    // ✅ Detect entity type from ID pattern
    const entityData = await entityService.getEntityById(id)

    if (!entityData) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    return NextResponse.json(entityData)
  } catch (error) {
    console.error("Error fetching entity:", error)
    return NextResponse.json(
      { error: "Failed to fetch entity" },
      { status: 500 }
    )
  }
}