import { prisma } from "@/lib/prisma";

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

// ✅ Save subscription
export async function saveSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  await (prisma as any).pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      authKey: subscription.keys.auth,
      p256dhKey: subscription.keys.p256dh,
      updatedAt: new Date(),
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      authKey: subscription.keys.auth,
      p256dhKey: subscription.keys.p256dh,
    },
  });
}

// ✅ Remove subscription
export async function removeSubscription(endpoint: string): Promise<void> {
  await (prisma as any).pushSubscription.delete({
    where: { endpoint },
  });
}

// ✅ Get all subscriptions for a user
export async function getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
  const subscriptions = await (prisma as any).pushSubscription.findMany({
    where: { userId },
  });

  return subscriptions.map((sub: any) => ({
    endpoint: sub.endpoint,
    keys: {
      auth: sub.authKey,
      p256dh: sub.p256dhKey,
    },
  }));
}

// ✅ Get all subscriptions (for broadcasting)
export async function getAllSubscriptions(): Promise<PushSubscription[]> {
  const subscriptions = await (prisma as any).pushSubscription.findMany();

  return subscriptions.map((sub: any) => ({
    endpoint: sub.endpoint,
    keys: {
      auth: sub.authKey,
      p256dh: sub.p256dhKey,
    },
  }));
}