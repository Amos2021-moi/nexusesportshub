import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/services/email.service";
import { smartNotificationService } from "@/lib/services/smartNotification.service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channel, recipients, subject, message, attachments } = body;

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    if (!channel || !["EMAIL", "IN_APP", "BOTH"].includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel. Must be EMAIL, IN_APP, or BOTH" },
        { status: 400 }
      );
    }

    // Determine recipient type
    const recipientType = recipients === "all" ? "ALL" : "SPECIFIC";
    const recipientIds = recipients === "all" ? [] : recipients;

    // Get the list of users to send to
    let users: any[] = [];
    if (recipients === "all") {
      users = await prisma.user.findMany({
        where: {
          role: "PLAYER",
        },
        include: {
          profile: true,
        },
      });
    } else if (Array.isArray(recipients) && recipients.length > 0) {
      users = await prisma.user.findMany({
        where: {
          id: { in: recipients },
          role: "PLAYER",
        },
        include: {
          profile: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "No recipients selected" },
        { status: 400 }
      );
    }

    // Create communication log
    const log = await prisma.communicationLog.create({
      data: {
        adminId: session.user.id,
        subject,
        message,
        channel,
        recipientType,
        recipientIds: recipientIds,
        recipientCount: users.length,
        status: "PENDING",
        metadata: {
          channel,
          totalRecipients: users.length,
        },
      },
    });

    // Save attachments if any
    const savedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        const saved = await prisma.communicationAttachment.create({
          data: {
            logId: log.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            fileType: att.fileType,
            fileUrl: att.fileUrl,
            mimeType: att.mimeType || att.fileType,
          },
        });
        savedAttachments.push(saved);
      }
    }

    // Send messages based on channel
    const results = {
      email: { sent: 0, failed: 0, skipped: 0 },
      inApp: { sent: 0, failed: 0, skipped: 0 },
    };

    const sendEmail = channel === "EMAIL" || channel === "BOTH";
    const sendInApp = channel === "IN_APP" || channel === "BOTH";

    // Get base URL for download links
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    for (const user of users) {
      const receiptData = {
        logId: log.id,
        userId: user.id,
      };

      // Send Email
      if (sendEmail) {
        try {
          if (user.emailNotificationsEnabled && user.emailVerified) {
            // Build email HTML with proper formatting
            const formattedMessage = message
              .split('\n')
              .filter((line: string) => line.trim())
              .map((line: string) => `<p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 8px 0;">${line}</p>`)
              .join('');

            // Build attachment section with download API links
            let attachmentHtml = '';
            if (savedAttachments.length > 0) {
              attachmentHtml = `
                <hr class="divider">
                <div style="background: #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0;">
                  <p style="color: #94a3b8; font-size: 13px; margin-bottom: 12px;">📎 Attachments (${savedAttachments.length}) - Click to download</p>
                  ${savedAttachments.map(att => `
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border-radius: 8px; margin-bottom: 6px; border: 1px solid #2d2d4a;">
                      <span style="color: #94a3b8;">📄</span>
                      <span style="color: #cbd5e1; font-size: 13px;">${att.fileName}</span>
                      <span style="color: #475569; font-size: 11px; margin-left: auto;">${(att.fileSize / 1024).toFixed(1)} KB</span>
                      <a href="${baseUrl}/api/admin/communication/download/${att.id}" style="background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; margin-left: 8px; border: none; cursor: pointer;">⬇️ Download</a>
                    </div>
                  `).join('')}
                </div>
              `;
            }

            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
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
                  .badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #6366f120; color: #818cf8; border: 1px solid #6366f140; margin-bottom: 12px; }
                  .divider { border: none; height: 1px; background: linear-gradient(to right, transparent, #2d2d4a, transparent); margin: 20px 0; }
                  .download-btn { display: inline-block; background: #6366f1; color: white; padding: 6px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; margin-left: 8px; border: none; cursor: pointer; }
                  .download-btn:hover { background: #4f46e5; }
                  .attachments-section { background: #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0; }
                  .attachment-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border-radius: 8px; margin-bottom: 6px; border: 1px solid #2d2d4a; }
                  .attachment-item:last-child { margin-bottom: 0; }
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
                      <span class="badge">📨 Admin Message</span>
                    </div>
                    <h2 style="color: #fff; font-size: 20px; margin-bottom: 16px;">${subject}</h2>
                    ${formattedMessage}
                    ${attachmentHtml}
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

            const emailResult = await emailService.sendEmail({
              to: user.email,
              subject: `📨 ${subject}`,
              html: emailHtml,
              text: message,
            });

            if (emailResult.success) {
              results.email.sent++;
              await prisma.communicationReceipt.create({
                data: {
                  ...receiptData,
                  channel: "EMAIL",
                  status: "SENT",
                },
              });
            } else {
              results.email.failed++;
              await prisma.communicationReceipt.create({
                data: {
                  ...receiptData,
                  channel: "EMAIL",
                  status: "FAILED",
                  error: emailResult.error || "Email send failed",
                },
              });
            }
          } else {
            results.email.skipped++;
            await prisma.communicationReceipt.create({
              data: {
                ...receiptData,
                channel: "EMAIL",
                status: "FAILED",
                error: user.emailNotificationsEnabled
                  ? "Email not verified"
                  : "Email notifications disabled",
              },
            });
          }
        } catch (error: any) {
          results.email.failed++;
          console.error("Email send error for user:", user.id, error.message);
          await prisma.communicationReceipt.create({
            data: {
              ...receiptData,
              channel: "EMAIL",
              status: "FAILED",
              error: error.message || "Email send error",
            },
          });
        }
      }

      // Send In-App Notification
      if (sendInApp) {
        try {
          const attachmentNote = savedAttachments.length > 0 
            ? `\n\n📎 Attachments: ${savedAttachments.length} file(s) included. Check your email to view them.` 
            : '';

          const notification = await smartNotificationService.createNotification(
            user.id,
            "ADMIN_ALERT",
            subject,
            message + attachmentNote,
            { 
              adminId: session.user.id,
              hasAttachments: savedAttachments.length > 0,
              attachmentCount: savedAttachments.length,
            },
            null,
            "IN_APP"
          );

          if (notification) {
            results.inApp.sent++;
            await prisma.communicationReceipt.create({
              data: {
                ...receiptData,
                channel: "IN_APP",
                status: "DELIVERED",
              },
            });
          } else {
            results.inApp.failed++;
            await prisma.communicationReceipt.create({
              data: {
                ...receiptData,
                channel: "IN_APP",
                status: "FAILED",
                error: "Failed to create notification",
              },
            });
          }
        } catch (error: any) {
          results.inApp.failed++;
          console.error("In-App notification error for user:", user.id, error.message);
          await prisma.communicationReceipt.create({
            data: {
              ...receiptData,
              channel: "IN_APP",
              status: "FAILED",
              error: error.message || "Notification creation failed",
            },
          });
        }
      }
    }

    // Update log status
    const totalSends =
      (sendEmail ? results.email.sent + results.email.failed + results.email.skipped : 0) +
      (sendInApp ? results.inApp.sent + results.inApp.failed + results.inApp.skipped : 0);

    let logStatus = "SENT";
    if (totalSends > 0) {
      const totalFailures =
        (sendEmail ? results.email.failed : 0) +
        (sendInApp ? results.inApp.failed : 0);
      if (totalFailures === totalSends) {
        logStatus = "FAILED";
      } else if (totalFailures > 0) {
        logStatus = "PARTIAL";
      }
    }

    const existingMetadata = typeof log.metadata === "object" && log.metadata !== null ? log.metadata : {};

    await prisma.communicationLog.update({
      where: { id: log.id },
      data: {
        status: logStatus,
        deliveredAt: new Date(),
        metadata: {
          ...existingMetadata,
          results,
          attachments: savedAttachments.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      logId: log.id,
      message: `Message sent to ${users.length} players`,
      stats: {
        totalRecipients: users.length,
        email: results.email,
        inApp: results.inApp,
        attachments: savedAttachments.length,
      },
    });

  } catch (error) {
    console.error("Error sending communication:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    );
  }
}