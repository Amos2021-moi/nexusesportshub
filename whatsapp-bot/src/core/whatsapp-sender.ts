// ============================================= //
// ✅ WHATSAPP SENDER — BAILEYS ADAPTER          //
// ============================================= //
// Single point of contact for sending messages //
// via Baileys. The rest of the bot never needs //
// to import Baileys directly — it uses this   //
// adapter through the IWhatsAppSender interface.//
// ============================================= //

import type { WASocket } from "@whiskeysockets/baileys";
import { IWhatsAppSender } from "../types/events";
import { createLogger } from "./logger";

const log = createLogger("whatsapp-sender");

// ============================================= //
// ✅ WHATSAPP SENDER IMPLEMENTATION            //
// ============================================= //

export class WhatsAppSender implements IWhatsAppSender {
  private sock: WASocket;

  constructor(sock: WASocket) {
    this.sock = sock;
  }

  /**
   * Update the underlying socket reference (used after reconnect).
   */
  updateSocket(sock: WASocket): void {
    this.sock = sock;
    log.info("WhatsApp sender socket reference updated");
  }

  /**
   * Send a text message to a JID.
   */
  async sendMessage(to: string, text: string, quotedMessageId?: string): Promise<void> {
    try {
      const messageOptions: any = {
        text,
      };

      // Add quoted message if provided (creates a reply-style message)
      if (quotedMessageId) {
        messageOptions.quoted = {
          key: {
            id: quotedMessageId,
            remoteJid: to,
            fromMe: false,
          },
          message: {
            conversation: "",
          },
        };
      }

      await this.sock.sendMessage(to, messageOptions);

      log.debug(
        {
          to,
          textLength: text.length,
          hasQuoted: !!quotedMessageId,
        },
        "Message sent"
      );
    } catch (error) {
      log.error({ to, error }, "Failed to send message");
      throw error;
    }
  }
}
