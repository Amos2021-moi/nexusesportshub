import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // ✅ Build where clause
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          season: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          mpesaReceipt: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // ✅ Get total count for pagination
    const total = await prisma.seasonEntry.count({ where });

    // ✅ Get payments with pagination
    const payments = await prisma.seasonEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        season: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // ✅ Format response
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      playerName: payment.user?.name || "Unknown",
      playerEmail: payment.user?.email || "Unknown",
      amount: payment.entryFee || 0,
      status: payment.status || "PENDING",
      method: payment.phoneNumber ? "MPESA" : "UNKNOWN",
      seasonName: payment.season?.name || "Unknown",
      receipt: payment.mpesaReceipt || null,
      paidAt: payment.paidAt?.toISOString() || null,
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching payments list:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments list" },
      { status: 500 }
    );
  }
}