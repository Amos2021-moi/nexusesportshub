import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/push/subscription";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint required" },
        { status: 400 }
      );
    }

    await removeSubscription(endpoint);

    return NextResponse.json({
      success: true,
      message: "Unsubscribed from push notifications",
    });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}