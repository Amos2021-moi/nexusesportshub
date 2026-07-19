import { prisma } from "@/lib/prisma";
import { smartNotificationService } from "@/lib/services/smartNotification.service";
import { NotificationType, PriorityLevel } from "@/lib/types/notification";

export class NotificationAgent {
  
  // ✅ AI decides what notifications to send and when
  async processEvent(
    eventType: NotificationType,
    eventData: any,
    targetUsers: string[]
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of targetUsers) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });

        if (!user) continue;

        // ✅ AI decides if this user should get this notification
        const shouldSend = await this.shouldSendNotification(user, eventType, eventData);
        if (!shouldSend) continue;

        // ✅ AI decides the best channel
        const channel = await this.selectBestChannel(user, eventType);

        // ✅ AI generates personalized message
        const { title, message } = await this.generatePersonalizedMessage(user, eventType, eventData);

        // ✅ Create and send notification
        const notification = await smartNotificationService.createNotification(
          userId,
          eventType,
          title,
          message,
          eventData,
          eventData.link || null,
          channel
        );

        if (notification) {
          sent++;
        } else {
          failed++;
        }

      } catch (error) {
        console.error(`Error sending notification to ${userId}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  // ✅ AI decides if user should get this notification
  async shouldSendNotification(user: any, eventType: NotificationType, eventData: any): Promise<boolean> {
    // ✅ Rule 1: Don't send if user is not relevant
    if (eventType.includes("MATCH") && !eventData.userId && !eventData.opponentId) {
      return false;
    }

    // ✅ Rule 2: Don't send if user has opted out
    const prefs = user.notificationPreferences || {};
    if (prefs.matchReminders === false && eventType.includes("MATCH")) return false;
    if (prefs.tournamentUpdates === false && eventType.includes("TOURNAMENT")) return false;
    if (prefs.newsAlerts === false && eventType.includes("NEWS")) return false;
    if (prefs.communityAlerts === false && eventType.includes("COMMUNITY")) return false;

    // ✅ Rule 3: Don't send during quiet hours (unless CRITICAL)
    const quietHours = prefs.pushQuietHours || { start: "22:00", end: "07:00" };
    const currentHour = new Date().getHours();
    const isQuietHour = currentHour >= parseInt(quietHours.start) || currentHour < parseInt(quietHours.end);
    
    if (isQuietHour) {
      const priority = smartNotificationService.calculatePriority(user, eventType, eventData);
      if (priority.level !== "CRITICAL") {
        return false;
      }
    }

    // ✅ Rule 4: Don't overwhelm (rate limiting)
    const recentNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
      },
    });

    if (recentNotifications > 10) {
      return false;
    }

    return true;
  }

  // ✅ AI selects best channel for notification
  async selectBestChannel(user: any, eventType: NotificationType): Promise<"IN_APP" | "PUSH" | "EMAIL" | "WHATSAPP"> {
    const prefs = user.notificationPreferences || {};

    // ✅ Critical events → All channels (if available)
    if (eventType === "MATCH_RESULT_PENDING" || 
        eventType === "PAYMENT_FAILED" || 
        eventType === "SYSTEM_ALERT") {
      return "IN_APP";
    }

    // ✅ Time-sensitive events → Push + In-app
    if (eventType === "FIXTURE_REMINDER" || 
        eventType === "TOURNAMENT_START" || 
        eventType === "REGISTRATION_CLOSING") {
      if (prefs.pushEnabled) return "PUSH";
    }

    // ✅ Results and awards → Email + In-app
    if (eventType === "MATCH_RESULT_APPROVED" || 
        eventType === "AWARD_EARNED" || 
        eventType === "PAYMENT_CONFIRMED") {
      if (prefs.emailEnabled) return "EMAIL";
    }

    // ✅ Low importance → In-app only
    if (eventType === "NEWS_PUBLISHED" || 
        eventType === "COMMUNITY_LIKE" || 
        eventType === "COMMUNITY_REPLY") {
      return "IN_APP";
    }

    // ✅ Default
    return "IN_APP";
  }

  // ✅ AI generates personalized message
  async generatePersonalizedMessage(
    user: any,
    eventType: NotificationType,
    eventData: any
  ): Promise<{ title: string; message: string }> {
    const userName = user.profile?.username || user.name || "Player";

    // ✅ Template-based personalization
    const templates: Record<NotificationType, (data: any) => { title: string; message: string }> = {
      MATCH_RESULT_PENDING: (data) => ({
        title: "⚡ Result Pending",
        message: `Your match result against ${data.opponentName || "opponent"} is awaiting approval.`,
      }),
      MATCH_RESULT_APPROVED: (data) => ({
        title: "✅ Result Approved",
        message: `Your match against ${data.opponentName || "opponent"} has been approved! ${data.homeScore} - ${data.awayScore}`,
      }),
      MATCH_RESULT_REJECTED: (data) => ({
        title: "❌ Result Rejected",
        message: `Your match result against ${data.opponentName || "opponent"} was rejected. Please resubmit.`,
      }),
      NEW_FIXTURE: (data) => ({
        title: "📅 New Fixture",
        message: `You have a new match against ${data.opponentName || "opponent"} on ${new Date(data.date).toLocaleDateString()}`,
      }),
      FIXTURE_REMINDER: (data) => ({
        title: "⏰ Match Reminder",
        message: `Your match against ${data.opponentName || "opponent"} is tomorrow at ${new Date(data.date).toLocaleTimeString()}`,
      }),
      TOURNAMENT_START: (data) => ({
        title: "🏆 Tournament Starts Tomorrow",
        message: `${data.tournamentName || "Tournament"} starts tomorrow! Check your bracket.`,
      }),
      TOURNAMENT_UPDATE: (data) => ({
        title: "🔄 Tournament Update",
        message: `${data.message || "Tournament status has been updated."}`,
      }),
      TOURNAMENT_COMPLETED: (data) => ({
        title: "🏆 Tournament Completed",
        message: `${data.tournamentName || "Tournament"} has ended! ${data.winnerName || "Winner"} takes the crown!`,
      }),
      AWARD_EARNED: (data) => ({
        title: "🎖️ Award Earned",
        message: `Congratulations ${userName}! You earned the "${data.awardName || "Award"}" award!`,
      }),
      SEASON_UPDATE: (data) => ({
        title: "📋 Season Update",
        message: `${data.message || "Season status has been updated."}`,
      }),
      REGISTRATION_CLOSING: (data) => ({
        title: "⚠️ Registration Closing Soon",
        message: `Season ${data.seasonName || ""} registration closes in ${data.daysLeft || 2} days!`,
      }),
      PAYMENT_CONFIRMED: (data) => ({
        title: "💰 Payment Confirmed",
        message: `Your payment of KES ${data.amount || 0} has been confirmed.`,
      }),
      PAYMENT_FAILED: (data) => ({
        title: "❌ Payment Failed",
        message: `Your payment of KES ${data.amount || 0} failed. Please try again.`,
      }),
      NEWS_PUBLISHED: (data) => ({
        title: "📰 New Article",
        message: `${data.newsTitle || "A new article"} has been published.`,
      }),
      COMMUNITY_REPLY: (data) => ({
        title: "💬 New Reply",
        message: `${data.replyAuthor || "Someone"} replied to your comment: "${data.replyPreview || ""}"`,
      }),
      COMMUNITY_LIKE: (data) => ({
        title: "❤️ New Like",
        message: `${data.likeAuthor || "Someone"} liked your post.`,
      }),
      SYSTEM_ALERT: (data) => ({
        title: "⚠️ System Alert",
        message: `${data.message || "System update available."}`,
      }),
      ADMIN_ALERT: (data) => ({
        title: "🛡️ Admin Alert",
        message: `${data.message || "Please check the admin dashboard."}`,
      }),
    };

    const template = templates[eventType] || (() => ({
      title: "🔔 New Notification",
      message: "You have a new notification.",
    }));

    return template(eventData);
  }

  // ✅ AI generates daily digest for a user
  async generateDailyDigest(userId: string): Promise<{ title: string; message: string; hasNotifications: boolean }> {
    const digest = await smartNotificationService.generateDigest(userId);

    if (digest.total === 0) {
      return {
        title: "📊 No New Notifications",
        message: "You have no new notifications today.",
        hasNotifications: false,
      };
    }

    let message = "";
    let hasNotifications = false;

    if (digest.critical.length > 0) {
      message += `🔴 ${digest.critical.length} CRITICAL\n`;
      digest.critical.forEach((n: any) => {
        message += `  • ${n.title}\n`;
      });
      hasNotifications = true;
    }

    if (digest.high.length > 0) {
      message += `🟠 ${digest.high.length} HIGH\n`;
      digest.high.forEach((n: any) => {
        message += `  • ${n.title}\n`;
      });
      hasNotifications = true;
    }

    if (digest.medium.length > 0) {
      message += `🟡 ${digest.medium.length} MEDIUM\n`;
      digest.medium.forEach((n: any) => {
        message += `  • ${n.title}\n`;
      });
      hasNotifications = true;
    }

    return {
      title: `📊 Daily Digest - ${digest.total} notifications`,
      message,
      hasNotifications,
    };
  }
}

export const notificationAgent = new NotificationAgent();