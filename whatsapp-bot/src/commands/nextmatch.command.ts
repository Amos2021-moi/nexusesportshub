// ============================================= //
// ✅ NEXTMATCH COMMAND — NEXT SCHEDULED MATCH  //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.nextmatch");

export const nextMatchCommand: CommandHandler = {
  definition: {
    name: "nextmatch",
    description: "View your next scheduled match",
    usage: ".nextmatch",
    minRoleLevel: 1,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    try {
      const client = getNexusClient();
      const data = await client.getFixtures();
      const fixtures = data?.fixtures || data || [];

      if (!Array.isArray(fixtures) || fixtures.length === 0) {
        return {
          to: message.senderJid,
          text: "📅 *No matches scheduled.*\n\nThere are no upcoming matches at this time.",
        };
      }

      // Find the next upcoming SCHEDULED fixture (soonest date)
      const now = new Date();
      const upcoming = fixtures
        .filter((f: any) => f.status === "SCHEDULED")
        .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      const next = upcoming[0];

      if (!next) {
        return {
          to: message.senderJid,
          text: "📅 *No upcoming matches.*\n\nAll scheduled matches have been completed or no future fixtures exist.",
        };
      }

      const home = next.homePlayer?.name || next.homePlayer?.profile?.username || "TBD";
      const away = next.awayPlayer?.name || next.awayPlayer?.profile?.username || "TBD";
      const date = next.scheduledDate
        ? new Date(next.scheduledDate).toLocaleDateString("en-KE", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })
        : "Date TBD";
      const season = next.season?.name || "Current Season";

      const daysUntil = next.scheduledDate
        ? Math.ceil((new Date(next.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let response = "╔══════════════════════════════╗\n";
      response += "║     *📅 NEXT MATCH*           ║\n";
      response += "╚══════════════════════════════╝\n\n";
      response += `*${home}* 🆚 *${away}*\n\n`;
      response += `📆 *Date:* ${date}\n`;
      response += `🏟️ *Season:* ${season}\n`;
      response += `🔄 *Status:* ${next.status}\n`;

      if (daysUntil !== null) {
        if (daysUntil === 0) {
          response += `\n⚡ *Match is today!* Get ready!`;
        } else if (daysUntil === 1) {
          response += `\n⏰ *Match is tomorrow!*`;
        } else if (daysUntil > 0) {
          response += `\n⏰ *${daysUntil} days until match*`;
        }
      }

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "Nextmatch command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch next match. Nexus platform may be unreachable.",
      };
    }
  },
};
