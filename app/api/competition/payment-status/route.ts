import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { safaricomService } from "@/lib/services/safaricom.service"
import { notificationWithEmailService } from "@/lib/services/notificationWithEmail.service"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const checkoutRequestId = searchParams.get("checkoutRequestId")
    const attempts = parseInt(searchParams.get("attempts") || "0")

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "Checkout Request ID required" }, { status: 400 })
    }

    console.log(`📊 Poll attempt ${attempts} for: ${checkoutRequestId}`)

    // ✅ Check database first
    const seasonEntry = await prisma.seasonEntry.findFirst({
      where: {
        checkoutRequestId: checkoutRequestId,
        userId: session.user.id,
      },
    })

    if (!seasonEntry) {
      return NextResponse.json({ 
        status: "pending",
        message: "Payment not found" 
      })
    }

    // ✅ If already confirmed in database - SUCCESS
    if (seasonEntry.status === "ACTIVE") {
      if (seasonEntry.mpesaReceipt) {
        console.log(`✅ Returning receipt from database: ${seasonEntry.mpesaReceipt}`)
        return NextResponse.json({
          status: "success",
          message: "Payment confirmed",
          mpesaReceipt: seasonEntry.mpesaReceipt,
          paidAt: seasonEntry.paidAt,
        })
      }
    }

    // ✅ If already marked as cancelled
    if (seasonEntry.status === "NOT_ENROLLED" && seasonEntry.resultDesc?.includes("cancelled")) {
      return NextResponse.json({
        status: "cancelled",
        message: "You cancelled the payment on your phone.",
      })
    }

    // ✅ Query Safaricom for real-time status
    if (attempts === 0 || attempts % 3 === 0) {
      try {
        const status = await safaricomService.querySTKStatus(checkoutRequestId)

        console.log(`📊 Safaricom Response (attempt ${attempts}):`, JSON.stringify(status, null, 2))

        const rawResultCode = status?.ResultCode
        const resultDesc = status?.ResultDesc || ""

        let resultCode: number | null = null
        if (rawResultCode !== undefined && rawResultCode !== null) {
          const parsed = parseInt(String(rawResultCode))
          if (!isNaN(parsed)) {
            resultCode = parsed
          }
        }

        console.log(`📊 ResultCode: ${resultCode}, ResultDesc: ${resultDesc}`)

        // ✅ SUCCESS - ResultCode 0
        if (resultCode === 0) {
          let mpesaReceipt = ""

          if (status.CallbackMetadata?.Item) {
            for (const item of status.CallbackMetadata.Item) {
              if (item.Name === "MpesaReceiptNumber") {
                mpesaReceipt = item.Value
                console.log(`✅ Receipt found: ${mpesaReceipt}`)
              }
            }
          }

          if (!mpesaReceipt) {
            mpesaReceipt = checkoutRequestId.slice(-10).toUpperCase()
            console.log(`⚠️ No receipt in metadata, using fallback: ${mpesaReceipt}`)
          }

          // Update database
          await prisma.$transaction(async (tx) => {
            await tx.seasonEntry.update({
              where: { id: seasonEntry.id },
              data: {
                status: "ACTIVE",
                paidAt: new Date(),
                mpesaReceipt: mpesaReceipt,
                resultCode: resultCode,
                resultDesc: resultDesc || "Payment confirmed",
              },
            })

            const playerSeasonEntry = await tx.playerSeasonEntry.findUnique({
              where: {
                userId_seasonId: {
                  userId: session.user.id,
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

            await tx.paymentAudit.create({
              data: {
                userId: session.user.id,
                seasonEntryId: seasonEntry.id,
                action: "PAYMENT_SUCCESS",
                notes: `Payment confirmed. Receipt: ${mpesaReceipt}`,
              },
            })

            await tx.notification.create({
              data: {
                userId: session.user.id,
                title: "✅ Payment Successful!",
                message: `Your payment has been confirmed. Receipt: ${mpesaReceipt}`,
                type: "AWARD_EARNED",
                link: "/dashboard",
              },
            })
          })

          // ✅ SEND EMAIL NOTIFICATION FOR PAYMENT SUCCESS
          await notificationWithEmailService.sendNotificationWithEmail({
            userId: session.user.id,
            type: "PAYMENT_CONFIRMED",
            title: "✅ Payment Confirmed!",
            message: `Your payment of KES ${seasonEntry.entryFee || 0} has been confirmed. Receipt: ${mpesaReceipt}`,
            priority: "HIGH",
            data: {
              amount: seasonEntry.entryFee || 0,
              receipt: mpesaReceipt,
              link: "/dashboard"
            },
            emailTemplate: "notification",
            emailSubject: "✅ Payment Confirmed - Nexus Esports"
          })

          return NextResponse.json({
            status: "success",
            message: "Payment confirmed",
            mpesaReceipt: mpesaReceipt,
            paidAt: new Date(),
          })
        }

        // ✅ USER CANCELLED - 1037, 1032
        if (resultCode === 1037 || resultCode === 1032) {
          await prisma.seasonEntry.update({
            where: { id: seasonEntry.id },
            data: {
              status: "NOT_ENROLLED",
              resultCode: resultCode,
              resultDesc: "User cancelled the transaction on their phone",
            },
          })

          // ✅ SEND NOTIFICATION FOR PAYMENT CANCELLED
          await notificationWithEmailService.sendNotificationWithEmail({
            userId: session.user.id,
            type: "PAYMENT_FAILED",
            title: "❌ Payment Cancelled",
            message: `You cancelled the payment of KES ${seasonEntry.entryFee || 0}. You can try again anytime.`,
            priority: "HIGH",
            data: {
              amount: seasonEntry.entryFee || 0,
              link: "/dashboard"
            },
            emailTemplate: "notification",
            emailSubject: "❌ Payment Cancelled - Nexus Esports"
          })

          return NextResponse.json({
            status: "cancelled",
            message: "You cancelled the payment on your phone.",
          })
        }

        // ✅ SANDBOX: 4999 means "Authorized" - treat as pending
        if (resultCode === 4999) {
          console.log(`⏳ Sandbox: Authorized but not completed (ResultCode: 4999)`)
          return NextResponse.json({
            status: "pending",
            message: "Waiting for payment confirmation...",
          })
        }

        // ✅ PENDING - 2001, 2000, -1, null
        if (resultCode === 2001 || resultCode === 2000 || resultCode === -1 || resultCode === null) {
          console.log(`⏳ Still waiting for customer (ResultCode: ${resultCode})`)
          return NextResponse.json({
            status: "pending",
            message: "Waiting for your confirmation on your phone...",
          })
        }

        // ✅ FAILED - Any other result code
        await prisma.seasonEntry.update({
          where: { id: seasonEntry.id },
          data: {
            status: "NOT_ENROLLED",
            resultCode: resultCode,
            resultDesc: resultDesc || "Payment failed",
          },
        })

        // ✅ SEND NOTIFICATION FOR PAYMENT FAILED
        await notificationWithEmailService.sendNotificationWithEmail({
          userId: session.user.id,
          type: "PAYMENT_FAILED",
          title: "❌ Payment Failed",
          message: `Your payment of KES ${seasonEntry.entryFee || 0} failed. Please try again.`,
          priority: "CRITICAL",
          data: {
            amount: seasonEntry.entryFee || 0,
            link: "/dashboard"
          },
          emailTemplate: "notification",
          emailSubject: "❌ Payment Failed - Nexus Esports"
        })

        return NextResponse.json({
          status: "failed",
          message: resultDesc || "Payment failed. Please try again.",
        })

      } catch (error: any) {
        console.error('Error querying STK status:', error)
        return NextResponse.json({
          status: "pending",
          message: "Still waiting for your confirmation...",
        })
      }
    }

    return NextResponse.json({
      status: "pending",
      message: "Waiting for payment confirmation...",
    })

  } catch (error) {
    console.error("Error checking payment status:", error)
    return NextResponse.json({
      status: "pending",
      message: "Unable to check status, please try again",
    })
  }
}