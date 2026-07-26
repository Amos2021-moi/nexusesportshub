// ============================================= //
// ✅ RESULTS COMMAND — RECENT MATCH RESULTS    //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.results");

export const resultsCommand: CommandHandler = {
  definition: {
    name: "results",
    description: "View recent match results",
    usage: ".results",
    minRoleLevel: 1,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    try {
      const client = getNexusClient();
      const data = await client.getResults();
      const results = Array.isArray(data) ? data : data?.results || data?.data || data || [];

      if (!Array.isArray(results) || results.length === 0) {
        return {
          to: message.senderJid,
          text: "📊 *No match results available.*\n\nNo results have been submitted yet.",
        };
      }

      const recent = results
        .filter((r: any) => r.approved || r.homeScore != null)
        .slice(0, 10);

      if (recent.length === 0) {
        return {
          to: message.senderJid,
          text: "📊 *No approved results yet.*\n\nSubmitted results are pending approval.",
        };
      }

      let response = "╔══════════════════════════════╗\n";
      response += "║       *📊 RECENT RESULTS*     ║\n";
      response += "╚══════════════════════════════╝\n\n";

      for (const r of recent) {
        const fixture = r.fixture || r.tournamentMatch || {};
        const home = fixture.homePlayer?.name || fixture.homePlayer?.profile?.username || "Home";
        const away = fixture.awayPlayer?.name || fixture.awayPlayer?.profile?.username || "Away";
        const score = `${r.homeScore ?? "?"} - ${r.awayScore ?? "?"}`;
        const status = r.approved ? "✅ Approved" : "⏳ Pending";
        const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "";
        const type = fixture.tournamentId ? "🏆 Tournament" : "🏟️ League";

        response += `*${home}* ${score} *${away}*\n`;
        response += `  ${type} | ${status} | ${date}\n\n`;
      }

      response += `_Showing ${recent.length} recent results._`;

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "Results command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch results. Nexus platform may be unreachable.",
      };
    }
  },
};
