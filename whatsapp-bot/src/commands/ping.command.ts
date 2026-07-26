// ============================================= //
// ✅ PING COMMAND — CONNECTION TEST            //
// ============================================= //
// Simple command to test the bot is alive and  //
// responding. Returns round-trip timing info.  //
// ============================================= //

import {
  CommandHandler,
  IncomingMessage,
  OutgoingMessage,
} from "../types/events";

import { config } from "../config";
import { createLogger } from "../core/logger";

const log = createLogger("command.ping");

// ============================================= //
// ✅ PING COMMAND HANDLER                      //
// ============================================= //

export const pingCommand: CommandHandler = {
  definition: {
    name: "ping",
    description: "Check if the bot is online and responding",
    usage: ".ping",
    minRoleLevel: 0, // Everyone can use
  },

  async execute(message: IncomingMessage): Promise<OutgoingMessage | null> {
    log.debug({ sender: message.senderJid }, "Ping command executed");

    return {
      to: message.senderJid,
      text: `🏓 Pong! *${config.botName}* is online and responding.\n\n_Server time: ${new Date().toISOString()}_`,
    };
  },
};
