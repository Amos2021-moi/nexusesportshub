// ============================================= //
// ✅ MESSAGE ROUTER — COMMAND DISPATCHER       //
// ============================================= //
// Parses inbound WhatsApp messages, identifies //
// commands (prefixed with .), and routes them  //
// to the appropriate handler. Emits events for //
// loose coupling with other subsystems.        //
// ============================================= //

import { BotEventType, CommandHandler, IncomingMessage, IWhatsAppSender } from "../types/events";
import { eventBus } from "./event-bus";
import { createLogger } from "./logger";
import { isGroupAllowed } from "../middleware/group-allowlist";
import { isRateLimited } from "../middleware/rate-limiter";

const log = createLogger("message-router");

// ============================================= //
// ✅ DEFAULT COMMAND PREFIX                    //
// ============================================= //

const COMMAND_PREFIX = ".";

// ============================================= //
// ✅ MESSAGE ROUTER CLASS                     //
// ============================================= //

export class MessageRouter {
  private handlers: Map<string, CommandHandler> = new Map();
  private sender: IWhatsAppSender;

  constructor(sender: IWhatsAppSender) {
    this.sender = sender;
  }

  /**
   * Register a command handler.
   * Throws if a handler with the same name is already registered.
   */
  register(handler: CommandHandler): void {
    const name = handler.definition.name.toLowerCase();

    if (this.handlers.has(name)) {
      throw new Error(`Command handler already registered: .${name}`);
    }

    this.handlers.set(name, handler);
    log.info(
      {
        command: `.${name}`,
        description: handler.definition.description,
        minRoleLevel: handler.definition.minRoleLevel,
      },
      `Registered command: .${name}`
    );
  }

  /**
   * Remove a registered command handler.
   */
  unregister(name: string): void {
    this.handlers.delete(name.toLowerCase());
    log.info({ command: name }, `Unregistered command: .${name}`);
  }

  /**
   * Get the list of all registered command definitions.
   */
  getCommands(): CommandHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Process an incoming raw message from WhatsApp.
   * Parses it, identifies if it's a command, and routes it.
   */
  async processRawMessage(params: {
    senderJid: string;
    text: string;
    isGroup: boolean;
    groupJid?: string;
    pushName: string;
    messageId: string;
    hasMedia: boolean;
    mediaType?: "image" | "video" | "document" | "audio";
  }): Promise<void> {
    const { senderJid, text, isGroup, groupJid, pushName, messageId, hasMedia, mediaType } = params;
    const rawText = text;

    // Normalize text
    const normalizedText = text.trim();

    // Determine if this is a command
    const isCommand = normalizedText.startsWith(COMMAND_PREFIX) && normalizedText.length > 1;

    let commandName: string | undefined;
    let commandArgs: string[] | undefined;

    if (isCommand) {
      // Remove the prefix and split into command + args
      const withoutPrefix = normalizedText.slice(COMMAND_PREFIX.length);
      const parts = withoutPrefix.split(/\s+/);
      commandName = parts[0]?.toLowerCase();
      commandArgs = parts.slice(1);
    }

    // Build the IncomingMessage object
    const incomingMessage: IncomingMessage = {
      senderJid,
      text: normalizedText,
      isGroup,
      groupJid,
      pushName,
      messageId,
      hasMedia,
      mediaType,
      isCommand,
      commandName,
      commandArgs,
      rawText,
    };

    // ✅ SECURITY: Check group allowlist before processing
    if (!isGroupAllowed(incomingMessage)) {
      log.debug(
        { groupJid: incomingMessage.groupJid, sender: incomingMessage.senderJid },
        "Message from unauthorized group — silently ignored"
      );
      return;
    }

    // Emit the message received event
    eventBus.emit({
      type: BotEventType.MESSAGE_RECEIVED,
      payload: incomingMessage,
      timestamp: new Date(),
    });

    // If not a command, nothing more to do here
    if (!isCommand || !commandName) {
      return;
    }

    // ✅ SECURITY: Rate limit check for commands only
    if (isRateLimited(incomingMessage)) {
      await this.sender.sendMessage(
        senderJid,
        "⏳ *Rate limit reached.* Please wait a moment before sending another command."
      );

      eventBus.emit({
        type: BotEventType.COMMAND_ERROR,
        payload: {
          commandName,
          senderJid,
          error: "Rate limited",
        },
        timestamp: new Date(),
      });
      return;
    }

    // Route the command
    await this.routeCommand(incomingMessage);
  }

  /**
   * Route a command to its registered handler.
   * Includes role-level permission check.
   */
  private async routeCommand(message: IncomingMessage): Promise<void> {
    const { commandName, senderJid, commandArgs } = message;

    if (!commandName) return;

    const handler = this.handlers.get(commandName);

    if (!handler) {
      log.debug({ command: commandName }, "Unknown command — no handler registered");
      // Optionally send an "unknown command" response
      await this.sender.sendMessage(
        senderJid,
        `❌ Unknown command: \`${commandName}\`. Type \`.help\` to see available commands.`
      );

      eventBus.emit({
        type: BotEventType.COMMAND_ERROR,
        payload: {
          commandName,
          senderJid,
          error: "Unknown command",
        },
        timestamp: new Date(),
      });
      return;
    }

    // ✅ SECURITY: Check admin permission if command requires it
    if (handler.definition.minRoleLevel >= 3) {
      const { isAdmin } = await import("../middleware/admin-check");
      if (!isAdmin(message)) {
        await this.sender.sendMessage(
          senderJid,
          `⛔ *Access denied.* The \`.${commandName}\` command is restricted to bot administrators.`
        );
        return;
      }
    }

    // Execute the handler
    const startTime = performance.now();

    try {
      const response = await handler.execute(message);

      const durationMs = Math.round(performance.now() - startTime);

      // Send response if the handler returned one
      if (response) {
        await this.sender.sendMessage(
          response.to || senderJid,
          response.text,
          response.quotedMessageId
        );
      }

      log.info(
        {
          command: commandName,
          sender: senderJid,
          durationMs,
          args: commandArgs,
        },
        `✅ Command executed: .${commandName}`
      );

      eventBus.emit({
        type: BotEventType.COMMAND_EXECUTED,
        payload: {
          commandName,
          senderJid,
          args: commandArgs || [],
          success: true,
          durationMs,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      log.error(
        { command: commandName, sender: senderJid, error: errorMessage, durationMs },
        `❌ Command failed: .${commandName}`
      );

      // Send a friendly error message — never expose internals
      await this.sender.sendMessage(
        senderJid,
        `❌ Sorry, something went wrong while processing \`.${commandName}\`. The issue has been logged.`
      );

      eventBus.emit({
        type: BotEventType.COMMAND_ERROR,
        payload: {
          commandName,
          senderJid,
          error: errorMessage,
        },
        timestamp: new Date(),
      });
    }
  }
}
