// ============================================= //
// ✅ NEXUS COMMAND — TEST INTEGRATION BOUNDARY //
// ============================================= //
// Allows users to test connectivity between the //
// WhatsApp bot and the Nexus platform.          //
// Only works if NEXUS_API_URL and              //
// NEXUS_API_SECRET are configured.              //
// ============================================= //

import { CommandHandler, IncomingMessage, OutgoingMessage } from "../types/events";
import { NexusClient, NexusApiError } from "../core/nexus-client";

export const nexusCommand: CommandHandler = {
  definition: {
    name: "nexus",
    description: "Test connectivity between the bot and the Nexus platform",
    usage: ".nexus",
    minRoleLevel: 0,
    allowDm: true,
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    const { config } = await import("../config");

    if (!config.nexusApiUrl || !config.nexusApiSecret) {
      return {
        to: message.senderJid,
        text:
          "⚠️ *Nexus integration is not configured.*\n\n" +
          "The bot operator needs to set:\n" +
          "• `NEXUS_API_URL` — the Nexus platform base URL\n" +
          "• `NEXUS_API_SECRET` — the shared API secret\n\n" +
          "Once configured, this command will test the integration boundary.",
      };
    }

    const client = new NexusClient(config.nexusApiUrl, config.nexusApiSecret);
    const startTime = Date.now();

    try {
      const health = await client.getHealth();
      const elapsedMs = Date.now() - startTime;

      const statusEmoji = health.status === "ok" ? "✅" : "⚠️";
      const dbEmoji = health.database === "connected" ? "✅" : "❌";

      return {
        to: message.senderJid,
        text:
          `*🔗 Nexus Integration Status*\n\n` +
          `${statusEmoji} *Status:* ${health.status}\n` +
          `${dbEmoji} *Database:* ${health.database}\n` +
          `📦 *Version:* ${health.version}\n` +
          `👥 *Players:* ${health.playerCount}\n` +
          `🏟️ *Active Season:* ${health.activeSeason ? `${health.activeSeason.name} (${health.activeSeason.status})` : "None"}\n` +
          `⏱️ *Response:* ${elapsedMs}ms\n` +
          `🕐 *Nexus Time:* ${new Date(health.timestamp).toLocaleString()}`,
      };
    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      const errorMessage = error instanceof NexusApiError
        ? `Nexus API error (${error.statusCode}): ${error.message}`
        : error instanceof Error
          ? error.message
          : "Unknown error";

      return {
        to: message.senderJid,
        text:
          `❌ *Nexus Integration Failed*\n\n` +
          `• *Error:* ${errorMessage}\n` +
          `• *URL:* ${config.nexusApiUrl}\n` +
          `• *Time:* ${elapsedMs}ms\n\n` +
          `The bot is running, but cannot reach the Nexus platform. ` +
          `Check that Nexus is deployed and the API secret matches.`,
      };
    }
  },
};
