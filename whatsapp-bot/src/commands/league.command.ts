// ============================================= //
// ✅ LEAGUE COMMAND — LEAGUE SEASON INFO       //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.league");

export const leagueCommand: CommandHandler = {
  definition: {
    name: "league",
    description: "View league season information and stats",
    usage: ".league",
    minRoleLevel: 1,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    try {
      const client = getNexusClient();

      // Get seasons and league data
      const [seasonsData, tableData] = await Promise.allSettled([
        client.getSeasons(),
        client.getStandings(),
      ]);

      const seasons = seasonsData.status === "fulfilled"
        ? (Array.isArray(seasonsData.value) ? seasonsData.value : seasonsData.value?.seasons || [])
        : [];

      const entries = tableData.status === "fulfilled"
        ? (Array.isArray(tableData.value) ? tableData.value : tableData.value?.entries || tableData.value?.standings || [])
        : [];

      const activeSeason = Array.isArray(seasons)
        ? seasons.find((s: any) => s.isActive)
        : null;

      if (!activeSeason) {
        return {
          to: message.senderJid,
          text: "🏟️ *No active league season.*\n\nThe league is currently in off-season. Check back when a new season starts!",
        };
      }

      const totalPlayers = Array.isArray(entries) ? entries.length : 0;
      const totalMatches = Array.isArray(entries)
        ? entries.reduce((sum: number, e: any) => sum + (e.played || e.matchesPlayed || 0), 0)
        : 0;
      const seasonEnd = activeSeason.endDate
        ? new Date(activeSeason.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
        : "TBD";

      let response = "╔══════════════════════════════╗\n";
      response += "║       *🏟️ LEAGUE INFO*        ║\n";
      response += "╚══════════════════════════════╝\n\n";
      response += `*${activeSeason.name}*\n`;
      response += `${activeSeason.description || "Nexus Esports League"}\n\n`;
      response += `📅 *Status:* ${activeSeason.status}\n`;
      response += `👥 *Players:* ${totalPlayers}\n`;
      response += `⚔️ *Matches Played:* ${Math.floor(totalMatches / 2)}\n`;
      response += `🏁 *Season Ends:* ${seasonEnd}\n`;
      response += `📅 *Started:* ${new Date(activeSeason.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}\n`;

      response += `\n_Use \`.standings\` or \`.table\` to view the full league table._`;

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "League command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch league info. Nexus platform may be unreachable.",
      };
    }
  },
};
