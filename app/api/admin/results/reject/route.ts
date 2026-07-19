import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { rejectMatch } from "@/lib/services/result.service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { resultId } = await request.json()

    const result = await rejectMatch({
      resultId,
      adminId: session.user.id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error rejecting result:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reject" },
      { status: 500 }
    )
  }
}