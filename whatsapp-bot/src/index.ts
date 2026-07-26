import "dotenv/config";
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as fs from "fs";
import * as path from "path";
import pino from "pino";
import QRCode from "qrcode-terminal";
import { config } from "./config";
import {
  ConnectionManager,
  ConnectionState,
  isRecoverableDisconnect,
} from "./connection-manager";
import { startHealthServer } from "./health-server";
import { MessageRouter } from "./core/message-router";
import { WhatsAppSender } from "./core/whatsapp-sender";
import { eventBus } from "./core/event-bus";
import { BotEventType } from "./types/events";
import { pingCommand } from "./commands/ping.command";
import { nexusCommand } from "./commands/nexus.command";
import { helpCommand } from "./commands/help.command";
import { fixturesCommand } from "./commands/fixtures.command";
import { standingsCommand } from "./commands/standings.command";
import { resultsCommand } from "./commands/results.command";
import { nextMatchCommand } from "./commands/nextmatch.command";
import { leagueCommand } from "./commands/league.command";
import { tableCommand } from "./commands/table.command";
import { tournamentCommand } from "./commands/tournament.command";

// ============================================= //
// ✅ STRUCTURED LOGGING (pino)                 //
// ============================================= //

const logger = pino({
  name: config.botName,
  level: config.logLevel,
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

// ============================================= //
// ✅ CONNECTION MANAGER INSTANCE              //
// ============================================= //

const connectionManager = new ConnectionManager();

let connectedSince: Date | null = null;

// Log state changes
connectionManager.onStateChange((newState, previousState) => {
  logger.info(
    { from: previousState, to: newState },
    `Connection state: ${previousState} → ${newState}`
  );

  // Emit connection changed event
  eventBus.emit({
    type: BotEventType.CONNECTION_CHANGED,
    payload: {
      previousState,
      newState,
    },
    timestamp: new Date(),
  });
});

// ============================================= //
// ✅ ENSURE SESSION DIRECTORY EXISTS            //
// ============================================= //

function ensureSessionDirectory(): void {
  const sessionPath = path.resolve(config.sessionDir);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
    logger.info({ path: sessionPath }, "Created session directory");
  }
}

// ============================================= //
// ✅ START WHATSAPP BOT                        //
// ============================================= //

async function startBot(): Promise<void> {
  logger.info("Starting Nexus Esports WhatsApp bot...");

  // Reset connection manager state (clears reconnect counter, cancels pending timers)
  connectionManager.reset();
  connectionManager.setConnecting();

  ensureSessionDirectory();

  // Load authentication state from disk (persistent login)
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);

  // Fetch latest Baileys version
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, "Baileys version");

  // Create WhatsApp socket connection
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    markOnlineOnConnect: true,
    connectTimeoutMs: 30_000,
    keepAliveIntervalMs: 25_000,
    defaultQueryTimeoutMs: 60_000,
    emitOwnEvents: true,
  });

  // ============================================= //
  // ✅ INITIALIZE EVENT ARCHITECTURE             //
  // ============================================= //

  // Create WhatsApp sender adapter (wraps Baileys for the event system)
  const sender = new WhatsAppSender(sock);

  // Create and configure the message router
  const router = new MessageRouter(sender);

  // Register command handlers
router.register(pingCommand);
  router.register(nexusCommand);
  router.register(helpCommand);
  router.register(fixturesCommand);
  router.register(standingsCommand);
  router.register(resultsCommand);
  router.register(nextMatchCommand);
  router.register(leagueCommand);
  router.register(tableCommand);
  router.register(tournamentCommand);

  logger.info(
    { commandCount: router.getCommands().length },
    "Command handlers registered"
  );

  // ============================================= //
  // ✅ CONNECTION EVENT HANDLER                  //
  // ============================================= //

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 SCAN THIS QR CODE WITH WHATSAPP:\n");
      QRCode.generate(qr, { small: true });
      console.log("\n🔗 Or copy this link to view QR code:");
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}\n`);
      logger.info("📱 QR code rendered — scan with WhatsApp to authenticate");
      if (connectionManager.state === ConnectionState.LOGGED_OUT) {
        logger.info("New QR received — re-authentication in progress");
      }
    }

    if (connection === "open") {
      connectedSince = new Date();
      connectionManager.setOpen();
      logger.info(
        {
          jid: sock.user?.id,
          name: sock.user?.name,
          reconnectAttempts: connectionManager.reconnectAttempts,
        },
        "✅ WhatsApp connection established — bot is online"
      );

      eventBus.emit({
        type: BotEventType.BOT_STARTED,
        payload: {
          jid: sock.user?.id,
          botName: config.botName,
        },
        timestamp: new Date(),
      });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || "Unknown reason";
      const recoverable = isRecoverableDisconnect(statusCode);

      logger.warn(
        {
          reason,
          statusCode,
          recoverable,
          reconnectAttempts: connectionManager.reconnectAttempts,
        },
        "❌ WhatsApp connection closed"
      );

      if (statusCode === DisconnectReason.loggedOut) {
        connectionManager.setLoggedOut();
        logger.fatal(
          "Bot was logged out — QR re-scan required. The bot will NOT auto-reconnect."
        );
        return;
      }

      if (!recoverable) {
        connectionManager.setLoggedOut();
        logger.fatal(
          { statusCode },
          "Non-recoverable session error — bot cannot auto-reconnect. Manual intervention required."
        );
        return;
      }

      const delay = connectionManager.scheduleReconnect(() => {
        startBot().catch((error) => {
          logger.error({ error }, "Error during reconnection attempt");
        });
      });

      if (delay > 0) {
        logger.info(
          { delayMs: delay, attempt: connectionManager.reconnectAttempts },
          "Scheduled reconnection"
        );
      }
    }
  });

  // ============================================= //
  // ✅ AUTH STATE PERSISTENCE                    //
  // ============================================= //

  sock.ev.on("creds.update", saveCreds);

  // ============================================= //
  // ✅ INCOMING MESSAGE HANDLER (EVENT DRIVEN)   //
  // ============================================= //

  sock.ev.on("messages.upsert", async (messageUpdate) => {
    const message = messageUpdate.messages[0];

    if (!message.key || message.key.fromMe) return;
    if (!message.message) return;

    const senderJid = message.key.remoteJid;
    const isGroup = senderJid?.endsWith("@g.us");
    const senderId = message.key.participant || message.key.remoteJid;
    const pushName = message.pushName || "Unknown";

    let mediaType: "image" | "video" | "document" | "audio" | undefined;
    if (message.message.imageMessage) mediaType = "image";
    else if (message.message.videoMessage) mediaType = "video";
    else if (message.message.documentMessage) mediaType = "document";
    else if (message.message.audioMessage) mediaType = "audio";

    logger.info(
      {
        sender: senderId,
        isGroup,
        pushName,
        hasText: !!message.message.conversation,
        hasExtendedText: !!message.message.extendedTextMessage,
        hasMedia: !!mediaType,
        mediaType: mediaType,
        messageId: message.key.id,
      },
      "📩 Message received"
    );

    const messageText =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";

    if (messageText) {
      const truncatedText =
        messageText.length > 100
          ? messageText.substring(0, 100) + "..."
          : messageText;
      logger.debug({ text: truncatedText }, "Message text (truncated)");
    }

    // ✅ Route through the event-driven message architecture
    if (senderJid) {
      await router.processRawMessage({
        senderJid,
        text: messageText,
        isGroup: isGroup ?? false,
        groupJid: isGroup ? senderJid : undefined,
        pushName,
        messageId: message.key.id || "",
        hasMedia: !!mediaType,
        mediaType,
      });
    }
  });

  // ============================================= //
  // ✅ GRACEFUL SHUTDOWN HANDLER                 //
  // ============================================= //

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");

    eventBus.emit({
      type: BotEventType.BOT_SHUTTING_DOWN,
      payload: { signal },
      timestamp: new Date(),
    });

    eventBus.clear();

    connectionManager.initiateShutdown();
    try {
      sock.end(undefined);
      logger.info("WhatsApp connection closed gracefully");
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// ============================================= //
// ✅ HEALTH CHECK SERVER                       //
// ============================================= //

startHealthServer(connectionManager, () => connectedSince);

// ============================================= //
// ✅ STARTUP ERROR HANDLING                    //
// ============================================= //

startBot().catch((error) => {
  logger.error({ error }, "Fatal error starting bot");
  process.exit(1);
});