import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { renderEmailTemplate } from "@/lib/emails/templates";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

interface EmailTemplateData {
  name?: string;
  username?: string;
  email?: string;
  link?: string;
  token?: string;
  homePlayer?: string;
  awayPlayer?: string;
  homeScore?: number;
  awayScore?: number;
  fixtureDate?: string;
  tournamentName?: string;
  awardName?: string;
  seasonName?: string;
  matchId?: string;
  priority?: string;
  customMessage?: string;
  [key: string]: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isDevelopment: boolean;
  private fromEmail: string;
  private replyToEmail: string;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.fromEmail = process.env.EMAIL_FROM || "nexusesportshub@gmail.com";
    this.replyToEmail = process.env.EMAIL_REPLY_TO || "nexusesportshub@gmail.com";
    this.initTransporter();
  }

  private initTransporter(): void {
    try {
      const hasCredentials = !!(
        process.env.EMAIL_HOST &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS
      );

      if (!hasCredentials) {
        console.warn("⚠️ Email credentials not configured. Emails will be logged.");
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER || "nexusesportshub@gmail.com",
          pass: process.env.EMAIL_PASS,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      this.verifyConnection();
      console.log("✅ Email service initialized successfully!");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
      this.transporter = null;
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.verify();
      console.log("✅ SMTP connection verified successfully!");
    } catch (error) {
      console.error("❌ SMTP connection failed:", error);
      this.transporter = null;
    }
  }

  // ✅ Send email
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (this.isDevelopment || !this.transporter) {
        console.log("📧 [DEV] Email would be sent:");
        console.log(`  To: ${options.to}`);
        console.log(`  Subject: ${options.subject}`);
        console.log(`  HTML: ${options.html.substring(0, 200)}...`);
        return { success: true, messageId: "dev-" + Date.now() };
      }

      const info = await this.transporter.sendMail({
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
        replyTo: options.replyTo || this.replyToEmail,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });

      console.log(`✅ Email sent! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error("❌ Email sending failed:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }
  }

  // ✅ Send email with template and preference check
  async sendTemplateEmail(
    to: string | string[],
    templateName: string,
    data: EmailTemplateData,
    customSubject?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const email = Array.isArray(to) ? to[0] : to;
      
      const user = await this.getUserByEmail(email);

      if (user) {
        if (!user.emailNotificationsEnabled) {
          console.log(`📧 User ${email} has email notifications disabled. Skipping.`);
          return { success: true, messageId: "skipped" };
        }
        
        const prefs = user.notificationPreference;
        if (prefs && !prefs.emailEnabled) {
          console.log(`📧 User ${email} has email preference disabled. Skipping.`);
          return { success: true, messageId: "skipped" };
        }
      }

      const { subject, html, text } = await renderEmailTemplate(templateName, data);

      return this.sendEmail({
        to,
        subject: customSubject || subject,
        html,
        text,
      });
    } catch (error: any) {
      console.error("❌ Template email failed:", error);
      return { success: false, error: error.message || "Failed to send template email" };
    }
  }

  // ✅ Send bulk emails
  async sendBulkEmails(
    recipients: Array<{ email: string; data?: EmailTemplateData }>,
    templateName: string,
    customSubject?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.sendTemplateEmail(
        recipient.email,
        templateName,
        recipient.data || {},
        customSubject
      );

      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // ✅ Send notification
  async sendNotification(
  to: string | string[],
  title: string,
  message: string,
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM",
  data: EmailTemplateData = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const priorityEmoji = {
    CRITICAL: "🚨",
    HIGH: "⚡",
    MEDIUM: "📬",
    LOW: "📧",
  };

  const priorityColors = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#6b7280",
  };

  // Format the message with proper line breaks and HTML
  const formattedMessage = message
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 8px 0;">${line}</p>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d4a; }
        .header { padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #2d2d4a; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1)); }
        .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
        .subtitle { color: #94a3b8; font-size: 14px; margin-top: 4px; }
        .content { padding: 30px; }
        .footer { padding: 20px 30px; text-align: center; border-top: 1px solid #2d2d4a; color: #64748b; font-size: 12px; }
        .footer a { color: #818cf8; text-decoration: none; }
        .badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${priorityColors[priority]}20; color: ${priorityColors[priority]}; border: 1px solid ${priorityColors[priority]}40; margin-bottom: 12px; }
        .divider { border: none; height: 1px; background: linear-gradient(to right, transparent, #2d2d4a, transparent); margin: 20px 0; }
        .highlight { color: #818cf8; font-weight: 600; }
        .text-muted { color: #94a3b8; }
        .btn { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏆 Nexus Esports</div>
          <div class="subtitle">Premier eFootball League</div>
        </div>
        <div class="content">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge">${priorityEmoji[priority]} ${priority} Priority</span>
          </div>
          <h2 style="color: #fff; font-size: 20px; margin-bottom: 16px;">${title}</h2>
          ${formattedMessage}
          ${data.link ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${data.link}" class="btn">View Details →</a>
            </div>
          ` : ''}
          <hr class="divider">
          <div style="text-align: center; color: #94a3b8; font-size: 13px;">
            <p>Nexus Esports League • School eFootball Platform</p>
            <p style="margin-top: 8px; font-size: 12px; color: #64748b;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/settings/notifications" style="color: #818cf8; text-decoration: none;">Manage preferences</a>
              •
              <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #818cf8; text-decoration: none;">Privacy Policy</a>
            </p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexus Esports League</p>
          <p style="margin-top: 4px; font-size: 11px; color: #475569;">
            This message was sent to you as a registered member of Nexus Esports League.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${priorityEmoji[priority]} ${priority} Priority
${title}
${message.replace(/\n/g, '\n')}
${data.link ? `View Details: ${data.link}` : ''}
---
Nexus Esports League
Manage preferences: ${process.env.NEXTAUTH_URL}/dashboard/settings/notifications
`;

  return this.sendEmail({
    to,
    subject: `${priorityEmoji[priority]} ${title}`,
    html,
    text,
  });
}

  // ✅ Send password reset email
  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; padding: 40px; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 16px;">
            <span style="font-size: 28px;">🔑</span>
          </div>
          <h1 style="color: #fff; font-size: 24px; margin-top: 16px;">Nexus Esports</h1>
          <p style="color: #94a3b8; font-size: 14px;">Premier eFootball League</p>
        </div>

        <h2 style="color: #fff; font-size: 20px; margin-bottom: 16px;">Reset Your Password</h2>

        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Hi ${name},
        </p>
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
            Reset Password
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 24px;">
          This link expires in 1 hour.
        </p>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          If you didn't request this, you can ignore this email.
        </p>

        <div style="border-top: 1px solid #1e293b; margin-top: 32px; padding-top: 24px; text-align: center;">
          <p style="color: #475569; font-size: 12px;">
            Nexus Esports League • School eFootball Platform
          </p>
        </div>
      </div>
    `;

    const text = `
Reset Your Password

Hi ${name},

We received a request to reset your password. Click the link below to create a new password.

Reset your password: ${resetUrl}

This link expires in 1 hour.

If you didn't request this, you can ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: "🔑 Reset Your Password - Nexus Esports",
      html,
      text,
    });
  }

  // ✅ Send verification email
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; padding: 40px; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 16px;">
            <span style="font-size: 28px;">🔐</span>
          </div>
          <h1 style="color: #fff; font-size: 24px; margin-top: 16px;">Nexus Esports</h1>
          <p style="color: #94a3b8; font-size: 14px;">Premier eFootball League</p>
        </div>

        <h2 style="color: #fff; font-size: 20px; margin-bottom: 16px;">Verify Your Email</h2>

        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Hi ${name},
        </p>
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Please verify your email address to start receiving match notifications, tournament updates, and important announcements.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
            Verify Email
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 24px;">
          This link expires in 24 hours.
        </p>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          If you didn't create an account, you can ignore this email.
        </p>

        <div style="border-top: 1px solid #1e293b; margin-top: 32px; padding-top: 24px; text-align: center;">
          <p style="color: #475569; font-size: 12px;">
            Nexus Esports League • School eFootball Platform
          </p>
        </div>
      </div>
    `;

    const text = `
Verify Your Email

Hi ${name},

Please verify your email address to start receiving match notifications, tournament updates, and important announcements.

Verify your email: ${verifyUrl}

This link expires in 24 hours.

If you didn't create an account, you can ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: "🔐 Verify Your Email - Nexus Esports",
      html,
      text,
    });
  }

  // ✅ Send match reminder email
  async sendMatchReminder(
    email: string,
    name: string,
    match: any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const opponent = match.homePlayerId === match.userId 
      ? match.awayPlayer?.name || "Opponent" 
      : match.homePlayer?.name || "Opponent";
    const homeOrAway = match.homePlayerId === match.userId ? '🏠 Home' : '✈️ Away';
    const matchDate = new Date(match.scheduledDate).toLocaleString();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; padding: 40px; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 16px;">
            <span style="font-size: 28px;">⚽</span>
          </div>
          <h1 style="color: #fff; font-size: 24px; margin-top: 16px;">Nexus Esports</h1>
          <p style="color: #94a3b8; font-size: 14px;">Premier eFootball League</p>
        </div>

        <h2 style="color: #fff; font-size: 20px; margin-bottom: 16px;">Match Reminder</h2>

        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Hi ${name},
        </p>
        <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          You have a match tomorrow!
        </p>

        <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="color: #fff; margin: 8px 0;"><strong>Opponent:</strong> ${opponent}</p>
          <p style="color: #fff; margin: 8px 0;"><strong>Venue:</strong> ${homeOrAway}</p>
          <p style="color: #fff; margin: 8px 0;"><strong>Date:</strong> ${matchDate}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard/fixtures" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            View Match Details
          </a>
        </div>

        <div style="border-top: 1px solid #1e293b; margin-top: 32px; padding-top: 24px; text-align: center;">
          <p style="color: #475569; font-size: 12px;">
            Nexus Esports League • School eFootball Platform
          </p>
        </div>
      </div>
    `;

    const text = `
Match Reminder!

Hi ${name},

You have a match tomorrow!

Opponent: ${opponent}
Venue: ${homeOrAway}
Date: ${matchDate}

View Match Details: ${process.env.NEXTAUTH_URL}/dashboard/fixtures
    `;

    return this.sendEmail({
      to: email,
      subject: "⚽ Match Reminder - Nexus Esports",
      html,
      text,
    });
  }

  // ✅ Get match reminder time from user settings
  async getMatchReminderTime(userId: string): Promise<number> {
    try {
      const setting = await prisma.setting.findFirst({
        where: {
          userId,
          category: "competition",
          key: "matchReminderTime"
        }
      });

      if (setting) {
        const value = JSON.parse(setting.value);
        switch (value) {
          case "15m": return 15;
          case "30m": return 30;
          case "1h": return 60;
          case "2h": return 120;
          case "24h": return 1440;
          default: return 60;
        }
      }
      return 60;
    } catch (error) {
      console.error("Error getting match reminder time:", error);
      return 60;
    }
  }

  // ✅ Send match reminder with user preference
  async sendMatchReminderWithPreference(match: any): Promise<any[]> {
    const homePlayer = await prisma.user.findUnique({
      where: { id: match.homePlayerId }
    });
    const awayPlayer = await prisma.user.findUnique({
      where: { id: match.awayPlayerId }
    });

    const results = [];

    const homeReminderTime = await this.getMatchReminderTime(match.homePlayerId);
    const awayReminderTime = await this.getMatchReminderTime(match.awayPlayerId);

    // Send to home player
    if (homePlayer?.isVerified && homePlayer?.emailNotificationsEnabled) {
      const matchTime = new Date(match.scheduledDate).getTime();
      const now = Date.now();
      const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);

      if (hoursUntilMatch * 60 <= homeReminderTime) {
        const result = await this.sendMatchReminder(
          homePlayer.email,
          homePlayer.name || "Player",
          {
            ...match,
            userId: homePlayer.id,
            awayPlayer: awayPlayer
          }
        );
        results.push(result);
      }
    }

    // Send to away player
    if (awayPlayer?.isVerified && awayPlayer?.emailNotificationsEnabled) {
      const matchTime = new Date(match.scheduledDate).getTime();
      const now = Date.now();
      const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);

      if (hoursUntilMatch * 60 <= awayReminderTime) {
        const result = await this.sendMatchReminder(
          awayPlayer.email,
          awayPlayer.name || "Player",
          {
            ...match,
            userId: awayPlayer.id,
            homePlayer: homePlayer
          }
        );
        results.push(result);
      }
    }

    return results;
  }

  // ✅ Send daily digest
  async sendDailyDigest(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user) return { success: false, count: 0 };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gte: yesterday },
          read: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (notifications.length === 0) {
        return { success: true, count: 0 };
      }

      const html = this.buildDigestHTML(user, notifications, "Daily");

      await this.sendEmail({
        to: user.email,
        subject: `📊 Daily Digest - ${new Date().toLocaleDateString()}`,
        html,
      });

      return { success: true, count: notifications.length };
    } catch (error) {
      console.error("❌ Failed to send daily digest:", error);
      return { success: false, count: 0 };
    }
  }

  // ✅ Send weekly digest
  async sendWeeklyDigest(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user) return { success: false, count: 0 };

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gte: weekAgo },
          read: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (notifications.length === 0) {
        return { success: true, count: 0 };
      }

      const html = this.buildDigestHTML(user, notifications, "Weekly");

      await this.sendEmail({
        to: user.email,
        subject: `📊 Weekly Digest - ${new Date().toLocaleDateString()}`,
        html,
      });

      return { success: true, count: notifications.length };
    } catch (error) {
      console.error("❌ Failed to send weekly digest:", error);
      return { success: false, count: 0 };
    }
  }

  // ✅ Build digest HTML
  private buildDigestHTML(user: any, notifications: any[], type: string): string {
    const grouped = notifications.reduce((acc: any, n: any) => {
      const priority = n.priorityLevel || "MEDIUM";
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push(n);
      return acc;
    }, {});

    const priorityColors: Record<string, string> = {
      CRITICAL: "#ef4444",
      HIGH: "#f97316",
      MEDIUM: "#eab308",
      LOW: "#6b7280",
    };

    const priorityEmojis: Record<string, string> = {
      CRITICAL: "🚨",
      HIGH: "⚡",
      MEDIUM: "📬",
      LOW: "📧",
    };

    let contentHtml = "";

    for (const [priority, items] of Object.entries(grouped)) {
      contentHtml += `
        <div style="margin: 16px 0;">
          <h3 style="color: ${priorityColors[priority]}; margin-bottom: 8px;">
            ${priorityEmojis[priority] || "📌"} ${priority} (${(items as any[]).length})
          </h3>
          ${(items as any[]).map((n: any) => `
            <div style="padding: 8px 12px; background: #1e293b; border-radius: 8px; margin-bottom: 6px; border-left: 3px solid ${priorityColors[priority]};">
              <div style="font-weight: 500; color: #fff;">${n.title}</div>
              <div style="font-size: 13px; color: #94a3b8;">${n.message}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${new Date(n.createdAt).toLocaleString()}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${type} Digest</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #fff; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #1e293b; }
          .logo { font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .subtitle { color: #94a3b8; font-size: 14px; }
          .content { padding: 20px 0; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #1e293b; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏆 Nexus Esports</div>
            <div class="subtitle">${type} Digest - ${new Date().toLocaleDateString()}</div>
            <div style="color: #94a3b8; font-size: 14px;">Hello ${user.profile?.username || user.name || "Player"}!</div>
          </div>
          <div class="content">
            <p style="color: #cbd5e1;">You have <strong style="color: #fff;">${notifications.length}</strong> new notifications.</p>
            ${contentHtml}
          </div>
          <div class="footer">
            <p>Nexus Esports League</p>
            <p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/settings/notifications" style="color: #818cf8; text-decoration: none;">Manage preferences</a>
            </p>
            <p>© ${new Date().getFullYear()} Nexus Esports. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ✅ Get user by email
  private async getUserByEmail(email: string): Promise<any> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: { 
          profile: true,
          notificationPreference: true,
        },
      });
    } catch (error) {
      return null;
    }
  }

  // ✅ Test email connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: "Email transporter not initialized" };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: "SMTP connection verified!" };
    } catch (error: any) {
      return { success: false, message: error.message || "Connection failed" };
    }
  }
}

export const emailService = new EmailService();