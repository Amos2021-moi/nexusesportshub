import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { safaricomService } from "@/lib/services/safaricom.service"

export async function POST(request: Request) {
  try {
    // ✅ 1. Check if request has body
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid content-type:", contentType)
      return NextResponse.json({ 
        error: "Content-Type must be application/json" 
      }, { status: 400 })
    }

    // ✅ 2. Read body safely
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError)
      return NextResponse.json({ 
        error: "Invalid JSON body. Please check your request." 
      }, { status: 400 })
    }

    // ✅ 3. Validate body
    if (!body || typeof body !== 'object') {
      console.error("Empty or invalid body:", body)
      return NextResponse.json({ 
        error: "Request body is required" 
      }, { status: 400 })
    }

    const { seasonId, phoneNumber } = body

    // ✅ 4. Validate required fields
    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    // ✅ 5. Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Payment request received:", { 
      seasonId, 
      phoneNumber, 
      userId: session.user.id 
    })

    const cleanPhone = phoneNumber.replace(/\D/g, "")
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use 0712345678" },
        { status: 400 }
      )
    }

    const season = await prisma.season.findUnique({
      where: { id: seasonId, isActive: true },
      include: {
        leagueSettings: true,
        prizePool: true,
      },
    })

    if (!season) {
      return NextResponse.json({ error: "Season not found or not active" }, { status: 404 })
    }

    const leagueEntry = await prisma.leagueEntry.findUnique({
      where: {
        seasonId_playerId: {
          seasonId,
          playerId: session.user.id,
        },
      },
    })

    if (!leagueEntry) {
      return NextResponse.json({ error: "You are not registered for this season" }, { status: 403 })
    }

    // ✅ Check if player already has a PlayerSeasonEntry
    let playerEntry = await prisma.playerSeasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId: session.user.id,
          seasonId,
        },
      },
    })

    if (playerEntry?.hasPaid) {
      return NextResponse.json({ 
        error: "You have already paid for this season" 
      }, { status: 400 })
    }

    // ✅ Check if there's an existing SeasonEntry (from old system)
    let seasonEntry = await prisma.seasonEntry.findUnique({
      where: {
        userId_seasonId: {
          userId: session.user.id,
          seasonId,
        },
      },
    })

    const entryFee = season.leagueSettings?.entryFee || season.prizePool?.entryFee || 50

    // ✅ Create or update PlayerSeasonEntry
    if (!playerEntry) {
      playerEntry = await prisma.playerSeasonEntry.create({
        data: {
          userId: session.user.id,
          seasonId,
          hasPaid: false,
          paymentPhone: cleanPhone,
        },
      })
    } else {
      playerEntry = await prisma.playerSeasonEntry.update({
        where: { id: playerEntry.id },
        data: {
          paymentPhone: cleanPhone,
        },
      })
    }

    // ✅ Create or update SeasonEntry for payment tracking
    if (!seasonEntry) {
      seasonEntry = await prisma.seasonEntry.create({
        data: {
          userId: session.user.id,
          seasonId,
          status: "PAYMENT_PENDING",
          entryFee,
          phoneNumber: cleanPhone,
        },
      })
    } else {
      seasonEntry = await prisma.seasonEntry.update({
        where: { id: seasonEntry.id },
        data: {
          status: "PAYMENT_PENDING",
          phoneNumber: cleanPhone,
          entryFee,
        },
      })
    }

    // ✅ Send REAL STK Push to Safaricom
    try {
      const accountReference = `SEASON-${seasonId.slice(0, 6)}-${session.user.id.slice(0, 4)}`
      
      const stkResponse = await safaricomService.sendSTKPush(
        cleanPhone,
        entryFee,
        accountReference,
        `Nexus Esports Entry`
      )

      // ✅ Store checkout request ID in SeasonEntry
      await prisma.seasonEntry.update({
        where: { id: seasonEntry.id },
        data: {
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
        },
      })

      // ✅ Log payment initiation
      await prisma.paymentAudit.create({
        data: {
          userId: session.user.id,
          seasonEntryId: seasonEntry.id,
          action: "STK_PUSH_SENT",
          notes: `STK Push sent to ${cleanPhone} for KES ${entryFee}. CheckoutID: ${stkResponse.CheckoutRequestID}`,
        },
      })

      console.log("✅ STK Push sent successfully:", stkResponse.CheckoutRequestID)

      // ✅ Return with no-cache headers
      return NextResponse.json({
        success: true,
        message: "STK Push sent to your phone!",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: "PAYMENT_PENDING",
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })

    } catch (error: any) {
      console.error("STK Push error:", error)
      
      await prisma.seasonEntry.update({
        where: { id: seasonEntry.id },
        data: {
          status: "NOT_ENROLLED",
          resultDesc: error.message || "STK Push failed",
        },
      })

      return NextResponse.json(
        { error: error.message || "Failed to send STK Push. Please try again." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process payment" },
      { status: 500 }
    )
  }
}