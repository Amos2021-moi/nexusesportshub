import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateTrustScore, updateAllTrustScores } from "@/lib/services/trust.service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    if (userId) {
      // Update specific user
      const score = await updateTrustScore(userId)
      return NextResponse.json({
        success: true,
        userId,
        trustScore: score,
        message: `Trust score updated for user ${userId}`
      })
    } else {
      // Update all users
      await updateAllTrustScores()
      return NextResponse.json({
        success: true,
        message: "All trust scores updated successfully"
      })
    }
  } catch (error) {
    console.error("Error updating trust scores:", error)
    return NextResponse.json(
      { error: "Failed to update trust scores" },
      { status: 500 }
    )
  }
}