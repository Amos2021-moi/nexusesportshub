// ============================================= //
// ✅ FIXTURES COMMAND — UPCOMING MATCHES       //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.fixtures");

export const fixturesCommand: CommandHandler = {
  definition: {
    name: "fixtures",
    description: "View upcoming scheduled matches",
    usage: ".fixtures",
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
          text: "📅 *No upcoming fixtures found.*\n\nNo matches are currently scheduled. Check back later!",
        };
      }

      const upcoming = fixtures
        .filter((f: any) => f.status === "SCHEDULED")
        .slice(0, 10);

      if (upcoming.length === 0) {
        return {
          to: message.senderJid,
          text: "📅 *No upcoming fixtures.*\n\nAll current matches have been played.",
        };
      }

      let response = "╔══════════════════════════════╗\n";
      response += "║     *📅 UPCOMING FIXTURES*    ║\n";
      response += "╚══════════════════════════════╝\n\n";

      for (const f of upcoming) {
        const home = f.homePlayer?.name || f.homePlayer?.profile?.username || "TBD";
        const away = f.awayPlayer?.name || f.awayPlayer?.profile?.username || "TBD";
        const date = f.scheduledDate
          ? new Date(f.scheduledDate).toLocaleDateString("en-KE", {
              weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })
          : "Date TBD";
        response += `*${home}* 🆚 *${away}*\n`;
        response += `  📆 ${date} | 🔄 ${f.status}\n\n`;
      }

      response += `_Showing ${upcoming.length} of ${fixtures.length} fixtures._`;

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "Fixtures command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch fixtures. Nexus platform may be unreachable.\n\n_Ensure the bot is properly connected to the Nexus API._",
      };
    }
  },
};
