// app/api/webhook/whatsapp/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || "http://localhost:3001/webhook";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

async function sendToWhatsApp(event: string, data: any) {
  try {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(WHATSAPP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ Webhook failed: ${response.status}`);
      return false;
    }

    console.log(`✅ Webhook sent: ${event}`);
    return true;
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return false;
  }
}

// POST: Send event to WhatsApp
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can trigger webhooks
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, data } = body;

    if (!event) {
      return NextResponse.json(
        { error: "Event is required" },
        { status: 400 }
      );
    }

    const sent = await sendToWhatsApp(event, data);

    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Event "${event}" sent to WhatsApp`,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to send to WhatsApp" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Webhook API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Webhook status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      status: "ok",
      webhookUrl: WHATSAPP_WEBHOOK_URL,
      configured: !!WHATSAPP_WEBHOOK_URL && !!WEBHOOK_SECRET,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}