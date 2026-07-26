// ============================================= //
// ✅ WHATSAPP BOT — INTERNAL EVENT TYPES       //
// ============================================= //
// Strongly typed interfaces for the entire     //
// internal event architecture. Loosely coupled //
// layers communicate through these types only. //
// ============================================= //

// ============================================= //
// MESSAGE TYPES                                //
// ============================================= //

export interface IncomingMessage {
  /** Sender's WhatsApp JID */
  senderJid: string;
  /** The text content of the message (if any) */
  text: string;
  /** Whether this is a group message */
  isGroup: boolean;
  /** Group JID (if group message) */
  groupJid?: string;
  /** Sender's push name from WhatsApp */
  pushName: string;
  /** Raw message ID for deduplication */
  messageId: string;
  /** Whether the message has media attachments */
  hasMedia: boolean;
  /** Media type if present */
  mediaType?: "image" | "video" | "document" | "audio";
  /** Whether the message is a command (starts with prefix) */
  isCommand: boolean;
  /** The command name without prefix (e.g., "ping" from ".ping") */
  commandName?: string;
  /** Command arguments split by spaces */
  commandArgs?: string[];
  /** Raw text before trimming/lowercasing */
  rawText: string;
}

export interface OutgoingMessage {
  /** Target JID to send to */
  to: string;
  /** Message text content */
  text: string;
  /** Optional quoted message ID for replies */
  quotedMessageId?: string;
}

// ============================================= //
// EVENT TYPES (Event Bus)                      //
// ============================================= //

export enum BotEventType {
  /** Emitted when a new message is received from WhatsApp */
  MESSAGE_RECEIVED = "message.received",
  /** Emitted after a command has been processed */
  COMMAND_EXECUTED = "command.executed",
  /** Emitted when a command handler encounters an error */
  COMMAND_ERROR = "command.error",
  /** Emitted when connection state changes */
  CONNECTION_CHANGED = "connection.changed",
  /** Emitted when the bot starts up */
  BOT_STARTED = "bot.started",
  /** Emitted when the bot shuts down */
  BOT_SHUTTING_DOWN = "bot.shutting_down",
  /** Emitted for outbound notifications (from Nexus integration) */
  NOTIFICATION_SEND = "notification.send",
}

// ============================================= //
// EVENT PAYLOADS                                //
// ============================================= //

export interface MessageReceivedEvent {
  type: BotEventType.MESSAGE_RECEIVED;
  payload: IncomingMessage;
  timestamp: Date;
}

export interface CommandExecutedEvent {
  type: BotEventType.COMMAND_EXECUTED;
  payload: {
    commandName: string;
    senderJid: string;
    args: string[];
    success: boolean;
    durationMs: number;
  };
  timestamp: Date;
}

export interface CommandErrorEvent {
  type: BotEventType.COMMAND_ERROR;
  payload: {
    commandName: string;
    senderJid: string;
    error: string;
  };
  timestamp: Date;
}

export interface ConnectionChangedEvent {
  type: BotEventType.CONNECTION_CHANGED;
  payload: {
    previousState: string;
    newState: string;
  };
  timestamp: Date;
}

export interface BotStartedEvent {
  type: BotEventType.BOT_STARTED;
  payload: {
    jid?: string;
    botName: string;
  };
  timestamp: Date;
}

export interface BotShuttingDownEvent {
  type: BotEventType.BOT_SHUTTING_DOWN;
  payload: {
    signal: string;
  };
  timestamp: Date;
}

export interface NotificationSendEvent {
  type: BotEventType.NOTIFICATION_SEND;
  payload: {
    targetJid: string;
    message: OutgoingMessage;
  };
  timestamp: Date;
}

// ============================================= //
// EVENT UNION TYPE                             //
// ============================================= //

export type BotEvent =
  | MessageReceivedEvent
  | CommandExecutedEvent
  | CommandErrorEvent
  | ConnectionChangedEvent
  | BotStartedEvent
  | BotShuttingDownEvent
  | NotificationSendEvent;

// ============================================= //
// COMMAND HANDLER INTERFACES                    //
// ============================================= //

export interface CommandDefinition {
  /** The command name (without prefix, e.g. "ping") */
  name: string;
  /** Short description shown in .help */
  description: string;
  /** Usage syntax shown in .help */
  usage: string;
  /** Minimum role level required (0 = everyone, 1 = verified, 2 = mod, 3 = admin) */
  minRoleLevel: number;
  /** Whether this command requires a group chat context */
  requiresGroup?: boolean;
  /** Whether this command can be used in DMs with the bot */
  allowDm?: boolean;
}

export interface CommandHandler {
  /** Command metadata */
  definition: CommandDefinition;
  /** Execute the command */
  execute(message: IncomingMessage): Promise<OutgoingMessage | null>;
}

// ============================================= //
// WHATSAPP SENDER INTERFACE                     //
// ============================================= //

export interface IWhatsAppSender {
  sendMessage(to: string, text: string, quotedMessageId?: string): Promise<void>;
}

// ============================================= //
// EVENT BUS INTERFACE                           //
// ============================================= //

export type EventListener<T = any> = (event: T) => void | Promise<void>;

export interface IEventBus {
  emit(event: BotEvent): void;
  on(eventType: BotEventType, listener: EventListener): () => void;
  off(eventType: BotEventType, listener: EventListener): void;
  clear(): void;
  listenerCount(eventType: BotEventType): number;
}
