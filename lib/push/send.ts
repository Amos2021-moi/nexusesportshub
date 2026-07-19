import webpush from "web-push";
import { PushSubscription, getAllSubscriptions, getUserSubscriptions, removeSubscription } from "./subscription";

// ✅ Get VAPID keys from environment
const publicKey = process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:nexusesportshub@gmail.com";

// ✅ Log key status (helps with debugging)
console.log("🔑 VAPID Public Key exists:", !!publicKey);
console.log("🔑 VAPID Private Key exists:", !!privateKey);
console.log("🔑 VAPID Subject:", subject);

// ✅ Only configure if keys exist
const isVapidConfigured = !!(publicKey && privateKey);

if (isVapidConfigured) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log("✅ VAPID configured for push notifications");
  } catch (error) {
    console.error("❌ Failed to configure VAPID:", error);
  }
} else {
  console.warn("⚠️ VAPID keys not configured. Push notifications will not work.");
  console.warn("   Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to environment variables.");
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// ✅ Check if push is available
export function isPushAvailable(): boolean {
  return isVapidConfigured;
}

// ✅ Send to a single user
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; message: string }> {
  if (!isPushAvailable()) {
    return {
      sent: 0,
      failed: 0,
      message: "Push notifications not configured. Add VAPID keys to enable."
    };
  }

  try {
    const subscriptions = await getUserSubscriptions(userId);
    return sendPushToSubscriptions(subscriptions, payload);
  } catch (error: any) {
    console.error("Error getting subscriptions:", error);
    return {
      sent: 0,
      failed: 0,
      message: error.message || "Failed to get subscriptions"
    };
  }
}

// ✅ Send to all users
export async function sendPushToAll(
  payload: PushPayload
): Promise<{ sent: number; failed: number; message: string }> {
  if (!isPushAvailable()) {
    return {
      sent: 0,
      failed: 0,
      message: "Push notifications not configured. Add VAPID keys to enable."
    };
  }

  try {
    const subscriptions = await getAllSubscriptions();
    return sendPushToSubscriptions(subscriptions, payload);
  } catch (error: any) {
    console.error("Error getting subscriptions:", error);
    return {
      sent: 0,
      failed: 0,
      message: error.message || "Failed to get subscriptions"
    };
  }
}

// ✅ Send to specific subscriptions
async function sendPushToSubscriptions(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; message: string }> {
  let sent = 0;
  let failed = 0;

  if (subscriptions.length === 0) {
    return {
      sent: 0,
      failed: 0,
      message: "No push subscriptions found."
    };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    data: payload.data || {},
    actions: payload.actions || [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  });

  console.log(`📤 Sending push to ${subscriptions.length} subscribers...`);

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
          },
        },
        pushPayload
      );
      sent++;
      console.log(`✅ Push sent to ${subscription.endpoint.substring(0, 30)}...`);
    } catch (error: any) {
      // If subscription expired, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await removeSubscription(subscription.endpoint);
        console.log(`🗑️ Removed expired subscription: ${subscription.endpoint}`);
      } else {
        console.error(`❌ Failed to send push:`, error.message);
      }
      failed++;
    }
  }

  return {
    sent,
    failed,
    message: `Sent to ${sent} devices, ${failed} failed`
  };
}

// ✅ Send a specific notification type
export async function sendMatchReminderPush(
  userId: string,
  match: {
    homePlayer: string;
    awayPlayer: string;
    scheduledDate: string;
  }
): Promise<{ sent: number; failed: number; message: string }> {
  return sendPushToUser(userId, {
    title: "⚽ Match Reminder",
    body: `You have a match tomorrow: ${match.homePlayer} vs ${match.awayPlayer}`,
    icon: "/icons/icon-192.png",
    data: {
      url: "/dashboard/fixtures",
      type: "MATCH_REMINDER",
    },
    actions: [
      {
        action: "view",
        title: "View Match",
      },
    ],
  });
}

export async function sendResultPush(
  userId: string,
  result: {
    homePlayer: string;
    awayPlayer: string;
    homeScore: number;
    awayScore: number;
    status: "approved" | "rejected";
  }
): Promise<{ sent: number; failed: number; message: string }> {
  const isApproved = result.status === "approved";
  const emoji = isApproved ? "✅" : "❌";

  return sendPushToUser(userId, {
    title: `${emoji} Result ${isApproved ? "Approved" : "Rejected"}`,
    body: `${result.homePlayer} ${result.homeScore} - ${result.awayScore} ${result.awayPlayer}`,
    icon: "/icons/icon-192.png",
    data: {
      url: "/dashboard/fixtures",
      type: "RESULT_UPDATE",
    },
    actions: [
      {
        action: "view",
        title: "View Details",
      },
    ],
  });
}