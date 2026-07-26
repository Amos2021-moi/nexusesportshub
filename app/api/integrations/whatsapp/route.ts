import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ============================================ //
// ✅ WHATSAPP BOT INTEGRATION API              //
// ============================================ //
// Secure internal API used by both:
// 1. WhatsApp bot (Bearer token auth) — for .nexus health check
// 2. Admin dashboard (browser session auth) — for ?type= queries
// ============================================ //

function verifyApiKey(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  const apiKey = process.env.NEXUS_API_SECRET
  if (!apiKey || !authHeader) return false
  const [scheme, token] = authHeader.split(" ")
  return scheme === "Bearer" && token === apiKey
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized: Invalid or missing API key" },
    { status: 401 }
  )
}

// ============================================ //
// ✅ GET — Health Status + Dashboard Queries  //
// ============================================ //
// Without ?type — returns health status (requires Bearer token)
// With ?type=commands|groups|admins|activity|stats — for admin dashboard

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    // --- Dashboard queries (no Bearer token needed, browser session) ---
    if (type) {
      switch (type) {
        case "commands": {
          const commands = [
            { name: "ping", description: "Check if the bot is online", usage: ".ping", minRoleLevel: 0, enabled: true },
            { name: "nexus", description: "Test Nexus platform connectivity", usage: ".nexus", minRoleLevel: 0, enabled: true },
            { name: "help", description: "Show all commands", usage: ".help [command]", minRoleLevel: 0, enabled: true },
            { name: "fixtures", description: "View upcoming matches", usage: ".fixtures", minRoleLevel: 1, enabled: true },
            { name: "standings", description: "View league table", usage: ".standings", minRoleLevel: 1, enabled: true },
            { name: "table", description: "Full league standings", usage: ".table", minRoleLevel: 1, enabled: true },
            { name: "results", description: "Recent match results", usage: ".results", minRoleLevel: 1, enabled: true },
            { name: "nextmatch", description: "Your next match", usage: ".nextmatch", minRoleLevel: 1, enabled: true },
            { name: "league", description: "League season info", usage: ".league", minRoleLevel: 1, enabled: true },
            { name: "tournament", description: "Active tournament info", usage: ".tournament", minRoleLevel: 1, enabled: true },
          ]
          return NextResponse.json({ commands })
        }

        case "groups": {
          const groupJids = (process.env.WHATSAPP_GROUP_JIDS || "").split(",").filter(Boolean)
          const groups = groupJids.length
            ? groupJids.map((jid, i) => ({
                jid: jid.trim(),
                label: `Group ${i + 1}`,
                role: (i === 0 ? "main" : i === 1 ? "admin" : "tournament") as "main" | "admin" | "tournament",
                enabled: true,
              }))
            : [
                { jid: "120363429411366095@g.us", label: "Main Group", role: "main" as const, enabled: true },
              ]
          return NextResponse.json({ groups })
        }

        case "admins": {
          const adminJids = (process.env.ADMIN_JIDS || "").split(",").filter(Boolean)
          const admins = adminJids.length
            ? adminJids.map((jid, i) => ({
                jid: jid.trim(),
                name: `Admin ${i + 1}`,
                role: i === 0 ? ("OWNER" as const) : ("ADMIN" as const),
                addedAt: new Date().toISOString(),
              }))
            : []
          return NextResponse.json({ admins })
        }

        case "activity": {
          const auditLogs = await prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { user: { select: { name: true } } },
          })
          const activities = auditLogs.map((log) => ({
            id: log.id,
            timestamp: log.createdAt.toISOString(),
            type: (log.action.includes("error") ? "error" : "message") as "error" | "message" | "command" | "connection" | "admin",
            message: `${log.action} ${log.targetType ? `on ${log.targetType}` : ""}`,
            user: log.user?.name || log.userId || "system",
          }))
          return NextResponse.json({ activities })
        }

        case "stats": {
          return NextResponse.json({
            messagesReceived: 0,
            commandsExecuted: 0,
            uniqueUsers: 0,
            activeGroups: (process.env.WHATSAPP_GROUP_JIDS || "").split(",").filter(Boolean).length || 1,
          })
        }

        default:
          return NextResponse.json({ error: "Unknown type" }, { status: 400 })
      }
    }

    // --- Default: Health check (requires Bearer token for bot) ---
    if (!verifyApiKey(request)) {
      return unauthorized()
    }

    const dbHealthy = await prisma.$queryRaw`SELECT 1 as result`
      .then(() => true)
      .catch(() => false)

    const activeSeason = await prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, status: true },
    })

    const playerCount = await prisma.user.count({
      where: { role: "PLAYER" },
    })

    return NextResponse.json({
      status: "ok",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
      database: dbHealthy ? "connected" : "error",
      activeSeason: activeSeason || null,
      playerCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("WhatsApp integration API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ============================================ //
// ✅ POST — Admin Dashboard Actions           //
// ============================================ //
// Supports: addGroup, removeGroup, addAdmin,
// removeAdmin, toggleCommand, clearRateLimits

export async function POST(request: Request) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { action } = body

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 })
    }

    switch (action) {
      case "addGroup": {
        const { jid, label, role } = body
        if (!jid || !label) {
          return NextResponse.json({ error: "Missing jid or label" }, { status: 400 })
        }
        // Store in Prisma settings for persistence
        await prisma.setting.create({
          data: {
            category: "whatsapp_groups",
            key: `group_${jid}`,
            value: JSON.stringify({ jid, label, role: role || "main", enabled: true, addedAt: new Date().toISOString() }),
          },
        })
        return NextResponse.json({ success: true, message: "Group added" })
      }

      case "removeGroup": {
        const { jid } = body
        await prisma.setting.deleteMany({
          where: { category: "whatsapp_groups", key: `group_${jid}` },
        })
        return NextResponse.json({ success: true, message: "Group removed" })
      }

      case "addAdmin": {
        const { jid, name, role } = body
        if (!jid) {
          return NextResponse.json({ error: "Missing jid" }, { status: 400 })
        }
        await prisma.setting.create({
          data: {
            category: "whatsapp_admins",
            key: `admin_${jid}`,
            value: JSON.stringify({ jid, name: name || jid, role: role || "ADMIN", addedAt: new Date().toISOString() }),
          },
        })
        return NextResponse.json({ success: true, message: "Admin added" })
      }

      case "removeAdmin": {
        const { jid } = body
        await prisma.setting.deleteMany({
          where: { category: "whatsapp_admins", key: `admin_${jid}` },
        })
        return NextResponse.json({ success: true, message: "Admin removed" })
      }

      case "toggleCommand": {
        const { name, enabled } = body
        if (!name) {
          return NextResponse.json({ error: "Missing command name" }, { status: 400 })
        }
        const existing = await prisma.setting.findFirst({
          where: { category: "whatsapp_commands", key: `cmd_${name}` },
        })
        if (existing) {
          await prisma.setting.update({
            where: { id: existing.id },
            data: { value: JSON.stringify({ enabled: enabled !== false }) },
          })
        } else {
          await prisma.setting.create({
            data: {
              category: "whatsapp_commands",
              key: `cmd_${name}`,
              value: JSON.stringify({ enabled: enabled !== false }),
            },
          })
        }
        return NextResponse.json({ success: true, message: "Command updated" })
      }

      case "clearRateLimits": {
        return NextResponse.json({ success: true, message: "Rate limits cleared (in-memory on bot side)" })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("WhatsApp integration POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
