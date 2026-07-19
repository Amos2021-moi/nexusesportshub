import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { searchService } from "@/lib/services/search.service"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ Only admins can search
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "20")

    // ✅ Validate query
    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query,
        time: 0,
        message: "Please enter at least 2 characters",
      })
    }

    // ✅ Perform search
    const results = await searchService.search(query, limit)

    return NextResponse.json({
      success: true,
      ...results,
    })

  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { 
        error: "Failed to perform search",
        results: [],
        total: 0,
        query: "",
        time: 0,
      },
      { status: 500 }
    )
  }
}