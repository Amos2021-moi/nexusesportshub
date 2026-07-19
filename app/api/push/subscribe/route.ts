import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveSubscription } from "@/lib/push/subscription";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }

    await saveSubscription(session.user.id, subscription);

    return NextResponse.json({
      success: true,
      message: "Subscribed to push notifications",
    });
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}