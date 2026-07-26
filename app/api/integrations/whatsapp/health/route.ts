import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// ============================================ //
// ✅ WHATSAPP BOT HEALTH PROXY                //
// ============================================ //
// Proxies health check requests from the Nexus //
// admin dashboard to the running WhatsApp bot. //
// Supports THREE auth methods:
//   1. Bearer token (bot-to-platform calls)
//   2. Session cookie (admin dashboard browser)
//   3. Development mode (no auth required)
// ============================================ //

async function verifyAuth(request: Request): Promise<{ ok: boolean; error?: string }> {
  const authHeader = request.headers.get("authorization")
  const apiKey = process.env.NEXUS_API_SECRET

  // Method 1: Bearer token auth (for bot-to-platform calls)
  if (authHeader && apiKey) {
    const [scheme, token] = authHeader.split(" ")
    if (scheme === "Bearer" && token === apiKey) {
      return { ok: true }
    }
  }

  // Method 2: Session cookie auth (for admin dashboard browser calls)
  try {
    const session = await getServerSession(authOptions)
    if (session?.user && (session.user.role === "ADMIN" || session.user.role === "OWNER" || session.user.role === "SUPER_ADMIN")) {
      return { ok: true }
    }
  } catch {
    // Session check failed, continue to next method
  }

  // Method 3: Allow in development mode without auth
  if (process.env.NODE_ENV === "development") {
    return { ok: true }
  }

  return { ok: false, error: "Unauthorized: Admin access or valid API key required" }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      )
    }

    // Read the bot health URL from environment
    const botHealthUrl = process.env.BOT_HEALTH_URL

    if (!botHealthUrl) {
      return NextResponse.json(
        {
          status: "error",
          error: "BOT_HEALTH_URL not configured",
          message: "Set BOT_HEALTH_URL env var to the bot's health endpoint",
          hint: "For local dev: BOT_HEALTH_URL=http://localhost:3001/health",
        },
        { status: 503 }
      )
    }

    // Make request to the bot's health endpoint with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(botHealthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NexusPlatform/1.0",
        },
        signal: controller.signal,
        next: { revalidate: 0 },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          {
            status: "error",
            error: `Bot returned HTTP ${response.status}`,
            botStatus: "offline",
          },
          { status: 503 }
        )
      }

      const botHealth = await response.json()

      return NextResponse.json({
        status: "ok",
        bot: botHealth,
        proxyTimestamp: new Date().toISOString(),
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)

      const isTimeout = fetchError instanceof DOMException && fetchError.name === "AbortError"

      return NextResponse.json(
        {
          status: "error",
          error: isTimeout
            ? "Bot health check timed out after 8s"
            : "Bot is unreachable",
          botStatus: "offline",
          details: isTimeout ? null : (fetchError instanceof Error ? fetchError.message : null),
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("WhatsApp bot health proxy error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
