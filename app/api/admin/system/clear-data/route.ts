import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { clearAllData } from "@/lib/services/clear-data.service"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ✅ Use the correct function name
    const result = await clearAllData()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error clearing data:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear data" },
      { status: 500 }
    )
  }
}