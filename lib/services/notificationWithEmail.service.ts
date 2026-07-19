import { prisma } from "@/lib/prisma";
import { emailService } from "./email.service";
import { smartNotificationService } from "./smartNotification.service";
import { NotificationType, PriorityLevel } from "@/lib/types/notification";

interface NotificationWithEmailOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: PriorityLevel;
  data?: any;
  link?: string;
  emailTemplate?: string;
  emailSubject?: string;
}

export class NotificationWithEmailService {
  
  // ✅ Send notification with optional email
  async sendNotificationWithEmail(options: NotificationWithEmailOptions): Promise<{
    notification: any;
    emailSent: boolean;
    emailError?: string;
  }> {
    const {
      userId,
      type,
      title,
      message,
      priority,
      data = {},
      link = null,
      emailTemplate = "notification",
      emailSubject,
    } = options;

    let emailSent = false;
    let emailError = undefined;

    try {
      // ✅ Get user with preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          profile: true,
          notificationPreference: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // ✅ Create notification in database
      const notification = await smartNotificationService.createNotification(
        userId,
        type,
        title,
        message,
        data,
        link,
        "IN_APP"
      );

      if (!notification) {
        throw new Error("Failed to create notification");
      }

      // ✅ Determine if email should be sent
      const shouldSendEmail = await this.shouldSendEmail(user, priority);

      if (shouldSendEmail) {
        // ✅ Prepare email data
        const emailData = {
          name: user.profile?.username || user.name || "Player",
          username: user.profile?.username || user.name || "Player",
          email: user.email,
          link: link || process.env.NEXTAUTH_URL,
          customMessage: message,
          title,
          priority,
          ...data,
        };

        // ✅ Send email
        const emailResult = await emailService.sendTemplateEmail(
          user.email,
          emailTemplate,
          emailData,
          emailSubject || `${priority === "CRITICAL" ? "🚨 " : priority === "HIGH" ? "⚡ " : ""}${title}`
        );

        if (emailResult.success) {
          emailSent = true;
        } else {
          emailError = emailResult.error;
        }
      }

      return {
        notification,
        emailSent,
        emailError,
      };

    } catch (error: any) {
      console.error("Error sending notification with email:", error);
      return {
        notification: null,
        emailSent: false,
        emailError: error.message || "Failed to send notification",
      };
    }
  }

  // ✅ Determine if email should be sent
  private async shouldSendEmail(user: any, priority: PriorityLevel): Promise<boolean> {
    // ✅ Check if user has email notifications enabled
    if (!user.emailNotificationsEnabled) {
      return false;
    }

    // ✅ Check preferences
    const prefs = user.notificationPreference;

    if (!prefs) {
      // Default: send email for CRITICAL and HIGH
      return priority === "CRITICAL" || priority === "HIGH";
    }

    // ✅ Check if email is enabled
    if (!prefs.emailEnabled) {
      return false;
    }

    // ✅ Check priority threshold
    const priorityValues = {
      CRITICAL: 85,
      HIGH: 70,
      MEDIUM: 40,
      LOW: 10,
    };

    const minPriority = prefs.minPriorityInApp || 30;
    return priorityValues[priority] >= minPriority;
  }

  // ✅ Send result notification
  async sendResultNotification(
    userId: string,
    result: {
      homePlayer: string;
      awayPlayer: string;
      homeScore: number;
      awayScore: number;
      status: "pending" | "approved" | "rejected";
    }
  ): Promise<void> {
    const statusMap = {
      pending: "submitted and is pending approval",
      approved: "has been approved",
      rejected: "has been rejected",
    };

    const typeMap = {
      pending: "MATCH_RESULT_PENDING",
      approved: "MATCH_RESULT_APPROVED",
      rejected: "MATCH_RESULT_REJECTED",
    };

    const priorityMap = {
      pending: "HIGH" as PriorityLevel,
      approved: "MEDIUM" as PriorityLevel,
      rejected: "HIGH" as PriorityLevel,
    };

    const titleMap = {
      pending: "⚡ Result Pending",
      approved: "✅ Result Approved",
      rejected: "❌ Result Rejected",
    };

    await this.sendNotificationWithEmail({
      userId,
      type: typeMap[result.status] as NotificationType,
      title: titleMap[result.status],
      message: `Your match against ${result.awayPlayer} ${statusMap[result.status]}. Score: ${result.homeScore} - ${result.awayScore}`,
      priority: priorityMap[result.status],
      data: {
        homePlayer: result.homePlayer,
        awayPlayer: result.awayPlayer,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        resultStatus: result.status,
      },
      emailTemplate: "match-result",
    });
  }

  // ✅ Send fixture notification
  async sendFixtureNotification(
    userId: string,
    fixture: {
      homePlayer: string;
      awayPlayer: string;
      date: string;
      seasonName: string;
    }
  ): Promise<void> {
    await this.sendNotificationWithEmail({
      userId,
      type: "NEW_FIXTURE",
      title: "📅 New Fixture",
      message: `You have a new match against ${fixture.awayPlayer} on ${new Date(fixture.date).toLocaleDateString()}`,
      priority: "HIGH",
      data: {
        homePlayer: fixture.homePlayer,
        awayPlayer: fixture.awayPlayer,
        fixtureDate: new Date(fixture.date).toLocaleDateString(),
        seasonName: fixture.seasonName,
      },
      emailTemplate: "new-fixture",
    });
  }

  // ✅ Send tournament notification
  async sendTournamentNotification(
    userId: string,
    tournament: {
      name: string;
      status: "start" | "end";
      date?: string;
      winner?: string;
    }
  ): Promise<void> {
    const isStart = tournament.status === "start";
    const type = isStart ? "TOURNAMENT_START" : "TOURNAMENT_COMPLETED";
    const title = isStart ? "🏆 Tournament Starts Tomorrow" : "🏆 Tournament Completed";
    const priority: PriorityLevel = isStart ? "HIGH" : "MEDIUM";

    const message = isStart
      ? `${tournament.name} starts ${tournament.date ? `on ${new Date(tournament.date).toLocaleDateString()}` : 'tomorrow'}!`
      : `${tournament.name} has ended! ${tournament.winner ? `${tournament.winner} takes the crown!` : ''}`;

    await this.sendNotificationWithEmail({
      userId,
      type,
      title,
      message,
      priority,
      data: {
        tournamentName: tournament.name,
        fixtureDate: tournament.date ? new Date(tournament.date).toLocaleDateString() : null,
        winnerName: tournament.winner || null,
      },
      emailTemplate: isStart ? "tournament-start" : "tournament-end",
    });
  }

  // ✅ Send award notification
  async sendAwardNotification(
    userId: string,
    award: {
      name: string;
      reason?: string;
      link?: string;
    }
  ): Promise<void> {
    await this.sendNotificationWithEmail({
      userId,
      type: "AWARD_EARNED",
      title: `🎖️ You Won ${award.name}!`,
      message: `Congratulations! You've been awarded the ${award.name} award${award.reason ? ` for ${award.reason}` : ''}.`,
      priority: "HIGH",
      data: {
        awardName: award.name,
        customMessage: award.reason || `You've been awarded the ${award.name} award!`,
        link: award.link || null,
      },
      emailTemplate: "award",
    });
  }

  // ✅ Send digest to a specific user
  async sendDigest(
    userId: string,
    digestType: "DAILY" | "WEEKLY"
  ): Promise<{ success: boolean; count: number }> {
    try {
      if (digestType === "DAILY") {
        return await emailService.sendDailyDigest(userId);
      } else {
        return await emailService.sendWeeklyDigest(userId);
      }
    } catch (error) {
      console.error(`Error sending ${digestType} digest:`, error);
      return { success: false, count: 0 };
    }
  }

  // ✅ Send digest to all users
  async sendDigestToAllUsers(digestType: "DAILY" | "WEEKLY"): Promise<{
    total: number;
    sent: number;
    failed: number;
  }> {
    try {
      // ✅ Get all users with email notifications enabled
      const users = await prisma.user.findMany({
        where: {
          emailNotificationsEnabled: true,
          emailVerified: true,
        },
        include: {
          profile: true,
          notificationPreference: true,
        },
      });

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          // ✅ Check user's digest preference
          const prefs = user.notificationPreference;
          if (prefs) {
            if (digestType === "DAILY" && prefs.emailDigest === "NEVER") continue;
            if (digestType === "DAILY" && prefs.emailDigest === "WEEKLY") continue;
            if (digestType === "WEEKLY" && prefs.emailDigest === "NEVER") continue;
            if (digestType === "WEEKLY" && prefs.emailDigest === "DAILY") continue;
          }

          // ✅ Send digest
          const result = await this.sendDigest(user.id, digestType);

          if (result.success && result.count > 0) {
            sent++;
          } else if (result.success && result.count === 0) {
            continue;
          } else {
            failed++;
          }

        } catch (error) {
          console.error(`Failed to send digest to ${user.email}:`, error);
          failed++;
        }
      }

      return {
        total: users.length,
        sent,
        failed,
      };

    } catch (error) {
      console.error("Error sending digests:", error);
      return { total: 0, sent: 0, failed: 0 };
    }
  }
}

export const notificationWithEmailService = new NotificationWithEmailService();