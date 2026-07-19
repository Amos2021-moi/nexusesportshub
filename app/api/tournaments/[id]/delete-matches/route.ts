import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
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

    // Delete all matches for this tournament
    const deleted = await prisma.tournamentMatch.deleteMany({
      where: { tournamentId: id }
    })

    // Reset tournament status
    await prisma.tournament.update({
      where: { id },
      data: { status: "PENDING" }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} matches`,
      count: deleted.count
    })
  } catch (error) {
    console.error("Error deleting matches:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete matches" },
      { status: 500 }
    )
  }
}