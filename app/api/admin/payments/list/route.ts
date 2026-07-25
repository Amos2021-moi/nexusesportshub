import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompetitionStatus } from "@prisma/client";

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

    // ✅ Build where clause with proper enum mapping
    const where: any = {};

    if (status && status !== "ALL") {
      // ✅ Map frontend status to CompetitionStatus enum
      switch (status) {
        case "COMPLETED":
          where.status = CompetitionStatus.ACTIVE;
          break;
        case "PENDING":
          where.status = CompetitionStatus.PAYMENT_PENDING;
          break;
        case "FAILED":
          where.status = CompetitionStatus.SUSPENDED;
          break;
        case "REFUNDED":
          where.status = CompetitionStatus.REFUNDED;
          break;
        case "NOT_ENROLLED":
          where.status = CompetitionStatus.NOT_ENROLLED;
          break;
        default:
          where.status = status;
      }
    }

    if (search) {
      where.OR = [
        {
          user: {
            name: { contains: search, mode: "insensitive" }
          }
        },
        {
          user: {
            email: { contains: search, mode: "insensitive" }
          }
        },
        {
          season: {
            name: { contains: search, mode: "insensitive" }
          }
        },
        {
          mpesaReceipt: { contains: search, mode: "insensitive" }
        }
      ];
    }

    // ✅ Get total count for pagination
    const total = await prisma.seasonEntry.count({ where });

    // ✅ Get payments with pagination - include profile for username
    const payments = await prisma.seasonEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                username: true,
              },
            },
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

    // ✅ Format response to match frontend expectations
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: payment.entryFee || 0,
      currency: payment.currency || "KES",
      status: payment.status || "NOT_ENROLLED",
      reference: payment.mpesaReceipt || payment.id,
      paymentMethod: payment.phoneNumber ? "MPESA" : "UNKNOWN",
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt?.toISOString() || payment.createdAt.toISOString(),
      playerName: payment.user?.name || "Unknown",
      playerEmail: payment.user?.email || "Unknown",
      seasonName: payment.season?.name || "Unknown",
      receipt: payment.mpesaReceipt || null,
      paidAt: payment.paidAt?.toISOString() || null,
      user: {
        id: payment.user?.id || "",
        name: payment.user?.name || "Unknown",
        email: payment.user?.email || "Unknown",
        profile: {
          username: payment.user?.profile?.username || null,
        },
      },
      season: {
        id: payment.season?.id || "",
        name: payment.season?.name || "Unknown",
      },
    }));

    // ✅ Return with pagination object
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