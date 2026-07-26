// ============================================= //
// ✅ TABLE COMMAND — FULL LEAGUE TABLE         //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.table");

export const tableCommand: CommandHandler = {
  definition: {
    name: "table",
    description: "View the full league standings with goal difference and form",
    usage: ".table",
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
          text: "🏟️ *No league table available.*\n\nThe table has not been generated yet.",
        };
      }

      // Sort by points, then GD, then goals scored
      const sorted = [...entries].sort((a: any, b: any) => {
        const ptsA = a.points || a.totalPoints || 0;
        const ptsB = b.points || b.totalPoints || 0;
        if (ptsB !== ptsA) return ptsB - ptsA;
        const gdA = (a.goalsFor || 0) - (a.goalsAgainst || 0);
        const gdB = (b.goalsFor || 0) - (b.goalsAgainst || 0);
        if (gdB !== gdA) return gdB - gdA;
        return (b.goalsFor || 0) - (a.goalsFor || 0);
      });

      const top = sorted.slice(0, 20);

      let response = "╔══════════════════════════════╗\n";
      response += "║    *🏟️ FULL LEAGUE TABLE*    ║\n";
      response += "╚══════════════════════════════╝\n\n";

      response += "```\n";
      response += "#  Team                 P   W   D   L   GF  GA  GD  Pts\n";
      response += "─".repeat(55) + "\n";

      top.forEach((entry: any, i: number) => {
        const name = entry.player?.name || entry.player?.profile?.username || entry.name || `Player ${i + 1}`;
        const p = entry.played || entry.matchesPlayed || 0;
        const w = entry.wins || 0;
        const d = entry.draws || 0;
        const l = entry.losses || 0;
        const gf = entry.goalsFor || 0;
        const ga = entry.goalsAgainst || 0;
        const gd = gf - ga;
        const pts = entry.points || entry.totalPoints || 0;
        const pos = (i + 1).toString().padStart(2);

        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${pos} `;
        const paddedName = name.length > 17 ? name.substring(0, 15) + ".." : name.padEnd(17);
        const gdStr = (gd >= 0 ? "+" : "") + gd;

        response += `${medal} ${paddedName} ${p.toString().padStart(2)} ${w.toString().padStart(2)} ${d.toString().padStart(2)} ${l.toString().padStart(2)} ${gf.toString().padStart(3)} ${ga.toString().padStart(3)} ${gdStr.toString().padStart(4)} ${pts.toString().padStart(3)}\n`;
      });

      response += "```\n";
      response += `_${top.length} of ${sorted.length} players | P=Played W=Wins D=Draws L=Losses GF=GoalsFor GA=GoalsAgainst GD=GoalDiff Pts=Points_\n`;

      if (sorted.length > 20) {
        response += `\n_${sorted.length - 20} players not shown — table is truncated._`;
      }

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "Table command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch league table. Nexus platform may be unreachable.",
      };
    }
  },
};
