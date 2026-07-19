import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    const where: any = {}
    if (action && action !== "all") {
      where.action = action
    }

    // ✅ Get all payment audits
    const payments = await prisma.paymentAudit.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        seasonEntry: {
          include: {
            season: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // ✅ Calculate stats correctly - ONLY count REAL payments
    const realPayments = payments.filter(p => 
      p.action === "PAYMENT_SUCCESS" || 
      p.action === "ADMIN_MARKED_PAID"
    )
    
    const totalPayments = payments.length
    const successCount = realPayments.length
    const failedCount = payments.filter(p => p.action === "PAYMENT_FAILED").length
    const pendingCount = payments.filter(p => p.action === "PAYMENT_PENDING" || p.action === "STK_PUSH_SENT").length
    
    // ✅ Total amount from REAL payments only
    const totalAmount = realPayments.reduce((sum, p) => sum + (p.seasonEntry?.entryFee || 0), 0)

    const stats = {
      totalPayments,
      totalAmount,
      successCount,
      failedCount,
      pendingCount,
    }

    // ✅ Only return REAL payments in the list
    const filteredPayments = realPayments

    return NextResponse.json({ payments: filteredPayments, stats })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}