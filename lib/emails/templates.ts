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

interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

// ✅ Base HTML template wrapper
function baseTemplate(content: string, title: string): string {
  return `
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
    .btn { display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #6366f1; color: #fff; margin-bottom: 12px; }
    .divider { border: none; height: 1px; background: linear-gradient(to right, transparent, #2d2d4a, transparent); margin: 20px 0; }
    .highlight { color: #818cf8; font-weight: 600; }
    .text-muted { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏆 Nexus Esports</div>
      <div class="subtitle">Premier eFootball League</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Nexus Esports League • School eFootball Platform</p>
      <p style="margin-top: 4px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/settings/notifications">Manage preferences</a>
        •
        <a href="${process.env.NEXTAUTH_URL}/privacy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// ✅ Render email template
export async function renderEmailTemplate(
  templateName: string,
  data: EmailTemplateData
): Promise<EmailTemplateResult> {
  let subject = "";
  let htmlContent = "";
  let textContent = "";

  switch (templateName) {
    case "verification":
      subject = "🔐 Verify Your Email - Nexus Esports";
      htmlContent = verificationTemplate(data);
      textContent = verificationText(data);
      break;

    case "reset-password":
      subject = "🔑 Reset Your Password - Nexus Esports";
      htmlContent = resetPasswordTemplate(data);
      textContent = resetPasswordText(data);
      break;

    case "match-result":
      subject = `🏆 Match Result ${data.homeScore !== undefined ? `${data.homeScore} - ${data.awayScore}` : ''}`;
      htmlContent = matchResultTemplate(data);
      textContent = matchResultText(data);
      break;

    case "new-fixture":
      subject = `📅 New Fixture: ${data.homePlayer} vs ${data.awayPlayer}`;
      htmlContent = newFixtureTemplate(data);
      textContent = newFixtureText(data);
      break;

    case "tournament-start":
      subject = `🏆 Tournament Starts Tomorrow: ${data.tournamentName}`;
      htmlContent = tournamentStartTemplate(data);
      textContent = tournamentStartText(data);
      break;

    case "tournament-end":
      subject = `🏆 Tournament Completed: ${data.tournamentName}`;
      htmlContent = tournamentEndTemplate(data);
      textContent = tournamentEndText(data);
      break;

    case "award":
      subject = `🎖️ Congratulations! You Won ${data.awardName}`;
      htmlContent = awardTemplate(data);
      textContent = awardText(data);
      break;

    case "notification":
      subject = `📬 ${data.title || 'New Notification'}`;
      htmlContent = notificationTemplate(data);
      textContent = notificationText(data);
      break;

    case "daily-digest":
      subject = `📊 Daily Digest - ${new Date().toLocaleDateString()}`;
      htmlContent = digestTemplate(data, "Daily");
      textContent = digestText(data, "Daily");
      break;

    case "weekly-digest":
      subject = `📊 Weekly Digest - ${new Date().toLocaleDateString()}`;
      htmlContent = digestTemplate(data, "Weekly");
      textContent = digestText(data, "Weekly");
      break;

    default:
      subject = "📬 Nexus Esports Notification";
      htmlContent = notificationTemplate(data);
      textContent = notificationText(data);
  }

  return {
    subject,
    html: baseTemplate(htmlContent, subject),
    text: textContent,
  };
}

// ============================================
// TEMPLATE FUNCTIONS
// ============================================

// ✅ Verification Email
function verificationTemplate(data: EmailTemplateData): string {
  return `
    <h2>Welcome to Nexus Esports, ${data.name || "Player"}! 🎮</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">Thanks for joining the Nexus Esports League. Please verify your email address to get started.</p>
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">Verify Email Address</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px;">This link expires in 24 hours.</p>
    <hr class="divider">
    <p style="color: #64748b; font-size: 13px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;
}

function verificationText(data: EmailTemplateData): string {
  return `
Welcome to Nexus Esports, ${data.name || "Player"}!

Thanks for joining the Nexus Esports League. Please verify your email address to get started.

Verify your email here: ${data.link}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.
  `;
}

// ✅ Reset Password Email
function resetPasswordTemplate(data: EmailTemplateData): string {
  return `
    <h2>Reset Your Password 🔑</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">Reset Password</a>
    </div>
    <p style="color: #94a3b8; font-size: 14px;">This link expires in 1 hour.</p>
    <hr class="divider">
    <p style="color: #64748b; font-size: 13px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `;
}

function resetPasswordText(data: EmailTemplateData): string {
  return `
Reset Your Password

We received a request to reset your password. Click the link below to create a new password.

Reset your password: ${data.link}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.
  `;
}

// ✅ Match Result Email
function matchResultTemplate(data: EmailTemplateData): string {
  const isApproved = data.customMessage?.includes("approved");
  return `
    <div style="text-align: center;">
      <span class="badge">${isApproved ? '✅ Approved' : '📋 Pending'}</span>
    </div>
    <h2>🏆 Match Result</h2>
    <div style="background: #2d2d4a; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
        <div>
          <div style="font-size: 18px; font-weight: 600; color: #fff;">${data.homePlayer}</div>
          <div style="font-size: 32px; font-weight: 800; color: #818cf8;">${data.homeScore}</div>
        </div>
        <div style="font-size: 20px; font-weight: 700; color: #64748b;">VS</div>
        <div>
          <div style="font-size: 18px; font-weight: 600; color: #fff;">${data.awayPlayer}</div>
          <div style="font-size: 32px; font-weight: 800; color: #818cf8;">${data.awayScore}</div>
        </div>
      </div>
    </div>
    <p style="color: #cbd5e1; line-height: 1.6;">
      ${data.customMessage || `Match result has been ${isApproved ? 'approved' : 'submitted and is pending approval'}.`}
    </p>
    ${data.link ? `
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">View Match Details</a>
    </div>
    ` : ''}
  `;
}

function matchResultText(data: EmailTemplateData): string {
  return `
🏆 Match Result

${data.homePlayer} ${data.homeScore} - ${data.awayScore} ${data.awayPlayer}

${data.customMessage || 'Match result has been submitted.'}

${data.link ? `View Match Details: ${data.link}` : ''}
  `;
}

// ✅ New Fixture Email
function newFixtureTemplate(data: EmailTemplateData): string {
  return `
    <h2>📅 New Fixture</h2>
    <div style="background: #2d2d4a; border-radius: 12px; padding: 20px; margin: 16px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 16px; font-weight: 600; color: #fff;">${data.homePlayer}</div>
          <div style="font-size: 14px; color: #94a3b8;">🏠 Home</div>
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #64748b; padding: 0 16px;">VS</div>
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 16px; font-weight: 600; color: #fff;">${data.awayPlayer}</div>
          <div style="font-size: 14px; color: #94a3b8;">✈️ Away</div>
        </div>
      </div>
    </div>
    <p style="color: #cbd5e1; line-height: 1.6;">
      📆 <strong style="color: #fff;">${data.fixtureDate}</strong>
    </p>
    <p style="color: #cbd5e1; line-height: 1.6;">
      Season: <strong style="color: #fff;">${data.seasonName || 'Current'}</strong>
    </p>
    ${data.link ? `
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">View Fixture Details</a>
    </div>
    ` : ''}
  `;
}

function newFixtureText(data: EmailTemplateData): string {
  return `
📅 New Fixture

${data.homePlayer} vs ${data.awayPlayer}
📆 ${data.fixtureDate}
Season: ${data.seasonName || 'Current'}

${data.link ? `View Fixture Details: ${data.link}` : ''}
  `;
}

// ✅ Tournament Start Email
function tournamentStartTemplate(data: EmailTemplateData): string {
  return `
    <div style="text-align: center;">
      <span class="badge">🏆 Tournament</span>
    </div>
    <h2>${data.tournamentName} Starts Tomorrow!</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">
      Get ready! The tournament starts <strong style="color: #fff;">${data.fixtureDate || 'tomorrow'}</strong>.
    </p>
    <div style="background: #2d2d4a; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="color: #94a3b8; margin: 0;">🏆 Format: ${data.customMessage || 'Single Elimination'}</p>
    </div>
    ${data.link ? `
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">View Bracket</a>
    </div>
    ` : ''}
  `;
}

function tournamentStartText(data: EmailTemplateData): string {
  return `
🏆 ${data.tournamentName} Starts Tomorrow!

Get ready! The tournament starts ${data.fixtureDate || 'tomorrow'}.

Format: ${data.customMessage || 'Single Elimination'}

${data.link ? `View Bracket: ${data.link}` : ''}
  `;
}

// ✅ Tournament End Email
function tournamentEndTemplate(data: EmailTemplateData): string {
  return `
    <div style="text-align: center;">
      <span class="badge">🏆 Completed</span>
    </div>
    <h2>${data.tournamentName} Has Ended!</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">
      Congratulations to all participants! <strong style="color: #fff;">${data.winnerName || 'The champion'}</strong> takes the crown!
    </p>
    ${data.link ? `
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">View Final Results</a>
    </div>
    ` : ''}
  `;
}

function tournamentEndText(data: EmailTemplateData): string {
  return `
🏆 ${data.tournamentName} Has Ended!

Congratulations to ${data.winnerName || 'the champion'}!

${data.link ? `View Final Results: ${data.link}` : ''}
  `;
}

// ✅ Award Email
function awardTemplate(data: EmailTemplateData): string {
  return `
    <div style="text-align: center;">
      <span class="badge">🎖️ Congratulations!</span>
    </div>
    <h2>You Won "${data.awardName}"!</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">
      ${data.customMessage || `You've been awarded the ${data.awardName} award for your outstanding performance!`}
    </p>
    ${data.link ? `
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">View Your Awards</a>
    </div>
    ` : ''}
  `;
}

function awardText(data: EmailTemplateData): string {
  return `
🎖️ Congratulations!

You Won "${data.awardName}"!

${data.customMessage || `You've been awarded the ${data.awardName} award for your outstanding performance!`}

${data.link ? `View Your Awards: ${data.link}` : ''}
  `;
}

// ✅ Generic Notification
function notificationTemplate(data: EmailTemplateData): string {
  const priorityEmojis: Record<string, string> = {
    CRITICAL: "🚨",
    HIGH: "⚡",
    MEDIUM: "📬",
    LOW: "📧",
  };
  const emoji = data.priority ? priorityEmojis[data.priority] || "📬" : "📬";

  return `
    ${data.priority ? `
    <div style="text-align: center;">
      <span class="badge">${emoji} ${data.priority}</span>
    </div>
    ` : ''}
    <h2>${data.title || 'New Notification'}</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">${data.customMessage || data.message || 'You have a new notification.'}</p>
    ${data.link ? `
    <div style="text-align: center;">
      <a href="${data.link}" class="btn">View Details</a>
    </div>
    ` : ''}
  `;
}

function notificationText(data: EmailTemplateData): string {
  return `
${data.title || 'New Notification'}

${data.customMessage || data.message || 'You have a new notification.'}

${data.link ? `View Details: ${data.link}` : ''}
  `;
}

// ✅ Digest Email
function digestTemplate(data: EmailTemplateData, type: string): string {
  const notifications = data.notifications || [];
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
        <h3 style="color: ${priorityColors[priority]}; margin-bottom: 8px; font-size: 16px;">
          ${priorityEmojis[priority] || "📌"} ${priority} (${(items as any[]).length})
        </h3>
        ${(items as any[]).map((n: any) => `
          <div style="padding: 10px 14px; background: #2d2d4a; border-radius: 8px; margin-bottom: 6px; border-left: 3px solid ${priorityColors[priority]};">
            <div style="font-weight: 500; color: #fff; font-size: 14px;">${n.title}</div>
            <div style="font-size: 13px; color: #94a3b8;">${n.message}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  return `
    <div style="text-align: center;">
      <span class="badge">📊 ${type} Digest</span>
    </div>
    <h2>Hello ${data.name || "Player"}! 👋</h2>
    <p style="color: #cbd5e1; line-height: 1.6;">
      Here's your ${type.toLowerCase()} summary of notifications.
    </p>
    <p style="color: #cbd5e1; font-size: 14px;">
      You have <strong style="color: #fff;">${notifications.length}</strong> new notification${notifications.length !== 1 ? 's' : ''}.
    </p>
    ${contentHtml}
    <hr class="divider">
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/dashboard/notifications" style="color: #818cf8; text-decoration: none;">View All →</a>
    </div>
  `;
}

function digestText(data: EmailTemplateData, type: string): string {
  const notifications = data.notifications || [];
  let text = `
📊 ${type} Digest

Hello ${data.name || "Player"}!

Here's your ${type.toLowerCase()} summary of notifications.
You have ${notifications.length} new notification${notifications.length !== 1 ? 's' : ''}.

`;

  const grouped = notifications.reduce((acc: any, n: any) => {
    const priority = n.priorityLevel || "MEDIUM";
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(n);
    return acc;
  }, {});

  for (const [priority, items] of Object.entries(grouped)) {
    text += `\n${priority} (${(items as any[]).length})\n`;
    (items as any[]).forEach((n: any) => {
      text += `  • ${n.title}\n`;
    });
  }

  text += `\nView All: ${process.env.NEXTAUTH_URL}/dashboard/notifications`;
  return text;
}