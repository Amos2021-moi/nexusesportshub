// ============================================= //
// ✅ TOURNAMENT COMMAND — TOURNAMENT INFO       //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { getNexusClient } from "../core/nexus-client";
import { createLogger } from "../core/logger";

const log = createLogger("command.tournament");

export const tournamentCommand: CommandHandler = {
  definition: {
    name: "tournament",
    description: "View active tournament information and brackets",
    usage: ".tournament",
    minRoleLevel: 1,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    try {
      const client = getNexusClient();
      const data = await client.getTournaments();
      const tournaments = Array.isArray(data) ? data : data?.tournaments || data?.data || data || [];

      if (!Array.isArray(tournaments) || tournaments.length === 0) {
        return {
          to: message.senderJid,
          text: "🏆 *No active tournaments.*\n\nThere are no tournaments running at the moment.",
        };
      }

      // Find active or most recent tournament
      const active = tournaments.find((t: any) => t.status === "ACTIVE")
        || tournaments.find((t: any) => t.status === "PENDING")
        || tournaments[0];

      let response = "╔══════════════════════════════╗\n";
      response += "║        *🏆 TOURNAMENT*        ║\n";
      response += "╚══════════════════════════════╝\n\n";
      response += `*${active.name}*\n`;
      response += `${active.description || "Nexus Esports Tournament"}\n\n`;
      response += `📅 *Status:* ${active.status}\n`;
      response += `🎮 *Type:* ${active.type || "Single Elimination"}\n`;
      response += `👥 *Participants:* ${active.participants?.length || active._count?.participants || "TBD"}\n`;
      response += `🎯 *Max Players:* ${active.maxPlayers || "N/A"}\n`;

      if (active.startDate) {
        response += `📆 *Started:* ${new Date(active.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}\n`;
      }
      if (active.endDate) {
        response += `🏁 *Ends:* ${new Date(active.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}\n`;
      }

      // Show match count
      const matchCount = active.matches?.length || active._count?.matches || 0;
      if (matchCount > 0) {
        const completed = active.matches?.filter((m: any) => m.status === "COMPLETED").length || 0;
        response += `\n⚔️ *Matches:* ${completed}/${matchCount} completed\n`;
      }

      // Show participants if available
      if (active.participants?.length > 0) {
        response += `\n👥 *Participants:*\n`;
        for (const p of active.participants.slice(0, 8)) {
          const name = p.player?.name || p.player?.profile?.username || "Player";
          const seed = p.seed ? `(#${p.seed})` : "";
          response += `  • ${name} ${seed}\n`;
        }
        if (active.participants.length > 8) {
          response += `  ... and ${active.participants.length - 8} more\n`;
        }
      }

      return { to: message.senderJid, text: response };
    } catch (error: any) {
      log.error({ error: error.message }, "Tournament command failed");
      return {
        to: message.senderJid,
        text: "❌ Failed to fetch tournament info. Nexus platform may be unreachable.",
      };
    }
  },
};
