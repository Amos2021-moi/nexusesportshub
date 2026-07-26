// ============================================= //
// ✅ STANDINGS COMMAND — LEAGUE TABLE           //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.standings");

export const standingsCommand: CommandHandler = {
  definition: {
    name: "standings",
    description: "View the current league table",
    usage: ".standings",
    minRoleLevel: 1,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    try {
      const client = getNexusClient();
      const data = await client.getStandings();
      const entries = Array.isArray(data) ? data : data?.entries || data?.standings || data || [];

      if (!Array.isArray(entries) || entries.length === 0) {
        return {
          to: message.senderJid,
          text: "🏟️ *No league standings available.*\n\nThe league table has not been generated yet.",
        };
      }

      const sorted = [...entries].sort((a: any, b: any) => {
        const ptsA = a.points || a.totalPoints || 0;
        const ptsB = b.points || b.totalPoints || 0;
        if (ptsB !== ptsA) return ptsB - ptsA;
        const gdA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const gdB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
        return gdB - gdA;
      });

      const top = sorted.slice(0, 15);

      let response = "╔══════════════════════════════╗\n";
      response += "║      *🏟️ LEAGUE TABLE*        ║\n";
      response += "╚══════════════════════════════╝\n\n";
      response += "```\n";
      response += "#  Team                   P   W   D   L   Pts\n";
      response += "─".repeat(45) + "\n";

      top.forEach((entry: any, i: number) => {
        const name = entry.player?.name || entry.player?.profile?.username || entry.name || `Player ${i + 1}`;
        const p = entry.played || entry.matchesPlayed || 0;
        const w = entry.wins || 0;
        const d = entry.draws || 0;
        const l = entry.losses || 0;
        const pts = entry.points || entry.totalPoints || 0;
        const pos = (i + 1).toString().padStart(2);
        const paddedName = name.length > 18 ? name.substring(0, 16) + ".." : name.padEnd(18);
        response += `${pos}  ${paddedName} ${p.toString().padStart(3)} ${w.toString().padStart(3)} ${d.toString().padStart(3)} ${l.toString().padStart(3)} ${pts.toString().padStart(4)}\n`;
      });

      response += "```\n";
      response += `_Top ${top.length} of ${sorted.length} players shown._`;

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "Standings command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch standings. Nexus platform may be unreachable.",
      };
    }
  },
};
