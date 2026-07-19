import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get all successful payments
    const payments = await prisma.seasonEntry.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        phoneNumber: true,
        mpesaReceipt: true,
      },
    });

    // ✅ Count by method (if phoneNumber exists, it's MPESA)
    let mpesaCount = 0;
    let otherCount = 0;

    for (const payment of payments) {
      if (payment.phoneNumber || payment.mpesaReceipt) {
        mpesaCount++;
      } else {
        otherCount++;
      }
    }

    // ✅ Calculate total and percentages
    const total = mpesaCount + otherCount;

    const result = [];

    if (total > 0) {
      result.push({
        method: "M-Pesa",
        count: mpesaCount,
        percentage: Math.round((mpesaCount / total) * 100),
      });
      result.push({
        method: "Other",
        count: otherCount,
        percentage: Math.round((otherCount / total) * 100),
      });
    }

    // ✅ If no data, return default
    if (result.length === 0) {
      return NextResponse.json([
        { method: "M-Pesa", count: 0, percentage: 0 },
        { method: "Other", count: 0, percentage: 0 },
      ]);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}