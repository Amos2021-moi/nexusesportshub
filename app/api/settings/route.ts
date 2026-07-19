import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSetting, setSetting, getSettingsByCategory, getDefaultSettings } from "@/lib/services/settings.service"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const key = searchParams.get("key")

    // If specific key requested
    if (category && key) {
      const value = await getSetting(session.user.id, category, key)
      return NextResponse.json({ [key]: value })
    }

    // If category requested
    if (category) {
      const settings = await getSettingsByCategory(session.user.id, category)
      const defaults = await getDefaultSettings(category)
      // Merge defaults with user settings (user settings override defaults)
      return NextResponse.json({ ...defaults, ...settings })
    }

    // If no category, return all settings (simplified)
    const allCategories = ["account", "notifications", "privacy", "appearance", "competition"]
    const result: Record<string, any> = {}
    
    for (const cat of allCategories) {
      const userSettings = await getSettingsByCategory(session.user.id, cat)
      const defaults = await getDefaultSettings(cat)
      result[cat] = { ...defaults, ...userSettings }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please login" }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 })
    }

    const { category, key, value } = body

    if (!category || !key) {
      return NextResponse.json({ error: "Category and key are required" }, { status: 400 })
    }

    // ✅ Pass userId (will be null for system settings)
    await setSetting(session.user.id, category, key, value)

    return NextResponse.json({ success: true, message: "Setting updated" })
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}