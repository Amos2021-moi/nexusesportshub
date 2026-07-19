import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Simple in-memory analytics (for demo)
// In production, use a database or service like Plausible, Umami, or Google Analytics
const analyticsData: {
  pageViews: { page: string; count: number; lastViewed: string }[]
  userSessions: { userId: string; lastActive: string; pageCount: number }[]
} = {
  pageViews: [],
  userSessions: []
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { page, timestamp, userAgent } = await request.json()
    
    // Track page view
    const existingPage = analyticsData.pageViews.find(p => p.page === page)
    if (existingPage) {
      existingPage.count++
      existingPage.lastViewed = timestamp
    } else {
      analyticsData.pageViews.push({ page, count: 1, lastViewed: timestamp })
    }
    
    // Track user session
    if (session?.user?.id) {
      const existingUser = analyticsData.userSessions.find(u => u.userId === session.user.id)
      if (existingUser) {
        existingUser.lastActive = timestamp
        existingUser.pageCount++
      } else {
        analyticsData.userSessions.push({ 
          userId: session.user.id, 
          lastActive: timestamp, 
          pageCount: 1 
        })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin can view analytics
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    return NextResponse.json({
      pageViews: analyticsData.pageViews,
      activeUsers: analyticsData.userSessions.length,
      totalPageViews: analyticsData.pageViews.reduce((sum, p) => sum + p.count, 0),
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}