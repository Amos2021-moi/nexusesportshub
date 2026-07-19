import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CompetitionStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // ✅ LOG EVERYTHING - This will show us exactly what Safaricom sends
    console.log("=".repeat(80))
    console.log("📱 M-Pesa Callback Received - FULL BODY:")
    console.log(JSON.stringify(body, null, 2))
    console.log("=".repeat(80))

    const stkCallback = body?.Body?.stkCallback

    if (!stkCallback) {
      console.error("❌ Invalid callback structure - no stkCallback found")
      console.error("Full body:", JSON.stringify(body, null, 2))
      return NextResponse.json({ error: "Invalid callback" }, { status: 400 })
    }

    console.log("✅ stkCallback found:", JSON.stringify(stkCallback, null, 2))

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback

    console.log("📊 Extracted values:")
    console.log("  MerchantRequestID:", MerchantRequestID)
    console.log("  CheckoutRequestID:", CheckoutRequestID)
    console.log("  ResultCode:", ResultCode)
    console.log("  ResultDesc:", ResultDesc)
    console.log("  CallbackMetadata:", CallbackMetadata ? "✅ Present" : "❌ Missing")

    // ✅ Find the season entry
    const seasonEntry = await prisma.seasonEntry.findFirst({
      where: {
        checkoutRequestId: CheckoutRequestID,
      },
      include: {
        user: true,
        season: true,
      },
    })

    if (!seasonEntry) {
      console.error(`❌ Season entry not found for CheckoutRequestID: ${CheckoutRequestID}`)
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    console.log("✅ SeasonEntry found:", seasonEntry.id)

    // ✅ Payment successful
    if (ResultCode === 0) {
      let amount = 0
      let mpesaReceipt = ""
      let transactionDate = ""

      // ✅ Check if CallbackMetadata exists
      if (CallbackMetadata && CallbackMetadata.Item) {
        console.log("📦 CallbackMetadata Items:", CallbackMetadata.Item.length)
        
        for (const item of CallbackMetadata.Item) {
          console.log(`📦 Item: ${item.Name} = ${JSON.stringify(item.Value)}`)
          
          if (item.Name === "Amount") {
            amount = item.Value
            console.log(`💰 Amount: ${amount}`)
          }
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceipt = item.Value
            console.log(`✅✅✅ RECEIPT FOUND: ${mpesaReceipt}`)
          }
          if (item.Name === "TransactionDate") {
            transactionDate = item.Value
            console.log(`📅 Transaction Date: ${transactionDate}`)
          }
        }
      } else {
        console.error("❌ CallbackMetadata is missing or has no Items!")
        console.log("CallbackMetadata value:", JSON.stringify(CallbackMetadata, null, 2))
      }

      // ✅ If receipt found, log it clearly
      if (mpesaReceipt) {
        console.log(`✅✅✅ REAL M-PESA RECEIPT: ${mpesaReceipt}`)
      } else {
        console.error("❌❌❌ NO RECEIPT FOUND IN CALLBACK!")
        
        // Try to extract from ResultDesc
        if (ResultDesc) {
          console.log("ResultDesc:", ResultDesc)
          // Try to extract receipt from ResultDesc
          const receiptMatch = ResultDesc.match(/Receipt\s*[Nn]o\.?\s*([A-Z0-9]+)/)
          if (receiptMatch) {
            mpesaReceipt = receiptMatch[1]
            console.log(`📦 Extracted receipt from ResultDesc: ${mpesaReceipt}`)
          }
        }
        
        // If still no receipt, use CheckoutRequestID
        if (!mpesaReceipt && CheckoutRequestID) {
          mpesaReceipt = CheckoutRequestID.slice(-10).toUpperCase()
          console.log(`⚠️ Using CheckoutRequestID as fallback: ${mpesaReceipt}`)
        }
      }

      // ✅ Update database with receipt
      await prisma.$transaction(async (tx) => {
        console.log(`💾 Updating database with receipt: ${mpesaReceipt}`)
        
        await tx.seasonEntry.update({
          where: { id: seasonEntry.id },
          data: {
            status: CompetitionStatus.ACTIVE,
            paidAt: new Date(),
            transactionId: CheckoutRequestID,
            mpesaReceipt: mpesaReceipt,
            resultCode: ResultCode,
            resultDesc: ResultDesc || "Payment confirmed",
            merchantRequestId: MerchantRequestID,
          },
        })

        // Update PlayerSeasonEntry
        const playerSeasonEntry = await tx.playerSeasonEntry.findUnique({
          where: {
            userId_seasonId: {
              userId: seasonEntry.userId,
              seasonId: seasonEntry.seasonId,
            },
          },
        })

        if (playerSeasonEntry) {
          await tx.playerSeasonEntry.update({
            where: { id: playerSeasonEntry.id },
            data: {
              hasPaid: true,
              paidAt: new Date(),
              paymentReceipt: mpesaReceipt,
              paymentMethod: "MPESA",
            },
          })
        }

        // Update Prize Pool
        const prizePool = await tx.prizePool.findUnique({
          where: { seasonId: seasonEntry.seasonId },
        })

        if (prizePool) {
          const paidPlayers = await tx.leagueEntry.count({
            where: {
              seasonId: seasonEntry.seasonId,
              seasonEntry: {
                status: CompetitionStatus.ACTIVE,
              },
            },
          })

          const entryFee = prizePool.entryFee || 50
          const totalCollected = paidPlayers * entryFee

          await tx.prizePool.update({
            where: { id: prizePool.id },
            data: {
              totalCollected,
              registeredPlayers: paidPlayers,
              championReward: totalCollected * 0.5,
              runnerReward: totalCollected * 0.25,
              topScorerReward: totalCollected * 0.1,
              platformReserve: totalCollected * 0.15,
            },
          })
        }

        await tx.paymentAudit.create({
          data: {
            userId: seasonEntry.userId,
            seasonEntryId: seasonEntry.id,
            action: "PAYMENT_SUCCESS",
            notes: `Payment confirmed. Receipt: ${mpesaReceipt}`,
          },
        })

        await tx.notification.create({
          data: {
            userId: seasonEntry.userId,
            title: "✅ Payment Successful!",
            message: `Your payment has been confirmed. Receipt: ${mpesaReceipt}`,
            type: "AWARD_EARNED",
            link: "/dashboard",
          },
        })
      })

      console.log(`✅✅✅ FINAL RECEIPT STORED: ${mpesaReceipt}`)

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
        receipt: mpesaReceipt,
      })
    } else {
      // ❌ Payment failed
      console.error(`❌ Payment failed: ${ResultDesc} (Code: ${ResultCode})`)

      await prisma.$transaction(async (tx) => {
        await tx.seasonEntry.update({
          where: { id: seasonEntry.id },
          data: {
            status: CompetitionStatus.NOT_ENROLLED,
            resultCode: ResultCode,
            resultDesc: ResultDesc || "Payment failed",
          },
        })

        await tx.paymentAudit.create({
          data: {
            userId: seasonEntry.userId,
            seasonEntryId: seasonEntry.id,
            action: "PAYMENT_FAILED",
            notes: `Payment failed: ${ResultDesc} (Code: ${ResultCode})`,
          },
        })

        await tx.notification.create({
          data: {
            userId: seasonEntry.userId,
            title: "❌ Payment Failed",
            message: `Your payment failed: ${ResultDesc}. Please try again.`,
            type: "SYSTEM",
            link: `/dashboard`,
          },
        })
      })

      return NextResponse.json({
        success: false,
        error: ResultDesc,
      })
    }
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process callback" },
      { status: 500 }
    )
  }
}