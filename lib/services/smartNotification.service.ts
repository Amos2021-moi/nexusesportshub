import { prisma } from "@/lib/prisma";
import { Notification, NotificationType, PriorityLevel, NotificationChannel } from "@/lib/types/notification";

export class SmartNotificationService {
  
  // ✅ Calculate priority score for a notification
  calculatePriority(
    user: any,
    eventType: NotificationType,
    eventData: any
  ): { score: number; level: PriorityLevel; reason: string } {
    let score = 50;
    const reasons: string[] = [];

    // ✅ 1. User Importance Score (0-35)
    let importanceScore = 20; // Base

    // Role factor
    if (user.role === "ADMIN") {
      importanceScore += 15;
      reasons.push("Admin account");
    } else if (user.isVerified) {
      importanceScore += 10;
      reasons.push("Verified player");
    }

    // Engagement factor
    const matchesPlayed = user.matchesPlayed || 0;
    if (matchesPlayed > 20) {
      importanceScore += 10;
      reasons.push("High engagement");
    } else if (matchesPlayed > 10) {
      importanceScore += 5;
      reasons.push("Active player");
    }

    // Recent activity
    const daysSinceLastActive = this.getDaysSince(user.lastActive);
    if (daysSinceLastActive < 1) {
      importanceScore += 5;
      reasons.push("Recently active");
    }

    // ✅ 2. Event Relevance Score (0-30)
    let relevanceScore = 0;

    // Check if user is directly involved
    if (eventData.userId === user.id) {
      relevanceScore += 15;
      reasons.push("Directly involved");
    } else if (eventData.opponentId === user.id) {
      relevanceScore += 10;
      reasons.push("Opponent involved");
    } else if (eventData.seasonId === user.currentSeasonId) {
      relevanceScore += 5;
      reasons.push("Active season");
    }

    // Event type importance
    const typeScores: Record<NotificationType, number> = {
      MATCH_RESULT_PENDING: 25,
      MATCH_RESULT_APPROVED: 20,
      MATCH_RESULT_REJECTED: 20,
      NEW_FIXTURE: 15,
      FIXTURE_REMINDER: 15,
      TOURNAMENT_START: 20,
      TOURNAMENT_UPDATE: 15,
      TOURNAMENT_COMPLETED: 15,
      AWARD_EARNED: 15,
      SEASON_UPDATE: 10,
      REGISTRATION_CLOSING: 15,
      PAYMENT_CONFIRMED: 20,
      PAYMENT_FAILED: 25,
      NEWS_PUBLISHED: 5,
      COMMUNITY_REPLY: 5,
      COMMUNITY_LIKE: 3,
      SYSTEM_ALERT: 20,
      ADMIN_ALERT: 25,
    };

    relevanceScore += typeScores[eventType] || 10;
    if (typeScores[eventType] > 15) {
      reasons.push(`Important event type: ${eventType}`);
    }

    // ✅ 3. Timing Score (0-20)
    let timingScore = 10; // Base

    const currentHour = new Date().getHours();
    // Active hours (8 AM - 8 PM)
    if (currentHour >= 8 && currentHour <= 20) {
      timingScore += 10;
      reasons.push("Active hours");
    }

    // Is it urgent?
    if (eventData.urgency) {
      timingScore += 5;
      reasons.push("Urgent");
    }

    // ✅ 4. Channel Preference Score (0-15)
    let channelScore = 10; // Base

    // Check if user prefers this channel
    if (user.notificationPreferences) {
      const prefs = user.notificationPreferences;
      if (prefs.pushEnabled) channelScore += 5;
      if (prefs.emailEnabled) channelScore += 3;
      if (prefs.matchReminders && eventType.includes("MATCH")) channelScore += 2;
      if (prefs.tournamentUpdates && eventType.includes("TOURNAMENT")) channelScore += 2;
    }

    // ✅ Calculate final score
    score = Math.round(
      (importanceScore * 0.35) +
      (relevanceScore * 0.30) +
      (timingScore * 0.20) +
      (channelScore * 0.15)
    );

    // Cap at 100
    score = Math.min(score, 100);

    // ✅ Determine priority level
    let level: PriorityLevel = "LOW";
    if (score >= 85) level = "CRITICAL";
    else if (score >= 70) level = "HIGH";
    else if (score >= 40) level = "MEDIUM";
    else level = "LOW";

    return {
      score,
      level,
      reason: reasons.slice(0, 3).join(", "),
    };
  }

  // ✅ Generate a notification
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: any = {},
    link: string | null = null,
    channel: NotificationChannel = "IN_APP"
  ): Promise<Notification | null> {
    try {
      // ✅ Get user for priority calculation
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      });

      if (!user) return null;

      // ✅ Calculate priority
      const priority = this.calculatePriority(user, type, data);

      // ✅ Check if notification should be sent based on user preferences
      const shouldSend = this.shouldSendNotification(user, type, priority.level);
      if (!shouldSend && channel === "IN_APP") {
        // Still save but with lower priority
      }

      // ✅ Create notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          priority: priority.score,
          priorityLevel: priority.level,
          reason: priority.reason,
          channel,
          link,
          read: false,
        },
      });

      // ✅ If CRITICAL or HIGH, send via appropriate channels
      if (priority.level === "CRITICAL" || priority.level === "HIGH") {
        await this.deliverNotification(notification, priority.level, channel);
      }

      return notification as unknown as Notification;

    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  // ✅ Should we send this notification?
  shouldSendNotification(user: any, type: NotificationType, level: PriorityLevel): boolean {
    const prefs = user.notificationPreferences || {};

    // Check if user has opted out of this category
    if (type.includes("MATCH") && prefs.matchReminders === false) return false;
    if (type.includes("TOURNAMENT") && prefs.tournamentUpdates === false) return false;
    if (type.includes("NEWS") && prefs.newsAlerts === false) return false;
    if (type.includes("COMMUNITY") && prefs.communityAlerts === false) return false;
    if (type.includes("SYSTEM") && prefs.systemAlerts === false) return false;

    // Check priority threshold
    const minPriority = prefs.minPriorityInApp || 30;
    const priorityValue = this.getPriorityValue(level);

    return priorityValue >= minPriority;
  }

  // ✅ Get priority value
  getPriorityValue(level: PriorityLevel): number {
    switch (level) {
      case "CRITICAL": return 85;
      case "HIGH": return 70;
      case "MEDIUM": return 40;
      case "LOW": return 10;
      default: return 0;
    }
  }

  // ✅ Deliver notification via appropriate channel
  // ✅ Deliver notification via appropriate channel
async deliverNotification(notification: any, level: PriorityLevel, channel: NotificationChannel): Promise<void> {
  // In-app is already saved - just return
  if (channel === "IN_APP") {
    // Update delivered status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { deliveredAt: new Date() },
    });
    return;
  }

  // Push notification (browser)
  if (channel === "PUSH") {
    // Will be handled by frontend service worker
    console.log(`📱 Push notification would be sent: ${notification.title}`);
  }

  // Email
  if (channel === "EMAIL") {
    // Will be handled by email service
    console.log(`📧 Email notification would be sent: ${notification.title}`);
  }

  // WhatsApp (via Baileys)
  if (channel === "WHATSAPP") {
    // Will be handled by WhatsApp service
    console.log(`💬 WhatsApp notification would be sent: ${notification.title}`);
  }

  // Update delivered status
  await prisma.notification.update({
    where: { id: notification.id },
    data: { deliveredAt: new Date() },
  });
}

  // ✅ Get user's unread notifications
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    priorityFilter?: PriorityLevel
  ): Promise<{ notifications: any[]; unreadCount: number; counts: any }> {
    const where: any = { userId };

    if (priorityFilter) {
      where.priorityLevel = priorityFilter;
    }

    const [notifications, unreadCount, criticalCount, highCount, mediumCount, lowCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
      prisma.notification.count({
        where: { userId, priorityLevel: "CRITICAL", read: false },
      }),
      prisma.notification.count({
        where: { userId, priorityLevel: "HIGH", read: false },
      }),
      prisma.notification.count({
        where: { userId, priorityLevel: "MEDIUM", read: false },
      }),
      prisma.notification.count({
        where: { userId, priorityLevel: "LOW", read: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      counts: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        total: unreadCount,
      },
    };
  }

  // ✅ Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: { read: true, readAt: new Date() },
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  // ✅ Mark all as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true, readAt: new Date() },
      });
      return true;
    } catch (error) {
      console.error("Error marking all as read:", error);
      return false;
    }
  }

  // ✅ Generate daily digest
  async generateDigest(userId: string): Promise<any> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: yesterday },
        read: false,
      },
      orderBy: { priority: "desc" },
    });

    return {
      critical: notifications.filter(n => n.priorityLevel === "CRITICAL"),
      high: notifications.filter(n => n.priorityLevel === "HIGH"),
      medium: notifications.filter(n => n.priorityLevel === "MEDIUM"),
      low: notifications.filter(n => n.priorityLevel === "LOW"),
      total: notifications.length,
      date: new Date().toISOString(),
    };
  }

  // ✅ Helper: Get days since
  private getDaysSince(date: Date | null): number {
    if (!date) return 999;
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

export const smartNotificationService = new SmartNotificationService();